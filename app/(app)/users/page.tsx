'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTable, update, log } from '@/lib/hooks';
import { useAuth } from '@/components/auth-provider';
import { MetricCard, Badge, PageHeader, PrimaryButton, GhostButton, DangerButton, Modal, FormRow, PageLoader, ConfirmDialog } from '@/components/ui/shared';
import { SearchInput } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toast-provider';
import { ROLES } from '@/lib/constants';
import type { Profile } from '@/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type PendingInvite = { id: string; email: string; name: string; role: string; invited_at: string };

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ROLE_OPTIONS = Object.entries(ROLES).map(([key, cfg]) => ({ key, label: cfg.label, color: cfg.color }));

export default function UsersPage() {
  const { data: profiles, loading, refetch } = useTable<Profile>('profiles');
  const { user, role } = useAuth();
  const showToast = useToast();
  const [search, setSearch] = useState('');

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ role: 'viewer', is_active: true, name: '', email: '', newPassword: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<Profile | null>(null);

  // Pending invites
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/invite');
      if (res.ok) { const j = await res.json(); setPending(j.pending ?? []); }
    } catch { /* service role key not set yet */ }
  }, []);
  useEffect(() => { if (role.canManageUsers) fetchPending(); }, [role.canManageUsers, fetchPending]);

  const revokeInvite = async (invite: PendingInvite) => {
    await fetch('/api/invite', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: invite.id }) });
    await log('Invite revoked', invite.email, 'users', 'info', user?.name || 'System');
    fetchPending();
  };

  // Invite modal
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'editor' });
  const [inviteState, setInviteState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');

  const filtered = profiles.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  const openEdit = (profile: Profile) => {
    setEditForm({ role: profile.role, is_active: profile.is_active, name: profile.name || '', email: profile.email || '', newPassword: '' });
    setEditItem(profile); setEditModal(true);
  };

  const handleSave = async () => {
    if (!editItem) return;
    setEditSaving(true);
    try {
      // Update role/status in profiles table
      await update('profiles', editItem.id, { role: editForm.role, is_active: editForm.is_active });

      // Update name/email/password via admin API if changed
      const nameChanged = editForm.name.trim() && editForm.name.trim() !== editItem.name;
      const emailChanged = editForm.email.trim() && editForm.email.trim() !== editItem.email;
      const passwordChanged = editForm.newPassword.trim().length > 0;

      if (nameChanged || emailChanged || passwordChanged) {
        const body: Record<string, any> = { userId: editItem.id };
        if (nameChanged) body.name = editForm.name.trim();
        if (emailChanged) body.email = editForm.email.trim();
        if (passwordChanged) body.password = editForm.newPassword;

        const res = await fetch('/api/admin/update-user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Update failed');
      }

      await log('User updated', `${editItem.name} — role: ${editForm.role}`, 'users', 'info', user?.name || 'System');
      showToast('User updated successfully.', 'success');
      setEditModal(false); setEditItem(null); refetch();
    } catch (e: any) {
      showToast(e.message || 'Update failed.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      await log('User deleted', `${profile.name} (${profile.email})`, 'users', 'info', user?.name || 'System');
      showToast('User deleted.', 'success');
      setEditModal(false); setEditItem(null); setConfirmDeleteUser(null); refetch();
    } catch (e: any) {
      showToast(e.message || 'Delete failed.', 'error');
      setConfirmDeleteUser(null);
    }
  };

  const openInvite = () => {
    setInviteForm({ email: '', name: '', role: 'editor' });
    setInviteState('idle'); setInviteError('');
    setInviteModal(true);
  };

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) return;
    setInviteState('loading');
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setInviteError(json.error || 'Invite failed');
        setInviteState('error');
      } else {
        await log('User invited', `${inviteForm.name} (${inviteForm.email}) as ${inviteForm.role}`, 'users', 'success', user?.name || 'System');
        setInviteState('success');
        fetchPending();
      }
    } catch (err: any) {
      setInviteError(err.message);
      setInviteState('error');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Team" subtitle="Manage team members, roles and access.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search team..." />
        {role.canManageUsers && <PrimaryButton onClick={openInvite}>+ Invite user</PrimaryButton>}
      </PageHeader>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <MetricCard label="Total members" value={filtered.length} />
        <MetricCard label="Active" value={filtered.filter(p => p.is_active).length} accent="#4ade80" />
        {ROLE_OPTIONS.map(r => (
          <MetricCard key={r.key} label={r.label} value={filtered.filter(p => p.role === r.key).length} />
        ))}
      </div>

      <div className="table-wrap" style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
              {role.canManageUsers && <th />}
            </tr>
          </thead>
          <tbody>
            {filtered.map(profile => {
              const rc = ROLES[profile.role];
              return (
                <tr key={profile.id} style={{ opacity: profile.is_active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: (ROLES[profile.role]?.color || '#888') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: ROLES[profile.role]?.color || '#888', flexShrink: 0 }}>
                        {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : getInitials(profile.name || '?')}
                      </div>
                      <span style={{ fontWeight: 600 }}>{profile.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--mut)', fontSize: 12 }}>{profile.email}</td>
                  <td><Badge color={rc?.color || '#888'}>{rc?.label || profile.role}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: profile.is_active ? '#4ade80' : '#f87171', display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: 'var(--mut)' }}>{profile.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--mut)' }}>
                    {profile.last_login ? new Date(profile.last_login).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  {role.canManageUsers && (
                    <td>
                      <button onClick={() => openEdit(profile)} style={{ background: 'none', border: '1px solid var(--brd)', borderRadius: 5, padding: '3px 8px', color: 'var(--mut)', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>Edit</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)', fontSize: 13 }}>No team members found.</div>}
      </div>

      {role.canManageUsers && pending.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mut)', marginBottom: 10 }}>
            Pending invites ({pending.length})
          </div>
          <div className="table-wrap" style={{ background: 'var(--bg-2)', border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Invited</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.map(invite => {
                  const rc = ROLES[invite.role];
                  return (
                    <tr key={invite.id}>
                      <td style={{ fontWeight: 600 }}>{invite.name || '—'}</td>
                      <td style={{ color: 'var(--mut)', fontSize: 12 }}>{invite.email}</td>
                      <td><Badge color={rc?.color || '#888'}>{rc?.label || invite.role}</Badge></td>
                      <td style={{ fontSize: 12, color: 'var(--mut)' }}>{timeAgo(invite.invited_at)}</td>
                      <td>
                        <button
                          onClick={() => revokeInvite(invite)}
                          style={{ background: 'none', border: '1px solid var(--brd)', borderRadius: 5, padding: '3px 8px', color: '#f87171', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setEditItem(null); }} title={editItem ? `Edit ${editItem.name}` : 'Edit user'} width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--mut)', marginBottom: 10 }}>Profile</div>
          <FormRow label="Display name">
            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full name" />
          </FormRow>
          <FormRow label="Role">
            <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
              {ROLE_OPTIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </FormRow>
          <FormRow label="Status">
            <select value={editForm.is_active ? 'active' : 'inactive'} onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive (no login)</option>
            </select>
          </FormRow>

          <div style={{ borderTop: '1px solid var(--brd)', margin: '8px 0 14px' }} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--mut)', marginBottom: 10 }}>Auth credentials</div>

          <FormRow label="Email address">
            <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="user@example.com" />
          </FormRow>
          <FormRow label="New password">
            <input type="password" value={editForm.newPassword} onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })} placeholder="Leave blank to keep current" />
          </FormRow>
          <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 16 }}>
            Only fill in fields you want to change. Password changes take effect immediately.
          </div>
          {editItem && (
            <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 8 }}>
              Joined {new Date(editItem.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            {role.canManageUsers && editItem && editItem.id !== user?.id && (
              <DangerButton onClick={() => setConfirmDeleteUser(editItem)}>Delete user</DangerButton>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={() => { setEditModal(false); setEditItem(null); }}>Cancel</GhostButton>
            {role.canManageUsers && (
              <PrimaryButton onClick={handleSave} disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save changes'}
              </PrimaryButton>
            )}
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirmDeleteUser}
        title={`Delete ${confirmDeleteUser?.name}?`}
        message="This will permanently remove their account and access. This cannot be undone."
        confirmLabel="Delete user"
        danger
        onCancel={() => setConfirmDeleteUser(null)}
        onConfirm={() => { if (confirmDeleteUser) handleDeleteUser(confirmDeleteUser); }}
      />

      {/* Invite user modal */}
      <Modal open={inviteModal} onClose={() => { setInviteModal(false); setInviteState('idle'); }} title="Invite team member">
        {inviteState === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Invite sent!</div>
            <div style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 20 }}>
              An invite email has been sent to <strong style={{ color: 'var(--fg)' }}>{inviteForm.email}</strong>.<br />
              They will be added as <strong style={{ color: 'var(--fg)' }}>{ROLE_OPTIONS.find(r => r.key === inviteForm.role)?.label}</strong> when they sign up.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <GhostButton onClick={() => { setInviteState('idle'); setInviteForm({ email: '', name: '', role: 'editor' }); }}>Invite another</GhostButton>
              <PrimaryButton onClick={() => { setInviteModal(false); setInviteState('idle'); }}>Done</PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            <FormRow label="Full name" required>
              <input value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="e.g. Maria Santos" disabled={inviteState === 'loading'} />
            </FormRow>
            <FormRow label="Email address" required>
              <input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="e.g. maria@example.com" disabled={inviteState === 'loading'} />
            </FormRow>
            <FormRow label="Role">
              <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })} disabled={inviteState === 'loading'}>
                {ROLE_OPTIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </FormRow>
            <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 16, lineHeight: 1.5 }}>
              They'll receive an email with a link to set up their account. Their role will be assigned automatically.
            </div>
            {inviteState === 'error' && (
              <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12, padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)' }}>
                {inviteError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <GhostButton onClick={() => setInviteModal(false)}>Cancel</GhostButton>
              <PrimaryButton onClick={handleInvite} disabled={inviteState === 'loading' || !inviteForm.email || !inviteForm.name}>
                {inviteState === 'loading' ? 'Sending...' : 'Send invite'}
              </PrimaryButton>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
