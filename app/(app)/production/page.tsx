'use client';

import { useState } from 'react';
import { useTable, insert, update, remove, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, FormGrid, WeekHeader, ProgressBar } from '@/components/ui/shared';
import { SearchInput } from '@/components/ui/shared';
import { formatDate, statusColor, WEEKS } from '@/lib/utils';
import { EDITORS, VIDEOGRAPHERS, PACKAGES } from '@/lib/constants';
import type { Client } from '@/types';

const STAGES = [
  { key: 'stage_shoot',     label: 'Shoot' },
  { key: 'stage_edit',      label: 'Edit' },
  { key: 'stage_approval',  label: 'Approval' },
  { key: 'stage_sent_guido',label: 'Guido' },
  { key: 'stage_posted',    label: 'Posted' },
] as const;

type StageKey = typeof STAGES[number]['key'];

const emptyForm = { name: '', editor: '', videographer: '', week_num: '1', videos_target: '4', videos_complete: '0', shoot_date: '', next_shoot: '', status: 'on_track', package_type: '', notes: '', stage_shoot: '0', stage_edit: '0', stage_approval: '0', stage_sent_guido: '0', stage_posted: '0' };

export default function ProductionPage() {
  const { data: clients, refetch } = useTable<Client>('clients', 'created_at');
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.editor.toLowerCase().includes(search.toLowerCase()));
  const totalT = filtered.reduce((a, b) => a + b.videos_target, 0);
  const totalC = filtered.reduce((a, b) => a + b.videos_complete, 0);
  const behind = filtered.filter(c => c.status === 'behind').length;

  const openNew = () => { setForm(emptyForm); setEditItem(null); setModal('new'); };
  const openEdit = (item: Client) => {
    setForm({ name: item.name, editor: item.editor || '', videographer: item.videographer || '', week_num: String(item.week_num), videos_target: String(item.videos_target), videos_complete: String(item.videos_complete), shoot_date: item.shoot_date || '', next_shoot: item.next_shoot || '', status: item.status, package_type: item.package_type || '', notes: item.notes || '', stage_shoot: String(item.stage_shoot), stage_edit: String(item.stage_edit), stage_approval: String(item.stage_approval), stage_sent_guido: String(item.stage_sent_guido), stage_posted: String(item.stage_posted) });
    setEditItem(item); setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name) return;
    const payload = { ...form, week_num: Number(form.week_num), videos_target: Number(form.videos_target), videos_complete: Number(form.videos_complete), stage_shoot: Number(form.stage_shoot), stage_edit: Number(form.stage_edit), stage_approval: Number(form.stage_approval), stage_sent_guido: Number(form.stage_sent_guido), stage_posted: Number(form.stage_posted), shoot_date: form.shoot_date || null, next_shoot: form.next_shoot || null };
    if (modal === 'edit' && editItem) { await update('clients', editItem.id, payload); }
    else { await insert('clients', payload); }
    await log(modal === 'edit' ? 'Client updated' : 'Client added', form.name, 'production', 'success', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  const handleDelete = async (id: string) => {
    await remove('clients', id);
    await log('Client removed', '', 'production', 'info', user?.name || 'System');
    setModal(null); setEditItem(null); refetch();
  };

  const bump = async (client: Client, key: StageKey, delta: number) => {
    const val = Math.max(0, client[key] + delta);
    await update('clients', client.id, { [key]: val });
    refetch();
  };

  return (
    <div>
      <PageHeader title="Production" subtitle="Weekly video production tracker.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New client</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <MetricCard label="Clients" value={filtered.length} />
        <MetricCard label="Videos" value={`${totalC} / ${totalT}`} />
        <MetricCard label="Behind" value={behind} accent={behind > 0 ? '#f87171' : undefined} />
        <MetricCard label="On track" value={filtered.filter(c => c.status === 'on_track').length} accent="#4ade80" />
      </div>

      {WEEKS.map(w => {
        const weekClients = filtered.filter(c => c.week_num === w.num);
        const wT = weekClients.reduce((a, b) => a + b.videos_target, 0);
        const wC = weekClients.reduce((a, b) => a + b.videos_complete, 0);
        const isCollapsed = collapsed[w.num] ?? false;

        return (
          <div key={w.num} style={{ marginBottom: 6 }}>
            <WeekHeader weekNum={w.num} label={w.label} dateRange={w.dateRange} count={weekClients.length} vTarget={wT} vComplete={wC} collapsed={isCollapsed} onToggle={() => setCollapsed(p => ({ ...p, [w.num]: !isCollapsed }))} />
            {!isCollapsed && weekClients.length > 0 && (
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                <table style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Client</th>
                      <th style={{ width: '10%' }}>Editor</th>
                      <th style={{ width: '18%' }}>Videos</th>
                      {STAGES.map(s => <th key={s.key} style={{ width: '9%', textAlign: 'center' }}>{s.label}</th>)}
                      <th style={{ width: '8%', textAlign: 'center' }}>Status</th>
                      {role.canEdit && <th style={{ width: '5%' }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {weekClients.map(client => {
                      const sc = statusColor(client.status);
                      return (
                        <tr key={client.id} className="prod-row">
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{client.name}</div>
                            {client.package_type && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 1 }}>{client.package_type}</div>}
                            {client.shoot_date && <div style={{ fontSize: 11, color: 'var(--mut)' }}>Shoot: {formatDate(client.shoot_date)}</div>}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--mut)' }}>{client.editor}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <ProgressBar value={client.videos_complete} max={client.videos_target} color={client.videos_complete >= client.videos_target ? '#4ade80' : '#7F77DD'} h={4} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--mut)' }}>{client.videos_complete}/{client.videos_target}</span>
                            </div>
                          </td>
                          {STAGES.map(s => (
                            <td key={s.key} style={{ textAlign: 'center', padding: '8px 4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                {role.canEdit && <button className="stage-btn" onClick={() => bump(client, s.key, -1)}>−</button>}
                                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 22, textAlign: 'center' }}>{client[s.key]}</span>
                                {role.canEdit && <button className="stage-btn" onClick={() => bump(client, s.key, 1)}>+</button>}
                              </div>
                            </td>
                          ))}
                          <td style={{ textAlign: 'center' }}>
                            <Badge color={sc}>{client.status.replace('_', ' ')}</Badge>
                          </td>
                          {role.canEdit && (
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => openEdit(client)} style={{ background: 'none', border: '1px solid var(--brd)', borderRadius: 5, padding: '3px 8px', color: 'var(--mut)', cursor: 'pointer', fontSize: 11 }}>Edit</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!isCollapsed && weekClients.length === 0 && (
              <div style={{ padding: '12px 16px', color: 'var(--mut)', fontSize: 13, marginBottom: 10 }}>No clients this week.</div>
            )}
          </div>
        );
      })}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit client' : 'New client'} width={600}>
        <FormGrid>
          <FormRow label="Client name" required><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></FormRow>
          <FormRow label="Package"><select value={form.package_type} onChange={e => setForm({ ...form, package_type: e.target.value })}><option value="">Select...</option>{PACKAGES.map(p => <option key={p}>{p}</option>)}</select></FormRow>
          <FormRow label="Editor"><select value={form.editor} onChange={e => setForm({ ...form, editor: e.target.value })}><option value="">Select...</option>{EDITORS.map(e => <option key={e}>{e}</option>)}</select></FormRow>
          <FormRow label="Videographer"><select value={form.videographer} onChange={e => setForm({ ...form, videographer: e.target.value })}><option value="">Select...</option>{VIDEOGRAPHERS.map(v => <option key={v}>{v}</option>)}</select></FormRow>
          <FormRow label="Week"><select value={form.week_num} onChange={e => setForm({ ...form, week_num: e.target.value })}>{[1,2,3,4].map(w => <option key={w} value={w}>Week {w}</option>)}</select></FormRow>
          <FormRow label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="on_track">On Track</option><option value="behind">Behind</option><option value="complete">Complete</option></select></FormRow>
          <FormRow label="Videos target"><input type="number" value={form.videos_target} onChange={e => setForm({ ...form, videos_target: e.target.value })} /></FormRow>
          <FormRow label="Videos complete"><input type="number" value={form.videos_complete} onChange={e => setForm({ ...form, videos_complete: e.target.value })} /></FormRow>
          <FormRow label="Shoot date"><input type="date" value={form.shoot_date} onChange={e => setForm({ ...form, shoot_date: e.target.value })} /></FormRow>
          <FormRow label="Next shoot"><input type="date" value={form.next_shoot} onChange={e => setForm({ ...form, next_shoot: e.target.value })} /></FormRow>
        </FormGrid>
        <div style={{ marginTop: 4, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Pipeline stages</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {STAGES.map(s => (
              <FormRow key={s.key} label={s.label}><input type="number" min={0} value={form[s.key as keyof typeof form]} onChange={e => setForm({ ...form, [s.key]: e.target.value })} /></FormRow>
            ))}
          </div>
        </div>
        <FormRow label="Notes"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <div>{modal === 'edit' && editItem && role.canDelete && <DangerButton onClick={() => handleDelete(editItem.id)}>Delete</DangerButton>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setModal(null); setEditItem(null); }}>Cancel</GhostButton>
            {role.canEdit && <PrimaryButton onClick={handleSave}>{modal === 'edit' ? 'Save changes' : 'Add client'}</PrimaryButton>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
