'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile, useActivityLog } from '@/lib/hooks';
import { ROLES, NAV_ITEMS } from '@/lib/constants';
import { Modal, FormRow, PrimaryButton } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toast-provider';
import {
  LayoutDashboard, DollarSign, Shield, Video, Upload,
  Megaphone, Clock, Users, Menu, LogOut, Settings, MessageSquare,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, DollarSign, Shield, Video, Upload, Megaphone, Clock, Users, MessageSquare,
};

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, loading } = useProfile();
  const { addLog } = useActivityLog();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Nav loading state
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  useEffect(() => { setNavigatingTo(null); }, [pathname]);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security'>('profile');
  const [nameVal, setNameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const showToast = useToast();

  const openSettings = () => {
    setNameVal(profile?.name || '');
    setEmailVal(profile?.email || '');
    setNewPassword('');
    setConfirmPassword('');
    setSettingsTab('profile');
    setSettingsOpen(true);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSettingsLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ name: nameVal }).eq('id', profile.id);
      if (error) throw error;
      showToast('Profile updated.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Update failed.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveEmail = async () => {
    setSettingsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: emailVal });
      if (error) throw error;
      showToast('Confirmation sent to new email. Check your inbox.', 'info');
    } catch (e: any) {
      showToast(e.message || 'Update failed.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    setSettingsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      showToast(e.message || 'Update failed.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const role = profile ? ROLES[profile.role] || ROLES.viewer : ROLES.viewer;
  const currentBoard = pathname.split('/').pop() || 'dashboard';

  const handleLogout = async () => {
    if (profile) {
      await addLog(`${profile.name} signed out`, '', 'system', 'info', profile.name);
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigate = (key: string) => {
    setNavigatingTo(key);
    router.push(`/${key}`);
  };

  useEffect(() => {
    if (!loading && !profile) router.push('/login');
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-0)' }}>
        <div className="text-center">
          <div className="text-2xl font-extrabold mb-2" style={{ color: '#7F77DD' }}>VIRAL VISION</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div className="nav-spinner" />
            <span className="text-sm" style={{ color: 'var(--mut)' }}>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const visibleNav = NAV_ITEMS.filter(n => role.boards.includes(n.key));

  return (
    <>
      <div
        className="flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden"
        style={{
          width: sidebarOpen ? 224 : 56,
          background: 'var(--bg-1)',
          borderRight: '1px solid var(--brd)',
        }}
      >
        <div className="flex items-center gap-2 p-4" style={{ justifyContent: sidebarOpen ? 'space-between' : 'center' }}>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-extrabold" style={{ color: '#7F77DD' }}>VIRAL VISION</div>
              <div className="text-[9px] font-semibold tracking-widest" style={{ color: 'var(--mut)' }}>OPERATING SYSTEM</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 6 }}>
            <Menu size={16} />
          </button>
        </div>

        <div className="flex-1 px-1.5 py-1">
          {visibleNav.map(item => {
            const active = currentBoard === item.key;
            const isNavigating = navigatingTo === item.key;
            const IconComp = ICONS[item.icon];
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className="flex items-center gap-2.5 w-full rounded-lg mb-0.5 transition-all"
                style={{
                  padding: sidebarOpen ? '9px 12px' : '9px 0',
                  background: active ? 'rgba(127,119,221,0.12)' : 'transparent',
                  color: active ? '#7F77DD' : 'var(--mut)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}
              >
                {isNavigating
                  ? <div className="nav-spinner" style={{ marginLeft: sidebarOpen ? 0 : 'auto', marginRight: sidebarOpen ? 0 : 'auto' }} />
                  : IconComp && <IconComp size={18} style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }} />
                }
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {sidebarOpen && (
          <div className="p-3" style={{ borderTop: '1px solid var(--brd)' }}>
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <div
                className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{ width: 32, height: 32, background: (role.color || '#7F77DD') + '30', color: role.color }}
              >
                {profile.avatar || profile.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold truncate">{profile.name}</div>
                <span
                  className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: (role.color || '#888') + '1A', color: role.color }}
                >
                  {role.label}
                </span>
              </div>
              <button
                onClick={openSettings}
                title="Settings"
                style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, opacity: 0.6 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >
                <Settings size={14} />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium"
              style={{ background: 'transparent', border: '1px solid var(--brd)', color: 'var(--mut)', cursor: 'pointer' }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Account settings" width={460}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--brd)', paddingBottom: 12 }}>
          {(['profile', 'security'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSettingsTab(tab)}
              style={{
                background: settingsTab === tab ? 'rgba(127,119,221,0.12)' : 'transparent',
                color: settingsTab === tab ? '#7F77DD' : 'var(--mut)',
                border: 'none', borderRadius: 6, padding: '6px 14px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {settingsTab === 'profile' && (
          <>
            <FormRow label="Display name">
              <input value={nameVal} onChange={e => setNameVal(e.target.value)} placeholder="Your name" />
            </FormRow>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton onClick={saveProfile} disabled={settingsLoading || !nameVal.trim()}>
                {settingsLoading ? 'Saving...' : 'Save name'}
              </PrimaryButton>
            </div>

            <div style={{ borderTop: '1px solid var(--brd)', margin: '20px 0' }} />

            <FormRow label="Email address">
              <input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="you@example.com" />
            </FormRow>
            <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 14 }}>
              A confirmation link will be sent to the new email.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton onClick={saveEmail} disabled={settingsLoading || !emailVal.trim()}>
                {settingsLoading ? 'Sending...' : 'Update email'}
              </PrimaryButton>
            </div>
          </>
        )}

        {settingsTab === 'security' && (
          <>
            <FormRow label="New password">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </FormRow>
            <FormRow label="Confirm password">
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
            </FormRow>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton onClick={savePassword} disabled={settingsLoading || !newPassword || !confirmPassword}>
                {settingsLoading ? 'Updating...' : 'Change password'}
              </PrimaryButton>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
