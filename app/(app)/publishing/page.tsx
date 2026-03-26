'use client';

import { useState } from 'react';
import { useTable, insert, update, remove, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, FormGrid, WeekHeader, PageLoader, ConfirmDialog } from '@/components/ui/shared';
import { SearchInput, ViewToggle } from '@/components/ui/shared';
import { formatDate } from '@/lib/utils';
import { PUBLISH_STATUSES, PLATFORMS } from '@/lib/constants';
import { WEEKS } from '@/lib/utils';
import type { PublishItem } from '@/types';

const emptyForm = { client_name: '', title: '', caption: '', scheduled_date: '', platform: '', status: 'pending_caption', week_num: '1' };

export default function PublishingPage() {
  const { data: items, setData: setItems, loading, refetch } = useTable<PublishItem>('publishing', 'created_at');
  const { data: activeClients } = useTable<{ id: string; name: string }>('clients', 'name');
  const { data: onboardingItems } = useTable<{ id: string; client_name: string; status: string }>('onboarding', 'created_at');
  const { user, role } = useAuth();
  // Only admins and social managers can edit publishing
  const canEditPublishing = role.canManageUsers || (user as any)?.role === 'social';
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'weekly' | 'board'>('weekly');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<PublishItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const filtered = items.filter(i => !search || i.client_name.toLowerCase().includes(search.toLowerCase()) || i.title.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm(emptyForm); setEditItem(null); setModal('new'); };
  const openEdit = (item: PublishItem) => {
    setForm({ client_name: item.client_name, title: item.title, caption: item.caption || '', scheduled_date: item.scheduled_date || '', platform: item.platform || '', status: item.status, week_num: String(item.week_num) });
    setEditItem(item); setModal('edit');
  };

  const handleSave = async () => {
    if (!form.client_name || !form.title) return;
    const payload = { ...form, week_num: Number(form.week_num), scheduled_date: form.scheduled_date || null };
    if (modal === 'edit' && editItem) { await update('publishing', editItem.id, payload); }
    else { await insert('publishing', payload); }
    await log(modal === 'edit' ? 'Content updated' : 'Content added', `${form.title} (${form.client_name})`, 'publishing', 'success', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  const handleDelete = async (id: string) => {
    await remove('publishing', id);
    await log('Content removed', '', 'publishing', 'info', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const bulkMoveStatus = async (statusKey: string) => {
    const ids = new Set(selectedIds);
    setItems(prev => prev.map(i => ids.has(i.id) ? { ...i, status: statusKey as PublishItem['status'] } : i));
    setSelectedIds(new Set());
    await Promise.all([...ids].map(id => update('publishing', id, { status: statusKey })));
    await log(`Moved ${ids.size} items to ${PUBLISH_STATUSES.find(s => s.key === statusKey)?.label}`, '', 'publishing', 'success', user?.name || 'System');
  };

  const bulkDelete = async () => {
    const ids = new Set(selectedIds);
    setItems(prev => prev.filter(i => !ids.has(i.id)));
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    await Promise.all([...ids].map(id => remove('publishing', id)));
    await log(`Deleted ${ids.size} content items`, '', 'publishing', 'info', user?.name || 'System');
  };

  const handleDrop = async (statusKey: string) => {
    if (!dragId) return;
    await update('publishing', dragId, { status: statusKey });
    setDragId(null); setDragOver(null); refetch();
  };

  const statusMap = Object.fromEntries(PUBLISH_STATUSES.map(s => [s.key, s]));

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Publishing" subtitle="Content calendar grouped by delivery week.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search content..." />
        <ViewToggle options={[{ key: 'weekly', label: 'Weekly' }, { key: 'board', label: 'Board' }]} value={view} onChange={v => setView(v as 'weekly' | 'board')} />
        {canEditPublishing && view === 'weekly' && (
          <GhostButton onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); }}>
            {selectMode ? 'Cancel' : 'Select'}
          </GhostButton>
        )}
        {canEditPublishing && !selectMode && <PrimaryButton onClick={openNew}>+ New content</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {PUBLISH_STATUSES.map(s => (
          <MetricCard key={s.key} label={s.label} value={filtered.filter(i => i.status === s.key).length} accent={s.color} />
        ))}
      </div>

      {view === 'weekly' ? (
        <>
          {WEEKS.map(w => {
            const weekItems = filtered.filter(i => i.week_num === w.num);
            const isCollapsed = collapsed[w.num] ?? false;
            return (
              <div key={w.num} style={{ marginBottom: 6 }}>
                <WeekHeader
                  weekNum={w.num} label={w.label} dateRange={w.dateRange}
                  count={weekItems.length} vTarget={0} vComplete={0}
                  collapsed={isCollapsed}
                  onToggle={() => setCollapsed(p => ({ ...p, [w.num]: !isCollapsed }))}
                />
                {!isCollapsed && weekItems.length > 0 && (
                  <div className="table-wrap" style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                    <table>
                      <thead>
                        <tr>
                          {selectMode && <th style={{ width: 36 }} />}
                          <th style={{ width: '28%' }}>Title</th>
                          <th style={{ width: '16%' }}>Client</th>
                          <th style={{ width: '13%' }}>Platform</th>
                          <th style={{ width: '14%' }}>Status</th>
                          <th style={{ width: '12%' }}>Scheduled</th>
                          <th style={{ width: '17%' }}>Caption</th>
                          <th style={{ width: '5%' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {weekItems.map(item => {
                          const st = statusMap[item.status];
                          return (
                            <tr key={item.id} className={canEditPublishing && !selectMode ? 'clickable-row' : ''} style={{ background: selectedIds.has(item.id) ? 'rgba(127,119,221,0.08)' : undefined }} onClick={() => { if (selectMode) toggleSelect(item.id); else if (canEditPublishing) openEdit(item); }}>
                              {selectMode && (
                                <td style={{ textAlign: 'center', padding: '0 8px' }} onClick={e => e.stopPropagation()}>
                                  <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} style={{ accentColor: '#7F77DD', width: 14, height: 14, cursor: 'pointer' }} />
                                </td>
                              )}
                              <td style={{ fontWeight: 600 }}>{item.title}</td>
                              <td style={{ color: 'var(--mut)', fontSize: 12 }}>{item.client_name}</td>
                              <td>{item.platform ? <Badge color="#7F77DD">{item.platform}</Badge> : <span style={{ color: 'var(--mut)', fontSize: 12 }}>—</span>}</td>
                              <td><Badge color={st?.color || '#888'}>{st?.label}</Badge></td>
                              <td style={{ color: 'var(--mut)', fontSize: 12 }}>{item.scheduled_date ? formatDate(item.scheduled_date) : '—'}</td>
                              <td style={{ fontSize: 11, color: 'var(--mut)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.caption || '—'}</td>
                              <td>
                                {canEditPublishing && (
                                  <button aria-label="Delete content" onClick={e => { e.stopPropagation(); setConfirmDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: '4px 6px' }}>✕</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {!isCollapsed && weekItems.length === 0 && (
                  <div style={{ padding: '12px 16px', color: 'var(--mut)', fontSize: 13, marginBottom: 10 }}>No content this week.</div>
                )}
              </div>
            );
          })}
          {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)' }}>No content found.</div>}
        </>
      ) : (
        <div className="kanban-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${PUBLISH_STATUSES.length}, minmax(0,1fr))`, gap: 8 }}>
          {PUBLISH_STATUSES.map(status => {
            const colItems = filtered.filter(i => i.status === status.key);
            const isOver = dragOver === status.key;
            return (
              <div
                key={status.key}
                className={`kanban-col${isOver ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(status.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(status.key)}
                style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '10px 8px', minHeight: 200, border: '1px solid var(--brd)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: status.color }}>{status.label}</span>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--mut)', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>{colItems.length}</span>
                </div>
                {colItems.map(item => (
                  <div
                    key={item.id}
                    draggable={canEditPublishing}
                    onDragStart={() => setDragId(item.id)}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    onClick={() => { if (canEditPublishing) openEdit(item); }}
                    style={{
                      background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: 8,
                      padding: '10px 12px', marginBottom: 6,
                      cursor: canEditPublishing ? 'grab' : 'default',
                      opacity: dragId === item.id ? 0.45 : 1,
                      transition: 'opacity 0.15s',
                      borderLeft: `2px solid ${status.color}`,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 6 }}>{item.client_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.platform && <Badge color="#7F77DD">{item.platform}</Badge>}
                      {item.scheduled_date && <span style={{ fontSize: 10, color: 'var(--mut)' }}>{formatDate(item.scheduled_date)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit content' : 'New content'} width={560}>
        <FormGrid>
          <FormRow label="Client" required>
            <select value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}>
              <option value="">Select client...</option>
              {activeClients.length > 0 && <optgroup label="Active Clients">{activeClients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</optgroup>}
              {onboardingItems.filter(o => o.status === 'in_progress').length > 0 && <optgroup label="Onboarding">{onboardingItems.filter(o => o.status === 'in_progress').map(o => <option key={o.id} value={o.client_name}>{o.client_name}</option>)}</optgroup>}
            </select>
          </FormRow>
          <FormRow label="Title" required><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></FormRow>
          <FormRow label="Platform"><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}><option value="">Select...</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></FormRow>
          <FormRow label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{PUBLISH_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></FormRow>
          <FormRow label="Scheduled date"><input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></FormRow>
          <FormRow label="Week"><select value={form.week_num} onChange={e => setForm({ ...form, week_num: e.target.value })}>{[1,2,3,4].map(w => <option key={w} value={w}>Week {w}</option>)}</select></FormRow>
        </FormGrid>
        <FormRow label="Caption"><textarea value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} rows={3} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && canEditPublishing && <DangerButton onClick={() => setConfirmDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
            {canEditPublishing && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save changes' : 'Add content'}</PrimaryButton>}
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete content?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) { handleDelete(confirmDelete); setConfirmDelete(null); } }}
      />
      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Delete ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}?`}
        message="This will permanently delete all selected content."
        confirmLabel="Delete all"
        danger
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={bulkDelete}
      />
      {selectMode && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200, minWidth: 380 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', flex: 1 }}>
            {selectedIds.size === 0 ? 'Select content to act on' : `${selectedIds.size} selected`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--mut)', whiteSpace: 'nowrap' }}>Move to</span>
            <select
              disabled={selectedIds.size === 0}
              defaultValue=""
              onChange={e => { if (e.target.value) { bulkMoveStatus(e.target.value); e.target.value = ''; } }}
              style={{ background: 'var(--bg-2)', color: 'var(--fg)', border: '1px solid var(--brd)', borderRadius: 7, padding: '5px 8px', fontSize: 12, cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedIds.size === 0 ? 0.4 : 1 }}
            >
              <option value="" disabled>Status...</option>
              {PUBLISH_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <DangerButton onClick={() => setConfirmBulkDelete(true)} disabled={selectedIds.size === 0}>Delete</DangerButton>
        </div>
      )}
    </div>
  );
}
