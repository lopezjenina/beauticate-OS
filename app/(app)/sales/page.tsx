'use client';

import { useState } from 'react';
import { useSales, useProfile, useActivityLog, useRealtime } from '@/lib/hooks';
import { PageHeader, MetricCard, Badge, Modal, FormRow, FormGrid, PrimaryButton, GhostButton, DangerButton } from '@/components/ui';
import { SALES_STAGES, LEAD_SOURCES, ROLES } from '@/lib/constants';
import { formatPeso, formatPesoK, pct } from '@/lib/utils';
import type { Sale } from '@/types';

export default function SalesPage() {
  const { sales, upsert, remove, updateStage, reload } = useSales();
  const { profile } = useProfile();
  const { addLog } = useActivityLog();
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [dragId, setDragId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Sale | null>(null);
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', deal_value: '', source: '', notes: '', stage: 'lead' });

  useRealtime('sales', reload);
  const role = ROLES[profile?.role || 'viewer'];

  const filtered = sales.filter(s => !search || s.company_name.toLowerCase().includes(search.toLowerCase()) || s.contact_name.toLowerCase().includes(search.toLowerCase()));
  const pipeVal = filtered.filter(s => !['closed_won', 'closed_lost'].includes(s.stage)).reduce((a, b) => a + b.deal_value, 0);
  const wonVal = filtered.filter(s => s.stage === 'closed_won').reduce((a, b) => a + b.deal_value, 0);

  const openNew = () => { setForm({ company_name: '', contact_name: '', email: '', phone: '', deal_value: '', source: '', notes: '', stage: 'lead' }); setEditItem(null); setModal('new'); };
  const openEdit = (item: Sale) => { setForm({ company_name: item.company_name, contact_name: item.contact_name, email: item.email || '', phone: item.phone || '', deal_value: String(item.deal_value), source: item.source || '', notes: item.notes || '', stage: item.stage }); setEditItem(item); setModal('edit'); };

  const handleSave = async () => {
    if (!form.company_name || !form.contact_name) return;
    const data = { ...form, deal_value: Number(form.deal_value) || 0 };
    if (modal === 'edit' && editItem) { await upsert({ id: editItem.id, ...data }); } else { await upsert({ ...data, deal_date: new Date().toISOString().slice(0, 10) }); }
    await addLog(modal === 'edit' ? 'Deal updated' : 'Lead added', form.company_name, 'sales', 'success', profile?.name || '');
    setModal(null); setEditItem(null);
  };
  const handleDelete = async (id: string) => { await remove(id); await addLog('Deal deleted', '', 'sales', 'info', profile?.name || ''); setModal(null); setEditItem(null); };
  const handleDrop = async (stageKey: string) => { if (!dragId) return; await updateStage(dragId, stageKey); setDragId(null); };

  return (
    <div>
      <PageHeader title="Sales pipeline" subtitle="Close deals → auto-creates onboarding.">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ maxWidth: 220, fontSize: 12 }} />
        <div style={{ display: 'flex', border: '1px solid var(--brd)', borderRadius: 8, overflow: 'hidden' }}>
          {(['board', 'list'] as const).map(v => (<button key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', background: view === v ? 'rgba(127,119,221,.15)' : 'transparent', color: view === v ? '#7F77DD' : 'var(--mut)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{v === 'board' ? 'Board' : 'List'}</button>))}
        </div>
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New lead</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Pipeline" value={formatPesoK(pipeVal)} accent="#7F77DD" />
        <MetricCard label="Won" value={formatPesoK(wonVal)} accent="#639922" />
        <MetricCard label="Active" value={filtered.filter(s => !['closed_won', 'closed_lost'].includes(s.stage)).length} accent="#378ADD" />
      </div>

      {view === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SALES_STAGES.length}, minmax(0,1fr))`, gap: 8 }}>
          {SALES_STAGES.map(stage => { const items = filtered.filter(s => s.stage === stage.key); return (
            <div key={stage.key} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(stage.key)} style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 10, minHeight: 200, border: '1px solid var(--brd)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: stage.color }}>{stage.label}</span>
                <span style={{ fontSize: 11, background: stage.color + '1A', color: stage.color, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{items.length}</span>
              </div>
              {items.map(item => (
                <div key={item.id} draggable={role.canEdit} onDragStart={() => setDragId(item.id)} onDragEnd={() => setDragId(null)} onClick={() => openEdit(item)}
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--brd)', borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: role.canEdit ? 'grab' : 'pointer', borderLeft: `3px solid ${stage.color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.company_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)' }}>{item.contact_name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: stage.color, marginTop: 5 }}>{formatPeso(item.deal_value)}</div>
                </div>
              ))}
            </div>
          ); })}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--brd)', overflow: 'hidden' }}>
          <table><thead><tr>{['Company', 'Contact', 'Value', 'Stage', 'Source', ''].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(item => { const stg = SALES_STAGES.find(s => s.key === item.stage); return (
            <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(item)}>
              <td style={{ fontWeight: 600 }}>{item.company_name}</td><td style={{ color: 'var(--mut)' }}>{item.contact_name}</td>
              <td style={{ fontWeight: 600 }}>{formatPeso(item.deal_value)}</td><td><Badge color={stg?.color || '#888'}>{stg?.label}</Badge></td>
              <td style={{ color: 'var(--mut)', fontSize: 12 }}>{item.source || '—'}</td>
              <td>{role.canDelete && <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer' }}>✕</button>}</td>
            </tr>); })}</tbody></table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit deal' : 'New lead'}>
        <FormGrid>
          <FormRow label="Company" required><input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></FormRow>
          <FormRow label="Contact" required><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></FormRow>
          <FormRow label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></FormRow>
          <FormRow label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></FormRow>
          <FormRow label="Value (₱)"><input type="number" value={form.deal_value} onChange={e => setForm({ ...form, deal_value: e.target.value })} /></FormRow>
          <FormRow label="Source"><select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}><option value="">Select...</option>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}</select></FormRow>
          <FormRow label="Stage"><select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>{SALES_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></FormRow>
        </FormGrid>
        <FormRow label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && role.canDelete && <DangerButton onClick={() => handleDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}><GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>{role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save' : 'Add lead'}</PrimaryButton>}</div>
        </div>
      </Modal>
    </div>
  );
}
