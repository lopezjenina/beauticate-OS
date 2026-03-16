'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/hooks';
import type { Notification } from '@/types';

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifIcon({ type }: { type: Notification['type'] }) {
  const style: React.CSSProperties = { fontSize: 14, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  if (type === 'mention') return <div style={{ ...style, background: 'rgba(127,119,221,0.15)', color: '#7F77DD' }}>@</div>;
  if (type === 'assignment') return <div style={{ ...style, background: 'rgba(55,138,221,0.15)', color: '#378ADD' }}>📋</div>;
  return <div style={{ ...style, background: 'rgba(239,159,39,0.15)', color: '#EF9F27' }}>🔔</div>;
}

export function NotificationPanel({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n: Notification) => {
    markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8,
          width: '100%', padding: collapsed ? '10px 0' : '8px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: open ? 'rgba(127,119,221,0.1)' : 'transparent',
          border: 'none', borderRadius: 8, cursor: 'pointer', position: 'relative',
          color: 'var(--mut)', transition: 'background 0.15s',
        }}
      >
        {/* Bell icon */}
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#E24B4A', color: '#fff',
              fontSize: 9, fontWeight: 700, lineHeight: 1,
              minWidth: 14, height: 14, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        {!collapsed && (
          <>
            <span style={{ fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'left', color: 'var(--fg)' }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ background: '#E24B4A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'fixed', left: collapsed ? 64 : 232, bottom: 80, zIndex: 1000,
          width: 320, maxHeight: 420, overflowY: 'auto',
          background: 'var(--bg-2)', border: '1px solid var(--brd)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 10px', borderBottom: '1px solid var(--brd)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: '#7F77DD', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--mut)', fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex', gap: 10, width: '100%', padding: '10px 14px',
                  background: n.is_read ? 'transparent' : 'rgba(127,119,221,0.06)',
                  border: 'none', borderBottom: '1px solid var(--brd)',
                  cursor: 'pointer', textAlign: 'left', alignItems: 'flex-start',
                  transition: 'background 0.1s',
                }}
              >
                <NotifIcon type={n.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: 'var(--fg)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{ fontSize: 11, color: 'var(--mut)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--mut)', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7F77DD', flexShrink: 0, marginTop: 4 }} />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
