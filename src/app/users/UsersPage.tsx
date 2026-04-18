'use client';

import { useState } from 'react';
import { Btn, PageHeader, Badge, ConfirmModal } from '@/components/ui';
import { AppUser, ALL_PAGES } from '@/lib/auth';
import { upsertUser, deleteUser as deleteUserDb } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface UsersPageProps {
  users: AppUser[];
  setUsers: (fn: (prev: AppUser[]) => AppUser[]) => void;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  sales: "Sales",
  onboarding: "Onboarding",
  clients: "Clients",
  production: "Production",
  approvals: "Approvals",
  publishing: "Publishing",
  editors: "Editors",
  ads: "Ads",
  packages: "Packages",
  knowledge: "Knowledge Base",
  activity: "Activity Log",
};

export default function UsersPage({ users, setUsers }: UsersPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [formRole, setFormRole] = useState<AppUser["role"]>("member");
  const [formPermissions, setFormPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_PAGES.map((p) => [p, true]))
  );
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '' });
    setFormRole("member");
    setFormPermissions(Object.fromEntries(ALL_PAGES.map((p) => [p, true])));
    setEditingUser(null);
    setShowModal(false);
    setFormError('');
    setFormLoading(false);
  };

  const handleEditUser = (user: AppUser) => {
    setFormData({ username: user.username, email: user.email, password: '' });
    setFormRole(user.role);
    setFormPermissions({ ...user.permissions });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.username || !formData.email) {
      setFormError('Username and email are required.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    if (editingUser) {
      // Update existing user's profile (no password change via profile update)
      const updatedUser: AppUser = {
        ...editingUser,
        username: formData.username,
        email: formData.email,
        role: formRole,
        permissions: formPermissions,
      };
      setUsers((prev) => prev.map((u) => u.id === editingUser.id ? updatedUser : u));
      await upsertUser(updatedUser);
      resetForm();
    } else {
      // Create new user via Supabase Auth (requires service role — use invite instead)
      if (!formData.password || formData.password.length < 6) {
        setFormError('Password must be at least 6 characters for new users.');
        setFormLoading(false);
        return;
      }

      // Sign up the new user via Supabase Auth
      // Note: This creates an auth.users entry, which triggers handle_new_user()
      // to create the profiles row automatically.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.username,
            role: formRole,
          },
        },
      });

      if (signUpError) {
        setFormError(signUpError.message);
        setFormLoading(false);
        return;
      }

      if (signUpData.user) {
        // Update the profile with permissions and role
        const newUser: AppUser = {
          id: signUpData.user.id,
          username: formData.username,
          email: formData.email,
          role: formRole,
          permissions: formPermissions,
        };
        // Update profile row (handle_new_user trigger already created it)
        await upsertUser(newUser);
        setUsers((prev) => [...prev, newUser]);
      }

      resetForm();
    }
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
    deleteUserDb(deletingUser.id);
    setDeletingUser(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin': return <Badge variant="danger">Super Admin</Badge>;
      case 'admin': return <Badge variant="warning">Admin</Badge>;
      case 'editor': return <Badge variant="active">Editor</Badge>;
      case 'videographer': return <Badge variant="active">Videographer</Badge>;
      case 'social_manager': return <Badge variant="success">Social Manager</Badge>;
      default: return <Badge variant="default">Member</Badge>;
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader title="User Management" subtitle="Manage team access and permissions">
        <Btn variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>Add User</Btn>
      </PageHeader>

      {/* Users Table */}
      <div style={{ overflowX: 'auto', marginTop: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E3E3E0', borderRadius: 8 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E3E3E0', backgroundColor: '#F7F7F5' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
              <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Board Access</th>
              <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #E3E3E0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F7F7F5' }}>
                <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{user.username}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6B6B' }}>{user.email}</td>
                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                  {user.role === 'superadmin' ? (
                    getRoleBadge(user.role)
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const newRole = e.target.value as AppUser["role"];
                        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
                        upsertUser({ ...user, role: newRole });
                      }}
                      style={{ padding: "3px 8px", fontSize: 12, border: "1px solid #E3E3E0", borderRadius: 4, fontFamily: "inherit", background: "transparent" }}
                    >
                      <option value="member">Member</option>
                      <option value="editor">Editor</option>
                      <option value="videographer">Videographer</option>
                      <option value="social_manager">Social Manager</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  )}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ALL_PAGES.filter((p) => user.permissions[p]).map((p) => (
                      <span key={p} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 3 }}>
                        {PAGE_LABELS[p]}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEditUser(user)}
                      style={{ border: 'none', background: 'transparent', color: '#6B6B6B', fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontFamily: 'inherit' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F0F0EE'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      Edit
                    </button>
                    {user.role !== 'superadmin' && (
                      <button
                        onClick={() => setDeletingUser(user)}
                        style={{ border: 'none', background: 'transparent', color: '#EB5757', fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontFamily: 'inherit' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FDECEC'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000,
          }}
          onClick={resetForm}
        >
          <div
            style={{
              background: '#FFFFFF', borderRadius: 8, border: '1px solid #E3E3E0',
              padding: '2rem', maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '1.5rem' }}>
              {editingUser ? 'Edit User' : 'Add User'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                <input
                  type="text" value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Full name"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: 6, fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input
                  type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@beauticate.com"
                  disabled={!!editingUser}
                  style={{
                    width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: 6, fontSize: '0.9rem', fontFamily: 'inherit',
                    opacity: editingUser ? 0.6 : 1,
                  }}
                />
                {editingUser && (
                  <p style={{ fontSize: 11, color: '#A0A0A0', marginTop: 4 }}>Email cannot be changed after account creation.</p>
                )}
              </div>

              {/* Password field only for new users */}
              {!editingUser && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Password</label>
                  <input
                    type="password" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: 6, fontSize: '0.9rem', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as AppUser["role"])}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: 6, fontSize: '0.9rem', fontFamily: 'inherit' }}
                >
                  <option value="member">Member</option>
                  <option value="editor">Editor</option>
                  <option value="videographer">Videographer</option>
                  <option value="social_manager">Social Manager</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Board Permissions */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: '0.75rem' }}>Board Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ALL_PAGES.map((page) => (
                    <label key={page} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#1A1A1A' }}>
                      <input
                        type="checkbox"
                        checked={formPermissions[page] ?? true}
                        onChange={(e) => setFormPermissions({ ...formPermissions, [page]: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      {PAGE_LABELS[page]}
                    </label>
                  ))}
                </div>
              </div>

              {formError && (
                <div style={{ fontSize: 13, color: '#DC3545', background: '#FDF2F2', padding: '10px 14px', borderRadius: 8, border: '1px solid #FECACA' }}>
                  {formError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <Btn onClick={resetForm}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSaveUser} disabled={formLoading}>
                {formLoading ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingUser && (
        <ConfirmModal
          title="Delete User"
          message={`This will permanently remove ${deletingUser.username}'s account.`}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}
