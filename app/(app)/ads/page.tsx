'use client';

import { useState } from 'react';
import { useTable, insert, update, remove, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/ui/toast-provider';
import { MetricCard, ProgressBar, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, FormGrid, PageLoader, ConfirmDialog } from '@/components/ui/shared';
import { SearchInput, ViewToggle } from '@/components/ui/shared';
import { formatPeso, formatPesoK, formatDate, pct } from '@/lib/utils';
import { AD_STATUSES, PLATFORMS } from '@/lib/constants';
import type { AdCampaign } from '@/types';

const emptyForm = { client_name: '', campaign_name: '', status: 'draft', budget: '', spent: '', creative: '', platform: '', next_optimization: '', start_date: '', notes: '' };

export default function AdsPage() {
  const { data: campaigns, loading, refetch } = useTable<AdCampaign>('ads', 'created_at');
  const { data: activeClients } = useTable<{ id: string; name: string }>('clients', 'name');
  const { data: onboardingItems } = useTable<{ id: string; client_name: string; status: string }>('onboarding', 'created_at');
  const { user, role } = useAuth();
  const showToast = useToast();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<AdCampaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    const budget = Number(form.budget) || 0;
    const spent = Number(form.spent) || 0;
    const payload = { ...form, budget, spent, next_optimization: form.next_optimization || null, start_date: form.start_date || null };
    if (modal === 'edit' && editItem) { await update('ads', editItem.id, payload); }
    else { await insert('ads', payload); }
    await log(modal === 'edit' ? 'Campaign updated' : 'Campaign created', form.campaign_name, 'ads', 'success', user?.name || 'System');

    // Send budget alert email if over budget
    if (spent > budget && budget > 0) {
      try {
        const { TEAM_EMAILS } = await import('@/lib/constants');
        const adminEmails = Object.entries(TEAM_EMAILS).filter(([, v]) => v.role === 'admin').map(([e]) => e);
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'budget_alert',
            to: adminEmails,
            data: {
              campaignName: form.campaign_name,
              clientName: form.client_name,
              budget: `$${budget.toLocaleString()}`,
              spent: `$${spent.toLocaleString()}`,
              overage: `$${(spent - budget).toLocaleString()}`,
            },
          }),
        });
        showToast(`Budget alert sent — ${form.campaign_name} is over budget.`, 'warning');
      } catch { /* non-blocking */ }
    }

    setModal(null); setEditItem(null); refetch();
  };

  const handleDelete = async (id: string) => {
    await remove('ads', id);
    await log('Campaign removed', '', 'ads', 'info', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Ads" subtitle="Campaign tracker — budget, spend & optimization dates.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search campaigns..." />
        <ViewToggle options={[{ key: 'cards', label: 'Cards' }, { key: 'list', label: 'List' }]} value={view} onChange={v => setView(v as 'cards' | 'list')} />
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New campaign</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <MetricCard label="Active" value={active.length} accent="#4ade80" />
        <MetricCard label="Total budget" value={formatPesoK(totalBudget)} />
        <MetricCard label="Total spent" value={formatPesoK(totalSpent)} />
        <MetricCard label="Utilization" value={totalBudget > 0 ? pct(totalSpent, totalBudget) + '%' : '—'} />
      </div>

      {view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {filtered.map(item => {
            const st = AD_STATUSES.find(s => s.key === item.status);
            const over = item.spent > item.budget;
            return (
              <div
                key={item.id} onClick={() => openEdit(item)}
                style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, padding: '16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{item.campaign_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--mut)' }}>{item.client_name}{item.platform ? ` · ${item.platform}` : ''}</div>
                  </div>
                  <Badge color={st?.color || '#888'}>{st?.label}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: 'var(--mut)' }}>Budget <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{formatPeso(item.budget)}</span></span>
                  <span style={{ color: 'var(--mut)' }}>Spent <span style={{ color: over ? '#f87171' : 'var(--fg)', fontWeight: 600 }}>{formatPeso(item.spent)}</span></span>
                </div>
                <ProgressBar value={item.spent} max={item.budget} color={over ? '#f87171' : '#7F77DD'} h={4} />
                {item.next_optimization && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 8 }}>Next optimization: {formatDate(item.next_optimization)}</div>}
              </div>
            );
          })}
          {!loading && filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>No campaigns found.</div>}
        </div>
      ) : (
        <div className="table-wrap" style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--brd)', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>{['Campaign', 'Client', 'Platform', 'Status', 'Budget', 'Spent', 'Utilization', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const st = AD_STATUSES.find(s => s.key === item.status);
                const over = item.spent > item.budget;
                return (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(item)}>
                    <td style={{ fontWeight: 600 }}>{item.campaign_name}</td>
                    <td style={{ color: 'var(--mut)', fontSize: 12 }}>{item.client_name}</td>
                    <td>{item.platform ? <Badge color="#7F77DD">{item.platform}</Badge> : <span style={{ color: 'var(--mut)' }}>—</span>}</td>
                    <td><Badge color={st?.color || '#888'}>{st?.label}</Badge></td>
                    <td style={{ fontWeight: 600 }}>{formatPeso(item.budget)}</td>
                    <td style={{ fontWeight: 600, color: over ? '#f87171' : 'var(--fg)' }}>{formatPeso(item.spent)}</td>
                    <td style={{ fontSize: 12, color: 'var(--mut)' }}>{item.budget > 0 ? pct(item.spent, item.budget) + '%' : '—'}</td>
                    <td>
                      {role.canDelete && (
                        <button aria-label="Delete campaign" onClick={e => { e.stopPropagation(); setConfirmDelete(item.id); }} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: '4px 6px' }}>✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>No campaigns found.</div>}
        </div>
      )}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit campaign' : 'New campaign'}>
        <FormGrid>
          <FormRow label="Campaign name" required><input value={form.campaign_name} onChange={e => setForm({ ...form, campaign_name: e.target.value })} /></FormRow>
          <FormRow label="Client" required>
            <select value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}>
              <option value="">Select client...</option>
              {activeClients.length > 0 && <optgroup label="Active Clients">{activeClients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</optgroup>}
              {onboardingItems.filter(o => o.status === 'in_progress').length > 0 && <optgroup label="Onboarding">{onboardingItems.filter(o => o.status === 'in_progress').map(o => <option key={o.id} value={o.client_name}>{o.client_name}</option>)}</optgroup>}
            </select>
          </FormRow>
          <FormRow label="Platform"><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}><option value="">Select...</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></FormRow>
          <FormRow label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{AD_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></FormRow>
          <FormRow label="Budget ($)"><input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></FormRow>
          <FormRow label="Spent ($)"><input type="number" value={form.spent} onChange={e => setForm({ ...form, spent: e.target.value })} /></FormRow>
          <FormRow label="Start date"><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></FormRow>
          <FormRow label="Next optimization"><input type="date" value={form.next_optimization} onChange={e => setForm({ ...form, next_optimization: e.target.value })} /></FormRow>
        </FormGrid>
        <FormRow label="Creative"><input value={form.creative} onChange={e => setForm({ ...form, creative: e.target.value })} /></FormRow>
        <FormRow label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && role.canDelete && <DangerButton onClick={() => setConfirmDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
            {role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save changes' : 'Add campaign'}</PrimaryButton>}
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete campaign?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) { handleDelete(confirmDelete); setConfirmDelete(null); } }}
      />
    </div>
  );
}
