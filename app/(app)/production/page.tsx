'use client';

import { useState } from 'react';
import { useTable, insert, update, remove, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, ProgressBar, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, FormGrid, SearchInput, WeekHeader } from '@/components/ui/shared';
import { formatDate, statusColor, WEEKS } from '@/lib/utils';
import { EDITORS, VIDEOGRAPHERS, PACKAGES, CONTENT_STAGES, WEEKLY_TARGET } from '@/lib/constants';
import type { Client } from '@/types';

const emptyForm = { name: '', editor: '', videographer: '', week_num: '1', videos_target: '4', videos_complete: '0', shoot_date: '', next_shoot: '', status: 'on_track', package_type: '', notes: '', stage_shoot: '0', stage_edit: '0', stage_approval: '0', stage_sent_guido: '0', stage_posted: '0' };

export default function ProductionPage() {
  const { data: clients, refetch } = useTable<Client>('clients', 'created_at');
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const totalT = filtered.reduce((a, b) => a + b.videos_target, 0);
  const totalC = filtered.reduce((a, b) => a + b.videos_complete, 0);
  const behind = filtered.filter(c => c.status === 'behind').length;
  const onTrack = filtered.filter(c => c.status === 'on_track').length;

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

  const bumpStage = async (client: Client, stageKey: string, delta: number) => {
    const val = Math.max(0, (client as any)[stageKey] + delta);
    await update('clients', client.id, { [stageKey]: val });
    refetch();
  };

  return (
    <div>
      <PageHeader title="Production" subtitle="Weekly video production tracker — grouped by delivery week.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
        {role.canEdit && <PrimaryButton onClick={openNew}>+ New client</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Clients" value={filtered.length} accent="#7F77DD" />
        <MetricCard label="Videos" value={`${totalC}/${totalT}`} sub={`Target: ${WEEKLY_TARGET}`} accent="#378ADD" />
        <MetricCard label="Behind" value={behind} accent="#E24B4A" />
        <MetricCard label="On track" value={onTrack} accent="#639922" />
      </div>

      {WEEKS.map(w => {
        const weekClients = filtered.filter(c => c.week_num === w.num);
        const wT = weekClients.reduce((a, b) => a + b.videos_target, 0);
        const wC = weekClients.reduce((a, b) => a + b.videos_complete, 0);
        const isCollapsed = collapsed[w.num] ?? false;
        return (
          <div key={w.num} style={{ marginBottom: 8 }}>
            <WeekHeader weekNum={w.num} label={w.label} dateRange={w.dateRange} count={weekClients.length} vTarget={wT} vComplete={wC} collapsed={isCollapsed} onToggle={() => setCollapsed(p => ({ ...p, [w.num]: !isCollapsed }))} />
            {!isCollapsed && (
              <div style={{ display: 'grid', gap: 8, marginBottom: 12, paddingLeft: 8 }}>
                {weekClients.map(client => (
                  <div key={client.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${statusColor(client.status)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ cursor: 'pointer' }} onClick={() => openEdit(client)}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{client.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--mut)', marginLeft: 10 }}>{client.editor} · {client.videographer}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge color={statusColor(client.status)}>{client.status.replace('_', ' ')}</Badge>
                        {client.shoot_date && <span style={{ fontSize: 11, color: 'var(--mut)' }}>Shoot: {formatDate(client.shoot_date)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}><ProgressBar value={client.videos_complete} max={client.videos_target} color={client.videos_complete >= client.videos_target ? '#639922' : '#378ADD'} h={6} /></div>
                      <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{client.videos_complete}/{client.videos_target} videos</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {CONTENT_STAGES.map(stage => {
                        const stageKey = `stage_${stage.key}` as keyof Client;
                        const val = client[stageKey] as number;
                        return (
                          <div key={stage.key} style={{ flex: 1, background: stage.color + '12', borderRadius: 6, padding: '4px 8px', textAlign: 'center', border: `1px solid ${stage.color}25` }}>
                            <div style={{ fontSize: 9, fontWeight: 600, color: stage.color, textTransform: 'uppercase', letterSpacing: '.05em' }}>{stage.label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 }}>
                              {role.canEdit && <button onClick={() => bumpStage(client, stageKey, -1)} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>−</button>}
                              <span style={{ fontSize: 14, fontWeight: 700, color: stage.color }}>{val}</span>
                              {role.canEdit && <button onClick={() => bumpStage(client, stageKey, 1)} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>+</button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {weekClients.length === 0 && <div style={{ padding: '12px 16px', color: 'var(--mut)', fontSize: 12 }}>No clients this week.</div>}
              </div>
            )}
          </div>
        );
      })}

      <Modal open={!!modal} onClose={() => { setModal(null); setEditItem(null); }} title={modal === 'edit' ? 'Edit client' : 'New client'}>
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
