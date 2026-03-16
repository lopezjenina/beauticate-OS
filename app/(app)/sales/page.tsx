'use client';

import { useState } from 'react';
import { useSales, useProfile, useActivityLog, useRealtime } from '@/lib/hooks';
import { PageHeader, MetricCard, Badge, Modal, FormRow, FormGrid, PrimaryButton, GhostButton, DangerButton, ConfirmDialog } from '@/components/ui';
import { SearchInput, ViewToggle } from '@/components/ui/shared';
import { SALES_STAGES, LEAD_SOURCES } from '@/lib/constants';
import { formatPeso, formatPesoK } from '@/lib/utils';
import type { Sale } from '@/types';

const ROLES_MAP = { admin: { canEdit: true, canDelete: true }, editor: { canEdit: true, canDelete: false }, social: { canEdit: false, canDelete: false }, viewer: { canEdit: false, canDelete: false } };

export default function SalesPage() {
  const { sales, upsert, remove, updateStage, reload } = useSales();
  const { profile } = useProfile();
  const { addLog } = useActivityLog();
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Sale | null>(null);
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', deal_value: '', source: '', notes: '', stage: 'lead' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useRealtime('sales', reload);

  const role = profile?.role ? (ROLES_MAP[profile.role as keyof typeof ROLES_MAP] || ROLES_MAP.viewer) : ROLES_MAP.viewer;
  const filtered = sales.filter(s => !search || s.company_name.toLowerCase().includes(search.toLowerCase()) || s.contact_name.toLowerCase().includes(search.toLowerCase()));
  const pipeVal = filtered.filter(s => !['closed_won', 'closed_lost'].includes(s.stage)).reduce((a, b) => a + b.deal_value, 0);
  const wonVal = filtered.filter(s => s.stage === 'closed_won').reduce((a, b) => a + b.deal_value, 0);
  const active = filtered.filter(s => !['closed_won', 'closed_lost'].includes(s.stage)).length;

  const openNew = () => { setForm({ company_name: '', contact_name: '', email: '', phone: '', deal_value: '', source: '', notes: '', stage: 'lead' }); setEditItem(null); setModal('new'); };
  const openEdit = (item: Sale) => { setForm({ company_name: item.company_name, contact_name: item.contact_name, email: item.email || '', phone: item.phone || '', deal_value: String(item.deal_value), source: item.source || '', notes: item.notes || '', stage: item.stage }); setEditItem(item); setModal('edit'); };

  const handleSave = async () => {
    if (!form.company_name || !form.contact_name) return;
    const data = { ...form, deal_value: Number(form.deal_value) || 0 };
    if (modal === 'edit' && editItem) { await upsert({ id: editItem.id, ...data }); } else { await upsert({ ...data, deal_date: new Date().toISOString().slice(0, 10) }); }
    await addLog(modal === 'edit' ? 'Deal updated' : 'Lead added', form.company_name, 'sales', 'success', profile?.name || '');
    setModal(null); setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    await addLog('Deal deleted', '', 'sales', 'info', profile?.name || '');
    setModal(null); setEditItem(null);
  };

  const handleDrop = async (stageKey: string) => {
    if (!dragId) return;
    await updateStage(dragId, stageKey);
    setDragId(null); setDragOver(null);
  };

  return (
    <div>
      <PageHeader title="Sales Pipeline" subtitle="Drag cards to move deals between stages.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search..." />
        <ViewToggle options={[{ key: 'board', label: 'Board' }, { key: 'list', label: 'List' }]} value={view} onChange={v => setView(v as 'board' | 'list')} />
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New lead</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <MetricCard label="Pipeline" value={formatPesoK(pipeVal)} />
        <MetricCard label="Closed won" value={formatPesoK(wonVal)} accent="#4ade80" />
        <MetricCard label="Active leads" value={active} />
      </div>

      {view === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SALES_STAGES.length}, minmax(0,1fr))`, gap: 8 }}>
          {SALES_STAGES.map(stage => {
            const items = filtered.filter(s => s.stage === stage.key);
            const isOver = dragOver === stage.key;
            return (
              <div
                key={stage.key}
                className={`kanban-col${isOver ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(stage.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(stage.key)}
                style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '10px 8px', minHeight: 220, border: '1px solid var(--brd)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: stage.color }}>{stage.label}</span>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--mut)', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>{items.length}</span>
                </div>
                {items.map(item => (
                  <div
                    key={item.id}
                    draggable={role.canEdit}
                    onDragStart={() => setDragId(item.id)}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    onClick={() => openEdit(item)}
                    style={{
                      background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: 8,
                      padding: '10px 12px', marginBottom: 6,
                      cursor: role.canEdit ? 'grab' : 'pointer',
                      opacity: dragId === item.id ? 0.45 : 1,
                      transition: 'opacity 0.15s',
                      borderLeft: `2px solid ${stage.color}`,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.company_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 6 }}>{item.contact_name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>{formatPeso(item.deal_value)}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--brd)', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>{['Company', 'Contact', 'Value', 'Stage', 'Source', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const stg = SALES_STAGES.find(s => s.key === item.stage);
                return (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(item)}>
                    <td style={{ fontWeight: 600 }}>{item.company_name}</td>
                    <td style={{ color: 'var(--mut)' }}>{item.contact_name}</td>
                    <td style={{ fontWeight: 600 }}>{formatPeso(item.deal_value)}</td>
                    <td><Badge color={stg?.color || '#888'}>{stg?.label}</Badge></td>
                    <td style={{ color: 'var(--mut)', fontSize: 12 }}>{item.source || '—'}</td>
                    <td>
                      {role.canDelete && (
                        <button aria-label="Delete deal" onClick={e => { e.stopPropagation(); setConfirmDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: '4px 6px', borderRadius: 4 }}>✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>No deals found.</div>}
        </div>
      )}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit deal' : 'New lead'}>
        <FormGrid>
          <FormRow label="Company" required><input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></FormRow>
          <FormRow label="Contact" required><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></FormRow>
          <FormRow label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></FormRow>
          <FormRow label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></FormRow>
          <FormRow label="Value ($)"><input type="number" value={form.deal_value} onChange={e => setForm({ ...form, deal_value: e.target.value })} /></FormRow>
          <FormRow label="Source"><select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}><option value="">Select...</option>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}</select></FormRow>
          <FormRow label="Stage"><select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>{SALES_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></FormRow>
        </FormGrid>
        <FormRow label="Notes" span><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && role.canDelete && <DangerButton onClick={() => setConfirmDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
            {role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save changes' : 'Add lead'}</PrimaryButton>}
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete deal?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) { handleDelete(confirmDelete); setConfirmDelete(null); } }}
      />
    </div>
  );
}
