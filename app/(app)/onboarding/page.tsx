'use client';

import { useState } from 'react';
import { useTable, insert, update, remove, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, ProgressBar, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, FormGrid, SearchInput } from '@/components/ui/shared';
import { formatDate } from '@/lib/utils';
import { EDITORS, VIDEOGRAPHERS, PACKAGES } from '@/lib/constants';
import type { OnboardingItem } from '@/types';

const CHECKLIST = [
  { key: 'contract_signed', label: 'Contract signed' },
  { key: 'invoice_paid', label: 'Invoice paid' },
  { key: 'strategy_called', label: 'Strategy call' },
  { key: 'shoot_scheduled', label: 'Shoot scheduled' },
] as const;

type ChecklistKey = typeof CHECKLIST[number]['key'];

const empty = { client_name: '', editor_assigned: '', social_assigned: '', videographer: '', package_type: '', shoot_date: '', notes: '', contract_signed: false, invoice_paid: false, strategy_called: false, shoot_scheduled: false };

export default function OnboardingPage() {
  const { data: items, loading, refetch } = useTable<OnboardingItem>('onboarding', 'created_at');
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<OnboardingItem | null>(null);
  const [form, setForm] = useState(empty);

  const filtered = items.filter(i => !search || i.client_name.toLowerCase().includes(search.toLowerCase()));
  const inProgress = filtered.filter(i => i.status !== 'complete').length;
  const complete = filtered.filter(i => i.status === 'complete').length;
  const totalChecks = filtered.length * 4;
  const doneChecks = filtered.reduce((a, i) => a + (i.contract_signed ? 1 : 0) + (i.invoice_paid ? 1 : 0) + (i.strategy_called ? 1 : 0) + (i.shoot_scheduled ? 1 : 0), 0);

  const openNew = () => { setForm(empty); setEditItem(null); setModal('new'); };
  const openEdit = (item: OnboardingItem) => {
    setForm({ client_name: item.client_name, editor_assigned: item.editor_assigned || '', social_assigned: item.social_assigned || '', videographer: item.videographer || '', package_type: item.package_type || '', shoot_date: item.shoot_date || '', notes: item.notes || '', contract_signed: item.contract_signed, invoice_paid: item.invoice_paid, strategy_called: item.strategy_called, shoot_scheduled: item.shoot_scheduled });
    setEditItem(item); setModal('edit');
  };

  const checkCount = (f: typeof form) => (f.contract_signed ? 1 : 0) + (f.invoice_paid ? 1 : 0) + (f.strategy_called ? 1 : 0) + (f.shoot_scheduled ? 1 : 0);

  const handleSave = async () => {
    if (!form.client_name) return;
    const status = checkCount(form) === 4 ? 'complete' : 'in_progress';
    const payload = { ...form, status, shoot_date: form.shoot_date || null };
    if (modal === 'edit' && editItem) { await update('onboarding', editItem.id, payload); }
    else { await insert('onboarding', payload); }
    await log(modal === 'edit' ? 'Onboarding updated' : 'Onboarding added', form.client_name, 'onboarding', 'success', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  const handleDelete = async (id: string) => {
    await remove('onboarding', id);
    await log('Onboarding removed', '', 'onboarding', 'info', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  const toggleCheck = async (item: OnboardingItem, key: ChecklistKey) => {
    if (!role.canEdit) return;
    const val = !item[key];
    const updated = { ...item, [key]: val };
    const newCount = (updated.contract_signed ? 1 : 0) + (updated.invoice_paid ? 1 : 0) + (updated.strategy_called ? 1 : 0) + (updated.shoot_scheduled ? 1 : 0);
    await update('onboarding', item.id, { [key]: val, status: newCount === 4 ? 'complete' : 'in_progress' });
    refetch();
  };

  return (
    <div>
      <PageHeader title="Onboarding" subtitle="New client setup checklist — auto-completes when all steps done.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New client</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="In progress" value={inProgress} accent="#EF9F27" />
        <MetricCard label="Complete" value={complete} accent="#639922" />
        <MetricCard label="Checklist" value={totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) + '%' : '—'} accent="#7F77DD" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(item => {
          const done = (item.contract_signed ? 1 : 0) + (item.invoice_paid ? 1 : 0) + (item.strategy_called ? 1 : 0) + (item.shoot_scheduled ? 1 : 0);
          return (
            <div key={item.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 12, padding: 16, borderLeft: `3px solid ${item.status === 'complete' ? '#639922' : '#EF9F27'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, cursor: 'pointer' }} onClick={() => openEdit(item)}>{item.client_name}</div>
                <Badge color={item.status === 'complete' ? '#639922' : '#EF9F27'}>{item.status === 'complete' ? 'Complete' : 'In Progress'}</Badge>
              </div>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 10 }}>
                {item.package_type && <span>{item.package_type}</span>}
                {item.editor_assigned && <span> · Editor: {item.editor_assigned}</span>}
                {item.shoot_date && <span> · Shoot: {formatDate(item.shoot_date)}</span>}
              </div>
              <ProgressBar value={done} max={4} color={done === 4 ? '#639922' : '#EF9F27'} h={6} />
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {CHECKLIST.map(c => (
                  <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: item[c.key] ? '#639922' : 'var(--mut)', cursor: role.canEdit ? 'pointer' : 'default' }}>
                    <input type="checkbox" checked={item[c.key]} onChange={() => toggleCheck(item, c.key)} disabled={!role.canEdit} style={{ accentColor: '#639922' }} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)' }}>No onboarding clients found.</div>}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit onboarding' : 'New onboarding'}>
        <FormGrid>
          <FormRow label="Client name" required><input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></FormRow>
          <FormRow label="Package"><select value={form.package_type} onChange={e => setForm({ ...form, package_type: e.target.value })}><option value="">Select...</option>{PACKAGES.map(p => <option key={p}>{p}</option>)}</select></FormRow>
          <FormRow label="Editor"><select value={form.editor_assigned} onChange={e => setForm({ ...form, editor_assigned: e.target.value })}><option value="">Select...</option>{EDITORS.map(e => <option key={e}>{e}</option>)}</select></FormRow>
          <FormRow label="Social"><input value={form.social_assigned} onChange={e => setForm({ ...form, social_assigned: e.target.value })} /></FormRow>
          <FormRow label="Videographer"><select value={form.videographer} onChange={e => setForm({ ...form, videographer: e.target.value })}><option value="">Select...</option>{VIDEOGRAPHERS.map(v => <option key={v}>{v}</option>)}</select></FormRow>
          <FormRow label="Shoot date"><input type="date" value={form.shoot_date} onChange={e => setForm({ ...form, shoot_date: e.target.value })} /></FormRow>
        </FormGrid>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '12px 0' }}>
          {CHECKLIST.map(c => (
            <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={form[c.key]} onChange={e => setForm({ ...form, [c.key]: e.target.checked })} style={{ accentColor: '#639922' }} />
              {c.label}
            </label>
          ))}
        </div>
        <FormRow label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && role.canDelete && <DangerButton onClick={() => handleDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
            {role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save' : 'Add client'}</PrimaryButton>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
