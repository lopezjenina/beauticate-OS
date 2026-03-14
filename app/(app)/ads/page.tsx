'use client';

import { useState } from 'react';
import { useTable, insert, update, remove, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, ProgressBar, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, FormGrid, SearchInput } from '@/components/ui/shared';
import { formatPeso, formatPesoK, formatDate, pct } from '@/lib/utils';
import { AD_STATUSES, PLATFORMS } from '@/lib/constants';
import type { AdCampaign } from '@/types';

const emptyForm = { client_name: '', campaign_name: '', status: 'draft', budget: '', spent: '', creative: '', platform: '', next_optimization: '', start_date: '', notes: '' };

export default function AdsPage() {
  const { data: campaigns, loading, refetch } = useTable<AdCampaign>('ads', 'created_at');
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<AdCampaign | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = campaigns.filter(c => !search || c.client_name.toLowerCase().includes(search.toLowerCase()) || c.campaign_name.toLowerCase().includes(search.toLowerCase()));
  const active = filtered.filter(c => c.status === 'active');
  const totalBudget = filtered.reduce((a, b) => a + b.budget, 0);
  const totalSpent = filtered.reduce((a, b) => a + b.spent, 0);

  const openNew = () => { setForm(emptyForm); setEditItem(null); setModal('new'); };
  const openEdit = (item: AdCampaign) => {
    setForm({ client_name: item.client_name, campaign_name: item.campaign_name, status: item.status, budget: String(item.budget), spent: String(item.spent), creative: item.creative || '', platform: item.platform || '', next_optimization: item.next_optimization || '', start_date: item.start_date || '', notes: item.notes || '' });
    setEditItem(item); setModal('edit');
  };

  const handleSave = async () => {
    if (!form.client_name || !form.campaign_name) return;
    const payload = { ...form, budget: Number(form.budget) || 0, spent: Number(form.spent) || 0, next_optimization: form.next_optimization || null, start_date: form.start_date || null };
    if (modal === 'edit' && editItem) { await update('ads', editItem.id, payload); }
    else { await insert('ads', payload); }
    await log(modal === 'edit' ? 'Campaign updated' : 'Campaign created', form.campaign_name, 'ads', 'success', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  const handleDelete = async (id: string) => {
    await remove('ads', id);
    await log('Campaign removed', '', 'ads', 'info', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  return (
    <div>
      <PageHeader title="Ads" subtitle="Campaign tracker — budget, spend & optimization dates.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search..." />
        <div style={{ display: 'flex', border: '1px solid var(--brd)', borderRadius: 8, overflow: 'hidden' }}>
          {(['cards', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', background: view === v ? 'rgba(127,119,221,.15)' : 'transparent', color: view === v ? '#7F77DD' : 'var(--mut)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{v === 'cards' ? 'Cards' : 'List'}</button>
          ))}
        </div>
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New campaign</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Active" value={active.length} accent="#639922" />
        <MetricCard label="Budget" value={formatPesoK(totalBudget)} accent="#7F77DD" />
        <MetricCard label="Spent" value={formatPesoK(totalSpent)} accent="#EF9F27" />
        <MetricCard label="Utilization" value={totalBudget > 0 ? pct(totalSpent, totalBudget) + '%' : '—'} accent="#378ADD" />
      </div>

      {view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {filtered.map(item => {
            const st = AD_STATUSES.find(s => s.key === item.status);
            return (
              <div key={item.id} onClick={() => openEdit(item)} style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', borderLeft: `3px solid ${st?.color || '#888'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{item.campaign_name}</span>
                  <Badge color={st?.color || '#888'}>{st?.label}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 8 }}>
                  {item.client_name}{item.platform && ` · ${item.platform}`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--mut)' }}>Budget: <strong style={{ color: 'var(--fg)' }}>{formatPeso(item.budget)}</strong></span>
                  <span style={{ color: 'var(--mut)' }}>Spent: <strong style={{ color: item.spent > item.budget ? '#E24B4A' : '#EF9F27' }}>{formatPeso(item.spent)}</strong></span>
                </div>
                <ProgressBar value={item.spent} max={item.budget} color={item.spent > item.budget * 0.9 ? '#E24B4A' : '#639922'} h={5} />
                {item.next_optimization && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 6 }}>Next optimization: {formatDate(item.next_optimization)}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--brd)', overflow: 'hidden' }}>
          <table><thead><tr>{['Campaign', 'Client', 'Platform', 'Status', 'Budget', 'Spent', ''].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(item => { const st = AD_STATUSES.find(s => s.key === item.status); return (
            <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(item)}>
              <td style={{ fontWeight: 600 }}>{item.campaign_name}</td>
              <td style={{ color: 'var(--mut)' }}>{item.client_name}</td>
              <td><Badge color="#7F77DD">{item.platform || '—'}</Badge></td>
              <td><Badge color={st?.color || '#888'}>{st?.label}</Badge></td>
              <td style={{ fontWeight: 600 }}>{formatPeso(item.budget)}</td>
              <td style={{ fontWeight: 600, color: item.spent > item.budget ? '#E24B4A' : 'var(--fg)' }}>{formatPeso(item.spent)}</td>
              <td>{role.canDelete && <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer' }}>✕</button>}</td>
            </tr>); })}</tbody></table>
        </div>
      )}

      {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)' }}>No campaigns found.</div>}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit campaign' : 'New campaign'}>
        <FormGrid>
          <FormRow label="Campaign name" required><input value={form.campaign_name} onChange={e => setForm({ ...form, campaign_name: e.target.value })} /></FormRow>
          <FormRow label="Client" required><input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></FormRow>
          <FormRow label="Platform"><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}><option value="">Select...</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></FormRow>
          <FormRow label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{AD_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></FormRow>
          <FormRow label="Budget (₱)"><input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></FormRow>
          <FormRow label="Spent (₱)"><input type="number" value={form.spent} onChange={e => setForm({ ...form, spent: e.target.value })} /></FormRow>
          <FormRow label="Start date"><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></FormRow>
          <FormRow label="Next optimization"><input type="date" value={form.next_optimization} onChange={e => setForm({ ...form, next_optimization: e.target.value })} /></FormRow>
        </FormGrid>
        <FormRow label="Creative"><input value={form.creative} onChange={e => setForm({ ...form, creative: e.target.value })} /></FormRow>
        <FormRow label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && role.canDelete && <DangerButton onClick={() => handleDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
            {role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save' : 'Add campaign'}</PrimaryButton>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
