'use client';

import { useState } from 'react';
import { useTable, insert, update, log, supabase } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, Badge, PageHeader, PrimaryButton, GhostButton, Modal, FormRow, FormGrid, ProgressBar, PageLoader } from '@/components/ui/shared';
import { CheckCircle } from 'lucide-react';
import { SearchInput } from '@/components/ui/shared';
import { formatDate } from '@/lib/utils';
import { EDITORS, VIDEOGRAPHERS, PACKAGES } from '@/lib/constants';
import type { OnboardingItem } from '@/types';

const CHECKLIST = [
  { key: 'contract_signed',  label: 'Contract signed' },
  { key: 'invoice_paid',     label: 'Invoice paid' },
  { key: 'strategy_called',  label: 'Strategy call' },
  { key: 'shoot_scheduled',  label: 'Shoot scheduled' },
] as const;

type ChecklistKey = typeof CHECKLIST[number]['key'];

const empty = { client_name: '', editor_assigned: '', social_assigned: '', videographer: '', package_type: '', shoot_date: '', notes: '', contract_signed: false, invoice_paid: false, strategy_called: false, shoot_scheduled: false };

export default function OnboardingPage() {
  const { data: items, loading, refetch } = useTable<OnboardingItem>('onboarding', 'created_at');
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'in_progress' | 'complete'>('all');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<OnboardingItem | null>(null);
  const [form, setForm] = useState(empty);
  const [promptMoveClient, setPromptMoveClient] = useState<OnboardingItem | null>(null);
  const [movingToProduction, setMovingToProduction] = useState(false);

  const inProgress = items.filter(i => i.status !== 'complete').length;
  const complete = items.filter(i => i.status === 'complete').length;
  const tabFiltered = tab === 'all' ? items : items.filter(i => i.status === tab);
  const filtered = tabFiltered.filter(i => !search || i.client_name.toLowerCase().includes(search.toLowerCase()));
  const doneChecks = filtered.reduce((a, i) => a + (i.contract_signed ? 1 : 0) + (i.invoice_paid ? 1 : 0) + (i.strategy_called ? 1 : 0) + (i.shoot_scheduled ? 1 : 0), 0);
  const totalChecks = filtered.length * 4;

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
    const prevEditor = editItem?.editor_assigned || '';
    if (modal === 'edit' && editItem) { await update('onboarding', editItem.id, payload); }
    else { await insert('onboarding', payload); }
    await log(modal === 'edit' ? 'Onboarding updated' : 'Onboarding added', form.client_name, 'onboarding', 'success', user?.name || 'System');

    // Send email if editor was newly assigned
    if (form.editor_assigned && form.editor_assigned !== prevEditor) {
      try {
        const { TEAM_EMAILS } = await import('@/lib/constants');
        const editorEmail = Object.entries(TEAM_EMAILS).find(([, v]) => v.name === form.editor_assigned)?.[0];
        if (editorEmail) {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'assignment',
              to: editorEmail,
              data: { recipientName: form.editor_assigned, clientName: form.client_name, role: 'editor', assignedBy: user?.name || 'Admin', link: '/onboarding' },
            }),
          });
        }
      } catch { /* non-blocking */ }
    }

    setModal(null); refetch();
    if (checkCount(form) === 4) {
      const completed = editItem ? { ...editItem, ...form, status: 'complete' } as OnboardingItem : { ...form, status: 'complete', id: '', created_at: '' } as unknown as OnboardingItem;
      setPromptMoveClient(completed);
    }
    setEditItem(null);
  };


  const toggleCheck = async (item: OnboardingItem, key: ChecklistKey) => {
    if (!role.canEdit) return;
    const val = !item[key];
    const updated = { ...item, [key]: val };
    const oldCount = (item.contract_signed ? 1 : 0) + (item.invoice_paid ? 1 : 0) + (item.strategy_called ? 1 : 0) + (item.shoot_scheduled ? 1 : 0);
    const newCount = (updated.contract_signed ? 1 : 0) + (updated.invoice_paid ? 1 : 0) + (updated.strategy_called ? 1 : 0) + (updated.shoot_scheduled ? 1 : 0);
    await update('onboarding', item.id, { [key]: val, status: newCount === 4 ? 'complete' : 'in_progress' });
    refetch();
    if (newCount === 4 && oldCount < 4) {
      setPromptMoveClient({ ...item, [key]: val, status: 'complete' } as OnboardingItem);
    }
  };

  const moveToProduction = async (item: OnboardingItem) => {
    setMovingToProduction(true);
    // Check if already exists in production
    const { count } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('name', item.client_name);
    if (count && count > 0) {
      setPromptMoveClient(null);
      setMovingToProduction(false);
      return;
    }
    await insert('clients', {
      name: item.client_name,
      editor: item.editor_assigned || '',
      videographer: item.videographer || '',
      week_num: 1,
      videos_target: 0,
      videos_complete: 0,
      shoot_date: item.shoot_date || null,
      next_shoot: null,
      status: 'on_track',
      package_type: item.package_type || '',
      notes: item.notes || '',
      stage_shoot: 0,
      stage_edit: 0,
      stage_approval: 0,
      stage_sent_guido: 0,
      stage_posted: 0,
    });
    await log('Client moved to production', item.client_name, 'production', 'success', user?.name || 'System');
    setPromptMoveClient(null);
    setMovingToProduction(false);
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Onboarding" subtitle="New client setup — auto-completes when all steps are done.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New client</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['all', 'in_progress', 'complete'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--brd)', background: tab === t ? '#7F77DD' : 'var(--bg-2)', color: tab === t ? '#fff' : 'var(--mut)', fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t === 'all' ? `All (${items.length})` : t === 'in_progress' ? `In progress (${inProgress})` : `Completed (${complete})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <MetricCard label="In progress" value={inProgress} />
        <MetricCard label="Complete" value={complete} accent="#4ade80" />
        <MetricCard label="Checklist" value={totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) + '%' : '—'} />
      </div>

      <div className="table-wrap" style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Client</th>
              <th style={{ width: '12%' }}>Package</th>
              <th style={{ width: '10%' }}>Editor</th>
              <th style={{ width: '10%' }}>Shoot date</th>
              <th>Checklist</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Progress</th>
              <th style={{ width: '9%', textAlign: 'center' }}>Status</th>
              {role.canEdit && <th style={{ width: '5%' }} />}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const done = (item.contract_signed ? 1 : 0) + (item.invoice_paid ? 1 : 0) + (item.strategy_called ? 1 : 0) + (item.shoot_scheduled ? 1 : 0);
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.client_name}</td>
                  <td style={{ fontSize: 12, color: 'var(--mut)' }}>{item.package_type || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--mut)' }}>{item.editor_assigned || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--mut)' }}>{item.shoot_date ? formatDate(item.shoot_date) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {CHECKLIST.map(c => (
                        <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: item[c.key] ? 'var(--fg)' : 'var(--mut)', cursor: role.canEdit ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                          <input type="checkbox" checked={item[c.key]} onChange={() => toggleCheck(item, c.key)} disabled={!role.canEdit} style={{ accentColor: '#7F77DD', width: 13, height: 13 }} />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>
                    <ProgressBar value={done} max={4} color={done === 4 ? '#4ade80' : '#7F77DD'} h={4} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge color={item.status === 'complete' ? '#4ade80' : '#fbbf24'}>
                      {item.status === 'complete' ? 'Complete' : 'In progress'}
                    </Badge>
                  </td>
                  {role.canEdit && (
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => openEdit(item)} style={{ background: 'none', border: '1px solid var(--brd)', borderRadius: 5, padding: '3px 8px', color: 'var(--mut)', cursor: 'pointer', fontSize: 11 }}>Edit</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>No onboarding clients found.</div>}
      </div>

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit onboarding' : 'New onboarding'}>
        <FormGrid>
          <FormRow label="Client name" required><input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></FormRow>
          <FormRow label="Package"><select value={form.package_type} onChange={e => setForm({ ...form, package_type: e.target.value })}><option value="">Select...</option>{PACKAGES.map(p => <option key={p}>{p}</option>)}</select></FormRow>
          <FormRow label="Editor"><select value={form.editor_assigned} onChange={e => setForm({ ...form, editor_assigned: e.target.value })}><option value="">Select...</option>{EDITORS.map(e => <option key={e}>{e}</option>)}</select></FormRow>
          <FormRow label="Social"><input value={form.social_assigned} onChange={e => setForm({ ...form, social_assigned: e.target.value })} /></FormRow>
          <FormRow label="Videographer"><select value={form.videographer} onChange={e => setForm({ ...form, videographer: e.target.value })}><option value="">Select...</option>{VIDEOGRAPHERS.map(v => <option key={v}>{v}</option>)}</select></FormRow>
          <FormRow label="Shoot date"><input type="date" value={form.shoot_date} onChange={e => setForm({ ...form, shoot_date: e.target.value })} /></FormRow>
        </FormGrid>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '4px 0 14px' }}>
          {CHECKLIST.map(c => (
            <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 10px', background: 'var(--bg-0)', borderRadius: 7, border: '1px solid var(--brd)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form[c.key]} onChange={e => setForm({ ...form, [c.key]: e.target.checked })} style={{ accentColor: '#7F77DD', width: 14, height: 14 }} />
              {c.label}
            </label>
          ))}
        </div>
        <FormRow label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
          {role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save changes' : 'Add client'}</PrimaryButton>}
        </div>
      </Modal>

      {/* Onboarding complete — move to production prompt */}
      {promptMoveClient && (
        <div onClick={() => setPromptMoveClient(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-1)', borderRadius: 16, border: '1px solid var(--brd)', width: 400, maxWidth: '96vw', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={26} style={{ color: '#4ade80' }} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--fg)' }}>Onboarding complete!</h3>
            <p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--mut)', lineHeight: 1.6 }}>
              All checklist items for <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{promptMoveClient.client_name}</span> are done.
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--fg)', fontWeight: 500 }}>Move this client to Production?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setPromptMoveClient(null)}
                style={{ background: 'transparent', color: 'var(--mut)', border: '1px solid var(--brd)', borderRadius: 9, padding: '9px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 500, minWidth: 90 }}
              >
                Not now
              </button>
              <button
                onClick={() => moveToProduction(promptMoveClient)}
                disabled={movingToProduction}
                style={{ background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 22px', cursor: movingToProduction ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, minWidth: 90, opacity: movingToProduction ? 0.6 : 1 }}
              >
                {movingToProduction ? 'Moving...' : 'Yes, move to Production'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
