'use client';

import { useState } from 'react';
import { Avatar, Badge, Btn, Stat, PageHeader, ProgressBar } from '@/components/ui';
import { Video } from '@/lib/types';
import { TEAM, EDITORS, WEEKLY_TARGET } from '@/lib/store';

interface EditorStats {
  editor: typeof EDITORS[0];
  assigned: number;
  completed: number;
  onTimeCount: number;
  avgRevisions: number;
  qualityRating: number;
}

export default function EditorsPage({ videos }: { videos: Video[] }) {
  const [expandedEditor, setExpandedEditor] = useState<string | null>(null);

  // Calculate stats per editor
  const editorStats: EditorStats[] = EDITORS.map((editor) => {
    const editorVideos = videos.filter((v) => v.editorId === editor.id);
    const assigned = editorVideos.length;
    const completed = editorVideos.filter(
      (v) => v.editingStatus === 'approved' && v.posted === true
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

    const qualityRatings: Record<string, number> = {
      alex: 4.2,
      araceli: 3.8,
      leonardo: 4.5,
      rodrigo: 4.0,
    };

    return {
      editor,
      assigned,
      completed,
      onTimeCount,
      avgRevisions: parseFloat(avgRevisions.toFixed(1)),
      qualityRating: qualityRatings[editor.id] || 4.0,
    };
  });

  // Calculate current weekly total
  const weeklyCompleted = editorStats.reduce((sum, stat) => sum + stat.completed, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      {/* SECTION A: Weekly Production Control */}
      <div>
        <PageHeader title="Weekly Production Control" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {editorStats.map((stat) => {
            const remaining = stat.assigned - stat.completed;
            const capacityPercent = (stat.assigned / 15) * 100;
            let capacityStatus = 'On Track';
            let statusColor = '#4DAB9A';

            if (capacityPercent > 100) {
              capacityStatus = 'Over Cap';
              statusColor = '#EB5757';
            } else if (capacityPercent > 85) {
              capacityStatus = 'Near Cap';
              statusColor = '#CB7F2C';
            }

            return (
              <div
                key={stat.editor.id}
                style={{
                  border: '1px solid #E3E3E0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 2px 8px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
                onClick={() =>
                  setExpandedEditor(
                    expandedEditor === stat.editor.id ? null : stat.editor.id
                  )
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Avatar initials={stat.editor.initials} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1A1A1A' }}>
                      {stat.editor.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9B9B9B' }}>
                      {stat.editor.role}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9B9B9B', marginBottom: '0.25rem' }}>
                      Assigned
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A' }}>
                      {stat.assigned}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9B9B9B', marginBottom: '0.25rem' }}>
                      Completed
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4DAB9A' }}>
                      {stat.completed}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>
                    Remaining: {remaining}
                  </div>
                  <ProgressBar
                    value={capacityPercent}
                    max={100}
                    color={statusColor}
                  />
                </div>

                <Badge variant={capacityStatus === 'Over Cap' ? 'danger' : capacityStatus === 'Near Cap' ? 'warning' : 'success'}>
                  {capacityStatus}
                </Badge>

                {expandedEditor === stat.editor.id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E3E3E0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginBottom: '0.75rem' }}>
                      Assigned Videos:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {videos
                        .filter((v) => v.editorId === stat.editor.id)
                        .map((v) => (
                          <div
                            key={v.id}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#F7F7F5',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                            }}
                          >
                            <div style={{ color: '#1A1A1A', fontWeight: '500' }}>
                              {v.title}
                            </div>
                            <div style={{ color: '#9B9B9B', marginTop: '0.25rem' }}>
                              {v.clientId} • {v.editingStatus}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: '2rem',
            backgroundColor: '#F7F7F5',
            borderRadius: '8px',
            border: '1px solid #E3E3E0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#9B9B9B', marginBottom: '0.5rem' }}>
                Weekly Target
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1A1A1A' }}>
                {weeklyCompleted} / {WEEKLY_TARGET} videos
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: weeklyCompleted >= WEEKLY_TARGET ? '#4DAB9A' : '#CB7F2C' }}>
              {weeklyCompleted >= WEEKLY_TARGET ? '✓ On Target' : `−${WEEKLY_TARGET - weeklyCompleted} remaining`}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Editor Performance */}
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <PageHeader title="Editor Performance" />
          <div style={{ fontSize: '0.8rem', color: '#9B9B9B', marginTop: '0.5rem' }}>
            Reviewed every Friday
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E3E3E0',
              borderRadius: '8px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #E3E3E0',
                  backgroundColor: '#F7F7F5',
                }}
              >
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                  }}
                >
                  Editor
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                  }}
                >
                  Assigned
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                  }}
                >
                  Completed
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                  }}
                >
                  On-Time %
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                  }}
                >
                  Avg Revisions
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                  }}
                >
                  Quality Rating
                </th>
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#6B6B6B',
                  }}
                >
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {editorStats.map((stat) => {
                const onTimePercent =
                  stat.completed > 0
                    ? Math.round((stat.onTimeCount / stat.completed) * 100)
                    : 0;

                return (
                  <tr
                    key={stat.editor.id}
                    style={{
                      borderBottom: '1px solid #E3E3E0',
                    }}
                  >
                    <td
                      style={{
                        padding: '1rem',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#1A1A1A',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar initials={stat.editor.initials} />
                        {stat.editor.name}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: '#1A1A1A',
                      }}
                    >
                      {stat.assigned}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: '#4DAB9A',
                        fontWeight: '600',
                      }}
                    >
                      {stat.completed}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: '#1A1A1A',
                      }}
                    >
                      {onTimePercent}%
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: '#1A1A1A',
                      }}
                    >
                      {stat.avgRevisions}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: '#1A1A1A',
                      }}
                    >
                      {stat.qualityRating}
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        fontSize: '0.85rem',
                        color: '#9B9B9B',
                      }}
                    >
                      {stat.assigned > 14 ? 'High capacity' : 'Capacity available'}
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
