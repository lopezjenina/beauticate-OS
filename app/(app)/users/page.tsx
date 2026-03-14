'use client';

import { useState } from 'react';
import { useTable, update, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, Badge, PageHeader, PrimaryButton, GhostButton, Modal, FormRow, SearchInput } from '@/components/ui/shared';
import { ROLES } from '@/lib/constants';
import type { Profile } from '@/types';

const ROLE_OPTIONS = Object.entries(ROLES).map(([key, cfg]) => ({ key, label: cfg.label, color: cfg.color }));

export default function UsersPage() {
  const { data: profiles, refetch } = useTable<Profile>('profiles');
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Profile | null>(null);
  const [form, setForm] = useState({ role: 'viewer', is_active: true });

  const filtered = profiles.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));
  const active = filtered.filter(p => p.is_active).length;

  const roleCounts = ROLE_OPTIONS.map(r => ({ ...r, count: filtered.filter(p => p.role === r.key).length }));

  const openEdit = (profile: Profile) => {
    setForm({ role: profile.role, is_active: profile.is_active });
    setEditItem(profile); setModal(true);
  };

  const handleSave = async () => {
    if (!editItem) return;
    await update('profiles', editItem.id, form);
    await log('User role updated', `${editItem.name} → ${form.role}`, 'users', 'info', user?.name || 'System');
    setModal(false); setEditItem(null); refetch();
  };

  return (
    <div>
      <PageHeader title="Team" subtitle="Manage team members, roles & access.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search team..." />
      </PageHeader>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Team size" value={filtered.length} accent="#7F77DD" />
        <MetricCard label="Active" value={active} accent="#639922" />
        {roleCounts.map(r => (
          <MetricCard key={r.key} label={r.label} value={r.count} accent={r.color} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map(profile => {
          const rc = ROLES[profile.role];
          const initial = (profile.name || profile.email || '?')[0].toUpperCase();
          return (
            <div key={profile.id} onClick={() => role.canManageUsers && openEdit(profile)} style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 12, padding: 16, cursor: role.canManageUsers ? 'pointer' : 'default', opacity: profile.is_active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: rc?.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} /> : initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name || 'Unnamed'}</div>
                  <div style={{ fontSize: 11, color: 'var(--mut)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge color={rc?.color || '#888'}>{rc?.label || profile.role}</Badge>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: profile.is_active ? '#639922' : '#E24B4A' }} />
                  <span style={{ fontSize: 11, color: 'var(--mut)' }}>{profile.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              {profile.last_login && <div style={{ fontSize: 10, color: 'var(--mut)', marginTop: 8 }}>Last login: {new Date(profile.last_login).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)' }}>No team members found.</div>}

      <Modal open={modal} onClose={() => { setModal(false); setEditItem(null); }} title={editItem ? `Edit ${editItem.name}` : 'Edit user'}>
        <FormRow label="Role">
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            {ROLE_OPTIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </FormRow>
        <FormRow label="Status">
          <select value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm({ ...form, is_active: e.target.value === 'active' })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormRow>
        {editItem && (
          <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 8 }}>
            Email: {editItem.email}<br />
            Joined: {new Date(editItem.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <GhostButton onClick={() => { setModal(false); setEditItem(null); }}>Cancel</GhostButton>
          {role.canManageUsers && <PrimaryButton onClick={handleSave}>Save</PrimaryButton>}
        </div>
      </Modal>
    </div>
  );
}
