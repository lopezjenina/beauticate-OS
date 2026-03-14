'use client';

import { useState } from 'react';
import { useTable, insert, update, remove, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, FormGrid, SearchInput } from '@/components/ui/shared';
import { formatDate } from '@/lib/utils';
import { PUBLISH_STATUSES, PLATFORMS } from '@/lib/constants';
import type { PublishItem } from '@/types';

const emptyForm = { client_name: '', title: '', caption: '', scheduled_date: '', platform: '', status: 'pending_caption', week_num: '1' };

export default function PublishingPage() {
  const { data: items, loading, refetch } = useTable<PublishItem>('publishing', 'created_at');
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<PublishItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = items.filter(i => !search || i.client_name.toLowerCase().includes(search.toLowerCase()) || i.title.toLowerCase().includes(search.toLowerCase()));
  const pending = filtered.filter(i => i.status === 'pending_caption').length;
  const scheduled = filtered.filter(i => i.status === 'scheduled').length;
  const posted = filtered.filter(i => i.status === 'posted').length;

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

  const handleDrop = async (statusKey: string) => {
    if (!dragId) return;
    await update('publishing', dragId, { status: statusKey });
    await log('Content status changed', statusKey, 'publishing', 'info', user?.name || 'System');
    setDragId(null); refetch();
  };

  return (
    <div>
      <PageHeader title="Publishing" subtitle="Content calendar — drag cards to update status.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search..." />
        <div style={{ display: 'flex', border: '1px solid var(--brd)', borderRadius: 8, overflow: 'hidden' }}>
          {(['board', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', background: view === v ? 'rgba(127,119,221,.15)' : 'transparent', color: view === v ? '#7F77DD' : 'var(--mut)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{v === 'board' ? 'Board' : 'List'}</button>
          ))}
        </div>
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New content</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Pending" value={pending} accent="#E24B4A" />
        <MetricCard label="Scheduled" value={scheduled} accent="#378ADD" />
        <MetricCard label="Posted" value={posted} accent="#639922" />
      </div>

      {view === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PUBLISH_STATUSES.length}, minmax(0,1fr))`, gap: 8 }}>
          {PUBLISH_STATUSES.map(status => {
            const colItems = filtered.filter(i => i.status === status.key);
            return (
              <div key={status.key} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(status.key)} style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 10, minHeight: 200, border: '1px solid var(--brd)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: status.color }}>{status.label}</span>
                  <span style={{ fontSize: 11, background: status.color + '1A', color: status.color, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{colItems.length}</span>
                </div>
                {colItems.map(item => (
                  <div key={item.id} draggable={role.canEdit} onDragStart={() => setDragId(item.id)} onDragEnd={() => setDragId(null)} onClick={() => openEdit(item)}
                    style={{ background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: role.canEdit ? 'grab' : 'pointer', borderLeft: `3px solid ${status.color}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--mut)' }}>{item.client_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      {item.platform && <Badge color="#7F77DD">{item.platform}</Badge>}
                      {item.scheduled_date && <span style={{ fontSize: 10, color: 'var(--mut)' }}>{formatDate(item.scheduled_date)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--brd)', overflow: 'hidden' }}>
          <table><thead><tr>{['Title', 'Client', 'Platform', 'Status', 'Scheduled', ''].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(item => { const st = PUBLISH_STATUSES.find(s => s.key === item.status); return (
            <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(item)}>
              <td style={{ fontWeight: 600 }}>{item.title}</td>
              <td style={{ color: 'var(--mut)' }}>{item.client_name}</td>
              <td><Badge color="#7F77DD">{item.platform || '—'}</Badge></td>
              <td><Badge color={st?.color || '#888'}>{st?.label}</Badge></td>
              <td style={{ color: 'var(--mut)', fontSize: 12 }}>{item.scheduled_date ? formatDate(item.scheduled_date) : '—'}</td>
              <td>{role.canDelete && <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer' }}>✕</button>}</td>
            </tr>); })}</tbody></table>
        </div>
      )}

      {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)' }}>No content found.</div>}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit content' : 'New content'}>
        <FormGrid>
          <FormRow label="Client" required><input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></FormRow>
          <FormRow label="Title" required><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></FormRow>
          <FormRow label="Platform"><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}><option value="">Select...</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></FormRow>
          <FormRow label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{PUBLISH_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></FormRow>
          <FormRow label="Scheduled"><input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></FormRow>
          <FormRow label="Week"><select value={form.week_num} onChange={e => setForm({ ...form, week_num: e.target.value })}>{[1,2,3,4].map(w => <option key={w} value={w}>Week {w}</option>)}</select></FormRow>
        </FormGrid>
        <FormRow label="Caption"><textarea value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} rows={4} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && role.canDelete && <DangerButton onClick={() => handleDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
            {role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save' : 'Add content'}</PrimaryButton>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
