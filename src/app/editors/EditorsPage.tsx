'use client';

import { useState, useMemo } from 'react';
import { Avatar, Badge, Btn, Stat, PageHeader, ProgressBar } from '@/components/ui';
import { Video } from '@/lib/types';
import { TEAM, EDITORS, WEEKLY_TARGET } from '@/lib/store';

/* ─── Types ─── */
interface EditorStats {
  editor: typeof EDITORS[0];
  assigned: number;
  completed: number;
  onTimeCount: number;
  avgRevisions: number;
  capacityPercent: number;
  status: 'On Track' | 'Near Cap' | 'Over Cap';
  statusColor: string;
}

interface RebalanceSuggestion {
  fromEditor: string;
  toEditor: string;
  count: number;
}

/* ─── Helpers ─── */
function getCapacityColor(pct: number) {
  if (pct > 90) return '#EB5757';
  if (pct >= 70) return '#CB7F2C';
  return '#4DAB9A';
}

function getStatus(pct: number): 'On Track' | 'Near Cap' | 'Over Cap' {
  if (pct > 90) return 'Over Cap';
  if (pct >= 70) return 'Near Cap';
  return 'On Track';
}

/* ─── Component ─── */
export default function EditorsPage({ videos }: { videos: Video[] }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculate stats per editor
  const editorStats: EditorStats[] = useMemo(
    () =>
      EDITORS.map((editor) => {
        const editorVideos = videos.filter((v) => v.editorId === editor.id);
        const assigned = editorVideos.length;
        const completed = editorVideos.filter(
          (v) => v.editingStatus === 'approved' || v.posted === true
        ).length;
        const onTimeCount = editorVideos.filter((v) => {
          if (v.editingStatus !== 'approved') return false;
          const approveNote = [...v.notes].reverse().find((n) => n.action === 'approve');
          const approvedDate = approveNote ? new Date(approveNote.date) : new Date();
          return approvedDate <= new Date(v.dueDate);
        }).length;
        const avgRevisions =
          assigned > 0
            ? editorVideos.reduce((sum, v) => sum + (v.revisionsUsed || 0), 0) / assigned
            : 0;

        const cap = editor.weeklyVideoCap || 22;
        const capacityPercent = cap > 0 ? (assigned / cap) * 100 : 0;

        return {
          editor,
          assigned,
          completed,
          onTimeCount,
          avgRevisions: parseFloat(avgRevisions.toFixed(1)),
          capacityPercent: Math.round(capacityPercent),
          status: getStatus(capacityPercent),
          statusColor: getCapacityColor(capacityPercent),
        };
      }),
    [videos]
  );

  // Weekly totals
  const totalAssigned = editorStats.reduce((s, e) => s + e.assigned, 0);
  const totalCompleted = editorStats.reduce((s, e) => s + e.completed, 0);
  const weeklyPercent = WEEKLY_TARGET > 0 ? Math.round((totalAssigned / WEEKLY_TARGET) * 100) : 0;

  // Auto-balance suggestions
  const suggestions: RebalanceSuggestion[] = useMemo(() => {
    const over = editorStats.filter((e) => e.capacityPercent > 90);
    const under = editorStats.filter((e) => e.capacityPercent < 60);
    const result: RebalanceSuggestion[] = [];

    for (const o of over) {
      const cap = o.editor.weeklyVideoCap || 22;
      const excess = o.assigned - Math.floor(cap * 0.8);
      if (excess <= 0) continue;

      let remaining = excess;
      for (const u of under) {
        if (remaining <= 0) break;
        const uCap = u.editor.weeklyVideoCap || 22;
        const room = Math.floor(uCap * 0.7) - u.assigned;
        if (room <= 0) continue;
        const move = Math.min(remaining, room);
        if (move > 0) {
          result.push({ fromEditor: o.editor.name, toEditor: u.editor.name, count: move });
          remaining -= move;
        }
      }
    }

    return result;
  }, [editorStats]);

  /* ─── Table header cell style ─── */
  const th: React.CSSProperties = {
    padding: '0.85rem 1rem',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6B6B6B',
    whiteSpace: 'nowrap',
  };
  const thCenter: React.CSSProperties = { ...th, textAlign: 'center' };
  const td: React.CSSProperties = { padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#1A1A1A' };
  const tdCenter: React.CSSProperties = { ...td, textAlign: 'center' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '2rem' }}>

      {/* ─── SECTION 1: Weekly Target Tracker ─── */}
      <div>
        <PageHeader title="Team Workload Balancer" subtitle="Balance editor capacity and track weekly output" />

        <div
          style={{
            padding: '1.75rem 2rem',
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #E3E3E0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.4rem', fontWeight: 500 }}>
                Weekly Target
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.03em' }}>
                {totalAssigned} / {WEEKLY_TARGET} videos
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.4rem', fontWeight: 500 }}>
                Completed
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4DAB9A' }}>
                {totalCompleted}
              </div>
            </div>
          </div>
          <ProgressBar
            value={totalAssigned}
            max={WEEKLY_TARGET}
            color={weeklyPercent >= 100 ? '#4DAB9A' : weeklyPercent >= 80 ? '#CB7F2C' : '#6B6B6B'}
          />
          <div style={{ fontSize: '0.75rem', color: '#9B9B9B', marginTop: '0.5rem' }}>
            {weeklyPercent}% of weekly target assigned
            {totalAssigned < WEEKLY_TARGET && ` — ${WEEKLY_TARGET - totalAssigned} more needed`}
            {totalAssigned >= WEEKLY_TARGET && ' — Target met'}
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Editor Overview Cards ─── */}
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '1rem' }}>
          Editor Capacity
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
          }}
        >
          {editorStats.map((stat) => {
            const cap = stat.editor.weeklyVideoCap || 22;

            return (
              <div
                key={stat.editor.id}
                style={{
                  border: '1px solid #E3E3E0',
                  borderRadius: 8,
                  padding: '1.5rem',
                  backgroundColor: '#FFFFFF',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <Avatar initials={stat.editor.initials} size={36} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A' }}>
                      {stat.editor.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9B9B9B' }}>
                      Editor
                    </div>
                  </div>
                </div>

                {/* Assigned / Cap */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9B9B9B', fontWeight: 500 }}>
                    Assigned / Cap
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A' }}>
                    {stat.assigned}{' '}
                    <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#9B9B9B' }}>/ {cap}</span>
                  </div>
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <ProgressBar value={stat.assigned} max={cap} color={stat.statusColor} />
                  <div style={{ fontSize: '0.7rem', color: '#9B9B9B', marginTop: '0.35rem' }}>
                    {stat.capacityPercent}% capacity
                  </div>
                </div>

                {/* Completed */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9B9B9B' }}>Completed</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4DAB9A' }}>
                    {stat.completed}
                  </div>
                </div>

                {/* Status badge */}
                <Badge
                  variant={
                    stat.status === 'Over Cap' ? 'danger' : stat.status === 'Near Cap' ? 'warning' : 'success'
                  }
                >
                  {stat.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 3: Workload Balancer Table ─── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1A1A1A' }}>
              Workload Balancer
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginTop: '0.25rem' }}>
              Detailed breakdown by editor
            </div>
          </div>
          <Btn
            variant="primary"
            onClick={() => setShowSuggestions(!showSuggestions)}
            style={{ fontSize: '0.82rem' }}
          >
            {showSuggestions ? 'Hide Suggestions' : 'Suggest Rebalance'}
          </Btn>
        </div>

        {/* Rebalance suggestion panel */}
        {showSuggestions && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#FFFDF5',
              border: '1px solid #E8DFC0',
              borderRadius: 8,
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '0.75rem' }}>
              Rebalance Suggestions
            </div>
            {suggestions.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
                All editors are within healthy capacity ranges. No rebalancing needed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E3E3E0',
                      borderRadius: 6,
                      fontSize: '0.85rem',
                      color: '#1A1A1A',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#EB5757' }}>Move {s.count} video{s.count > 1 ? 's' : ''}</span>
                    <span style={{ color: '#9B9B9B' }}>from</span>
                    <span style={{ fontWeight: 600 }}>{s.fromEditor}</span>
                    <span style={{ color: '#9B9B9B' }}>to</span>
                    <span style={{ fontWeight: 600, color: '#4DAB9A' }}>{s.toEditor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E3E3E0',
              borderRadius: 8,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #E3E3E0', backgroundColor: '#F7F7F5' }}>
                <th style={th}>Editor</th>
                <th style={thCenter}>Assigned</th>
                <th style={thCenter}>Capacity</th>
                <th style={thCenter}>Completed</th>
                <th style={thCenter}>On-Time %</th>
                <th style={thCenter}>Avg Revisions</th>
              </tr>
            </thead>
            <tbody>
              {editorStats.map((stat) => {
                const cap = stat.editor.weeklyVideoCap || 22;
                const onTimePercent =
                  stat.completed > 0 ? Math.round((stat.onTimeCount / stat.completed) * 100) : 0;
                const isOverCap = stat.capacityPercent > 90;

                return (
                  <tr
                    key={stat.editor.id}
                    style={{
                      borderBottom: '1px solid #E3E3E0',
                      backgroundColor: isOverCap ? 'rgba(235, 87, 87, 0.05)' : 'transparent',
                    }}
                  >
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar initials={stat.editor.initials} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{stat.editor.name}</div>
                          {isOverCap && (
                            <div style={{ fontSize: '0.7rem', color: '#EB5757', fontWeight: 500 }}>
                              Over capacity
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdCenter}>
                      <span style={{ fontWeight: 600 }}>{stat.assigned}</span>
                    </td>
                    <td style={tdCenter}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 500 }}>{stat.assigned} / {cap}</span>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: stat.statusColor,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ ...tdCenter, color: '#4DAB9A', fontWeight: 600 }}>
                      {stat.completed}
                    </td>
                    <td style={tdCenter}>
                      <span
                        style={{
                          color: onTimePercent >= 80 ? '#4DAB9A' : onTimePercent >= 50 ? '#CB7F2C' : '#EB5757',
                          fontWeight: 500,
                        }}
                      >
                        {onTimePercent}%
                      </span>
                    </td>
                    <td style={tdCenter}>
                      {stat.avgRevisions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
