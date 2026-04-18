'use client';

import { useState, useMemo } from 'react';
import { Avatar, Badge, Btn, Stat, PageHeader, ProgressBar } from '@/components/ui';
import { Video } from '@/lib/types';
import { WEEKLY_TARGET } from '@/lib/store';
import { AppUser } from '@/lib/auth';

/* ─── Types ─── */
interface EditorStats {
  editor: AppUser & { initials: string; name: string };
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

/* ─── Card wrapper style ─── */
const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  border: '1px solid #E8E8E6',
  padding: 24,
  backgroundColor: '#FFFFFF',
};

/* ─── Component ─── */
export default function EditorsPage({ videos, users = [] }: { videos: Video[], users?: AppUser[] }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculate stats per editor
  const editorStats: EditorStats[] = useMemo(() => {
    const editorsList = users.filter(u => u.role === 'editor' || u.role === 'videographer')
      .map(u => ({
        ...u,
        name: u.username,
        initials: u.username.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
      }));

    return editorsList.map((editor) => {
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
      });
  }, [videos, users]);

  // Weekly totals
  const totalAssigned = editorStats.reduce((s, e) => s + e.assigned, 0);
  const totalCompleted = editorStats.reduce((s, e) => s + e.completed, 0);
  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
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
    cursor: 'pointer',
    userSelect: 'none',
  };
  const thCenter: React.CSSProperties = { ...th, textAlign: 'center' };
  const td: React.CSSProperties = { padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#1A1A1A' };
  const tdCenter: React.CSSProperties = { ...td, textAlign: 'center' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>

      <PageHeader title="Team Workload Balancer" subtitle="Balance editor capacity and track weekly output" />

      {/* ─── TOP STATS ROW ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {/* Total Editors */}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#9B9B9B', fontWeight: 500, marginBottom: 8 }}>
            Total Editors
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#5B5FC7', letterSpacing: '-0.03em' }}>
            {editorStats.length}
          </div>
        </div>
        {/* Weekly Target */}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#9B9B9B', fontWeight: 500, marginBottom: 8 }}>
            Weekly Target
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.03em' }}>
              {WEEKLY_TARGET}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#9B9B9B' }}>videos</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar
              value={totalAssigned}
              max={WEEKLY_TARGET}
              color={weeklyPercent >= 100 ? '#4DAB9A' : weeklyPercent >= 80 ? '#CB7F2C' : '#5B5FC7'}
            />
            <div style={{ fontSize: '0.72rem', color: '#9B9B9B', marginTop: 4 }}>
              {totalAssigned} assigned ({weeklyPercent}%)
            </div>
          </div>
        </div>
        {/* Total Assigned */}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#9B9B9B', fontWeight: 500, marginBottom: 8 }}>
            Total Assigned
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.03em' }}>
            {totalAssigned}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9B9B9B', marginTop: 4 }}>
            {totalCompleted} completed
          </div>
        </div>
        {/* Completion Rate */}
        <div style={cardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#9B9B9B', fontWeight: 500, marginBottom: 8 }}>
            Completion Rate
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4DAB9A', letterSpacing: '-0.03em' }}>
            {completionRate}%
          </div>
        </div>
      </div>

      {/* ─── EDITOR CARDS GRID (2x2) ─── */}
      <div>
        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '1rem' }}>
          Editor Capacity
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {editorStats.map((stat) => {
            const cap = stat.editor.weeklyVideoCap || 22;
            const onTimePercent =
              stat.completed > 0 ? Math.round((stat.onTimeCount / stat.completed) * 100) : 0;

            return (
              <div
                key={stat.editor.id}
                style={{
                  ...cardStyle,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
              >
                {/* Top: Avatar + Name + Status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar initials={stat.editor.initials} size={40} />
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A' }}>
                        {stat.editor.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9B9B9B' }}>Editor</div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      stat.status === 'Over Cap' ? 'danger' : stat.status === 'Near Cap' ? 'warning' : 'success'
                    }
                  >
                    {stat.status}
                  </Badge>
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: '#9B9B9B', fontWeight: 500 }}>Capacity</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1A1A1A' }}>
                      {stat.assigned} <span style={{ fontWeight: 400, color: '#9B9B9B' }}>/ {cap}</span>
                    </span>
                  </div>
                  <ProgressBar value={stat.assigned} max={cap} color={stat.statusColor} />
                  <div style={{ fontSize: '0.7rem', color: '#9B9B9B', marginTop: 4 }}>
                    {stat.capacityPercent}% utilized
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  borderTop: '1px solid #F0F0EE',
                  paddingTop: 14,
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9B9B9B', marginBottom: 2 }}>Assigned</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A' }}>{stat.assigned}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9B9B9B', marginBottom: 2 }}>Completed</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4DAB9A' }}>{stat.completed}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9B9B9B', marginBottom: 2 }}>On-Time</div>
                    <div style={{
                      fontSize: '0.95rem', fontWeight: 600,
                      color: onTimePercent >= 80 ? '#4DAB9A' : onTimePercent >= 50 ? '#CB7F2C' : '#EB5757',
                    }}>
                      {onTimePercent}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9B9B9B', marginBottom: 2 }}>Avg Rev.</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A' }}>{stat.avgRevisions}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── PERFORMANCE TABLE ─── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1A1A1A' }}>
              Performance Table
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginTop: 2 }}>
              Detailed breakdown by editor
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E8E6' }}>
                <th style={th}>
                  Editor <span style={{ color: '#C0C0BC', marginLeft: 4 }}>&#8593;&#8595;</span>
                </th>
                <th style={thCenter}>
                  Assigned <span style={{ color: '#C0C0BC', marginLeft: 4 }}>&#8593;&#8595;</span>
                </th>
                <th style={thCenter}>
                  Capacity <span style={{ color: '#C0C0BC', marginLeft: 4 }}>&#8593;&#8595;</span>
                </th>
                <th style={thCenter}>
                  Completed <span style={{ color: '#C0C0BC', marginLeft: 4 }}>&#8593;&#8595;</span>
                </th>
                <th style={thCenter}>
                  On-Time % <span style={{ color: '#C0C0BC', marginLeft: 4 }}>&#8593;&#8595;</span>
                </th>
                <th style={thCenter}>
                  Avg Revisions <span style={{ color: '#C0C0BC', marginLeft: 4 }}>&#8593;&#8595;</span>
                </th>
                <th style={thCenter}>
                  Status
                </th>
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
                      borderBottom: '1px solid #F0F0EE',
                      backgroundColor: isOverCap ? 'rgba(235, 87, 87, 0.04)' : 'transparent',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOverCap) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FAFAF8';
                    }}
                    onMouseLeave={(e) => {
                      if (!isOverCap) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
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
                    <td style={tdCenter}>
                      <Badge
                        variant={
                          stat.status === 'Over Cap' ? 'danger' : stat.status === 'Near Cap' ? 'warning' : 'success'
                        }
                      >
                        {stat.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── REBALANCE SUGGESTIONS ─── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showSuggestions ? 16 : 0 }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1A1A1A' }}>
              Workload Rebalancing
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginTop: 2 }}>
              AI-suggested editor reassignments
            </div>
          </div>
          <Btn
            variant="primary"
            onClick={() => setShowSuggestions(!showSuggestions)}
            style={{ fontSize: '0.82rem', backgroundColor: '#5B5FC7', borderColor: '#5B5FC7' }}
          >
            {showSuggestions ? 'Hide Suggestions' : 'Suggest Rebalance'}
          </Btn>
        </div>

        {showSuggestions && (
          <div>
            {suggestions.length === 0 ? (
              <div style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#F7FBF9',
                border: '1px solid #D4EDDA',
                borderRadius: 8,
                fontSize: '0.85rem',
                color: '#4DAB9A',
                fontWeight: 500,
              }}>
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
                      padding: '0.75rem 1rem',
                      backgroundColor: '#FAFAF8',
                      border: '1px solid #E8E8E6',
                      borderRadius: 8,
                      fontSize: '0.85rem',
                      color: '#1A1A1A',
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: '#5B5FC7',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {s.count}
                    </span>
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
      </div>
    </div>
  );
}
