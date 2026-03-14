'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile, useActivityLog } from '@/lib/hooks';
import { ROLES, NAV_ITEMS } from '@/lib/constants';
import {
  LayoutDashboard, DollarSign, Shield, Video, Upload,
  Megaphone, Clock, Users, Menu, LogOut
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, DollarSign, Shield, Video, Upload, Megaphone, Clock, Users,
};

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, loading } = useProfile();
  const { addLog } = useActivityLog();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const role = profile ? ROLES[profile.role] || ROLES.viewer : ROLES.viewer;
  const currentBoard = pathname.split('/').pop() || 'dashboard';

  const handleLogout = async () => {
    if (profile) {
      await addLog(`${profile.name} signed out`, '', 'system', 'info', profile.name);
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-0)' }}>
        <div className="text-center">
          <div className="text-2xl font-extrabold mb-2" style={{ color: '#7F77DD' }}>VIRAL VISION</div>
          <div className="text-sm" style={{ color: 'var(--mut)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    router.push('/login');
    return null;
  }

  const visibleNav = NAV_ITEMS.filter(n => role.boards.includes(n.key));

  return (
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
          const IconComp = ICONS[item.icon];
          return (
            <button
              key={item.key}
              onClick={() => router.push(`/${item.key}`)}
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
              {IconComp && <IconComp size={18} style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }} />}
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
  );
}
