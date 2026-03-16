'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile, useActivityLog } from '@/lib/hooks';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { ROLES, NAV_ITEMS } from '@/lib/constants';
import { Modal, FormRow, PrimaryButton } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toast-provider';
import {
  LayoutDashboard, DollarSign, Shield, Video, Upload,
  Megaphone, Clock, Users, Menu, LogOut, Settings, MessageSquare, X,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, DollarSign, Shield, Video, Upload, Megaphone, Clock, Users, MessageSquare,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, loading } = useProfile();
  const { addLog } = useActivityLog();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const currentBoard = pathname.split('/').pop() || 'dashboard';

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Nav loading state
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  useEffect(() => { setNavigatingTo(null); }, [pathname]);

  // Board notification badges
  const [unreadBoards, setUnreadBoards] = useState<Record<string, number>>({});
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel('sidebar_activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, payload => {
        const board = (payload.new as any).board as string | undefined;
        if (board && board !== currentBoard) {
          setUnreadBoards(prev => ({ ...prev, [board]: (prev[board] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentBoard]);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security'>('profile');
  const [nameVal, setNameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const showToast = useToast();

  // User menu dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userMenuPos, setUserMenuPos] = useState({ top: 0, left: 0 });
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current && !userMenuRef.current.contains(e.target as Node) &&
        userBtnRef.current && !userBtnRef.current.contains(e.target as Node)
      ) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openSettings = () => {
    setNameVal(profile?.name || '');
    setEmailVal(profile?.email || '');
    setNewPassword(''); setConfirmPassword('');
    setSettingsTab('profile');
    setSettingsOpen(true);
    setUserMenuOpen(false);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSettingsLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ name: nameVal }).eq('id', profile.id);
      if (error) throw error;
      showToast('Profile updated.', 'success');
    } catch (e: any) { showToast(e.message || 'Update failed.', 'error'); }
    finally { setSettingsLoading(false); }
  };

  const saveEmail = async () => {
    setSettingsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: emailVal });
      if (error) throw error;
      showToast('Confirmation sent to new email.', 'info');
    } catch (e: any) { showToast(e.message || 'Update failed.', 'error'); }
    finally { setSettingsLoading(false); }
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
    if (newPassword.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
    setSettingsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password updated.', 'success');
      setNewPassword(''); setConfirmPassword('');
    } catch (e: any) { showToast(e.message || 'Update failed.', 'error'); }
    finally { setSettingsLoading(false); }
  };

  const role = profile ? ROLES[profile.role] || ROLES.viewer : ROLES.viewer;

  const handleLogout = async () => {
    if (profile) await addLog(`${profile.name} signed out`, '', 'system', 'info', profile.name);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigate = (key: string) => {
    setNavigatingTo(key);
    setUnreadBoards(prev => { const next = { ...prev }; delete next[key]; return next; });
    router.push(`/${key}`);
  };

  const toggleUserMenu = () => {
    if (!userMenuOpen && userBtnRef.current) {
      const r = userBtnRef.current.getBoundingClientRect();
      const dropdownWidth = 220;
      const left = Math.min(r.left, window.innerWidth - dropdownWidth - 8);
      setUserMenuPos({ top: r.bottom + 8, left: Math.max(8, left) });
    }
    setUserMenuOpen(o => !o);
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

  // ── Avatar button ────────────────────────────────────────
  const AvatarButton = () => (
    <button
      ref={userBtnRef}
      onClick={toggleUserMenu}
      aria-label="User menu"
      title={profile.name}
      style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: userMenuOpen ? (role.color || '#7F77DD') + '40' : (role.color || '#7F77DD') + '22',
        color: role.color || '#7F77DD',
        border: `1.5px solid ${userMenuOpen ? (role.color || '#7F77DD') + '80' : (role.color || '#7F77DD') + '40'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {profile.avatar || getInitials(profile.name)}
    </button>
  );

  // ── User dropdown menu ───────────────────────────────────
  const UserDropdown = () => (
    <div
      ref={userMenuRef}
      style={{
        position: 'fixed', top: userMenuPos.top, left: userMenuPos.left, zIndex: 1200,
        width: 220, background: 'var(--bg-1)', border: '1px solid var(--brd)',
        borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        overflow: 'hidden',
      }}
    >
      {/* Profile info */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--brd)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: (role.color || '#7F77DD') + '22', color: role.color || '#7F77DD', border: `1.5px solid ${(role.color || '#7F77DD') + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {profile.avatar || getInitials(profile.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: role.color, background: (role.color || '#888') + '20', padding: '1px 7px', borderRadius: 8, display: 'inline-block', marginTop: 2 }}>{role.label}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '6px 6px' }}>
        <button
          onClick={openSettings}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: 'transparent', border: 'none', borderRadius: 8, color: 'var(--fg)', cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'background 0.1s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Settings size={15} style={{ color: 'var(--mut)', flexShrink: 0 }} />
          Account settings
        </button>
        <div style={{ height: 1, background: 'var(--brd)', margin: '4px 6px' }} />
        <button
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: 'transparent', border: 'none', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'background 0.1s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          Sign out
        </button>
      </div>
    </div>
  );

  // ── Shared nav items renderer ────────────────────────────
  const NavItems = ({ expanded }: { expanded: boolean }) => (
    <>
      {visibleNav.map(item => {
        const active = currentBoard === item.key;
        const isNavigating = navigatingTo === item.key;
        const IconComp = ICONS[item.icon];
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              display: 'flex', alignItems: 'center',
              gap: expanded ? 10 : 0,
              width: '100%',
              padding: expanded ? '10px 12px' : '9px 0',
              background: active ? 'rgba(127,119,221,0.12)' : 'transparent',
              color: active ? '#7F77DD' : 'var(--mut)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: active ? 700 : 400,
              justifyContent: expanded ? 'flex-start' : 'center',
              textAlign: 'left', marginBottom: 2,
            }}
          >
            {isNavigating
              ? <div className="nav-spinner" />
              : (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {IconComp && <IconComp size={18} style={{ opacity: active ? 1 : 0.7, display: 'block' }} />}
                  {!active && unreadBoards[item.key] > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -6, background: '#E24B4A', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 700, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1 }}>
                      {unreadBoards[item.key] > 9 ? '9+' : unreadBoards[item.key]}
                    </span>
                  )}
                </div>
              )}
            {expanded && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
            {expanded && !active && unreadBoards[item.key] > 0 && (
              <span style={{ background: '#E24B4A', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>
                {unreadBoards[item.key] > 9 ? '9+' : unreadBoards[item.key]}
              </span>
            )}
          </button>
        );
      })}
    </>
  );

  // ── Settings modal (shared) ─────────────────────────────
  const SettingsModal = () => (
    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Account settings" width={460}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--brd)', paddingBottom: 12 }}>
        {(['profile', 'security'] as const).map(tab => (
          <button key={tab} onClick={() => setSettingsTab(tab)} style={{ background: settingsTab === tab ? 'rgba(127,119,221,0.12)' : 'transparent', color: settingsTab === tab ? '#7F77DD' : 'var(--mut)', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>
      {settingsTab === 'profile' && (
        <>
          <FormRow label="Display name"><input value={nameVal} onChange={e => setNameVal(e.target.value)} placeholder="Your name" /></FormRow>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryButton onClick={saveProfile} disabled={settingsLoading || !nameVal.trim()}>{settingsLoading ? 'Saving...' : 'Save name'}</PrimaryButton></div>
          <div style={{ borderTop: '1px solid var(--brd)', margin: '20px 0' }} />
          <FormRow label="Email address"><input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="you@example.com" /></FormRow>
          <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 14 }}>A confirmation link will be sent to the new email.</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryButton onClick={saveEmail} disabled={settingsLoading || !emailVal.trim()}>{settingsLoading ? 'Sending...' : 'Update email'}</PrimaryButton></div>
        </>
      )}
      {settingsTab === 'security' && (
        <>
          <FormRow label="New password"><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" /></FormRow>
          <FormRow label="Confirm password"><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" /></FormRow>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryButton onClick={savePassword} disabled={settingsLoading || !newPassword || !confirmPassword}>{settingsLoading ? 'Updating...' : 'Change password'}</PrimaryButton></div>
        </>
      )}
    </Modal>
  );

  // ── MOBILE layout ───────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Fixed top bar */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: 'var(--bg-1)', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', zIndex: 300 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#7F77DD', lineHeight: 1.2 }}>VIRAL VISION</div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--mut)' }}>OPERATING SYSTEM</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <NotificationPanel collapsed={true} />
            <AvatarButton />
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" style={{ background: 'none', border: 'none', color: 'var(--fg)', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 398, backdropFilter: 'blur(2px)' }}
          />
        )}

        {/* Slide-in drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, height: '100dvh', width: 272,
          background: 'var(--bg-1)', borderRight: '1px solid var(--brd)',
          zIndex: 399, display: 'flex', flexDirection: 'column',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Drawer header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 10px' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#7F77DD' }}>VIRAL VISION</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--mut)' }}>OPERATING SYSTEM</div>
            </div>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 6 }}>
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <div style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
            <NavItems expanded={true} />
          </div>
        </div>

        {userMenuOpen && <UserDropdown />}
        <SettingsModal />
      </>
    );
  }

  // ── DESKTOP layout ──────────────────────────────────────
  return (
    <>
      <div
        className="flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden"
        style={{ width: sidebarOpen ? 224 : 56, background: 'var(--bg-1)', borderRight: '1px solid var(--brd)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: sidebarOpen ? '14px 12px 10px' : '14px 0 10px', justifyContent: sidebarOpen ? 'space-between' : 'center', gap: 6 }}>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-sm font-extrabold" style={{ color: '#7F77DD' }}>VIRAL VISION</div>
              <div className="text-[11px] font-semibold tracking-widest" style={{ color: 'var(--mut)' }}>OPERATING SYSTEM</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? 4 : 0, flexDirection: sidebarOpen ? 'row' : 'column', rowGap: 6 }}>
            <NotificationPanel collapsed={true} />
            <AvatarButton />
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <Menu size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse button when closed */}
        {!sidebarOpen && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6 }}>
            <button onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: 6, display: 'flex' }}>
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--brd)', margin: '0 10px 6px' }} />

        {/* Nav */}
        <div className="flex-1 px-1.5 py-1" style={{ overflowY: 'auto' }}>
          <NavItems expanded={sidebarOpen} />
        </div>
      </div>

      {userMenuOpen && <UserDropdown />}
      <SettingsModal />
    </>
  );
}
