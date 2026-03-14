'use client';

import { useState } from 'react';
import { useTable } from '@/lib/hooks';
import { MetricCard, Badge, PageHeader, SearchInput } from '@/components/ui/shared';
import type { ActivityEntry } from '@/types';

const LOG_COLORS: Record<string, string> = { success: '#639922', info: '#378ADD', warning: '#EF9F27', error: '#E24B4A' };
const BOARDS = ['sales', 'onboarding', 'production', 'publishing', 'ads'];

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function dateGroup(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entry = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - entry.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function ActivityPage() {
  const { data: logs } = useTable<ActivityEntry>('activity_log', 'created_at');
  const [search, setSearch] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = logs.filter(l => {
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.detail.toLowerCase().includes(search.toLowerCase()) && !l.user_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (boardFilter && l.board !== boardFilter) return false;
    if (typeFilter && l.log_type !== typeFilter) return false;
    return true;
  });

  const today = filtered.filter(l => dateGroup(l.created_at) === 'Today').length;

  const groups: { label: string; items: ActivityEntry[] }[] = [];
  filtered.forEach(l => {
    const g = dateGroup(l.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === g) { last.items.push(l); }
    else { groups.push({ label: g, items: [l] }); }
  });

  return (
    <div>
      <PageHeader title="Activity log" subtitle="Real-time feed of all actions across boards." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Total" value={filtered.length} accent="#7F77DD" />
        <MetricCard label="Today" value={today} accent="#378ADD" />
        <MetricCard label="Errors" value={filtered.filter(l => l.log_type === 'error').length} accent="#E24B4A" />
        <MetricCard label="Warnings" value={filtered.filter(l => l.log_type === 'warning').length} accent="#EF9F27" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 180 }}><SearchInput value={search} onChange={setSearch} placeholder="Search actions..." /></div>
        <select value={boardFilter} onChange={e => setBoardFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--brd)', background: 'var(--bg-2)', color: 'var(--fg)', fontSize: 12 }}>
          <option value="">All boards</option>
          {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--brd)', background: 'var(--bg-2)', color: 'var(--fg)', fontSize: 12 }}>
          <option value="">All types</option>
          {Object.keys(LOG_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--mut)', marginBottom: 8, paddingLeft: 4 }}>{group.label}</div>
          <div style={{ background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--brd)', overflow: 'hidden' }}>
            {group.items.map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < group.items.length - 1 ? '1px solid var(--brd)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: LOG_COLORS[entry.log_type] || '#378ADD', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.action}</span>
                  {entry.detail && <span style={{ fontSize: 12, color: 'var(--mut)', marginLeft: 6 }}>— {entry.detail}</span>}
                </div>
                {entry.board && <Badge color="#7F77DD">{entry.board}</Badge>}
                <span style={{ fontSize: 11, color: 'var(--mut)', whiteSpace: 'nowrap' }}>{entry.user_name || 'System'}</span>
                <span style={{ fontSize: 11, color: 'var(--mut)', whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}>{timeAgo(entry.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--mut)' }}>No activity found.</div>}
    </div>
  );
}
