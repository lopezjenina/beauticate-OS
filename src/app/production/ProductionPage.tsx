'use client';

import React, { useState, useMemo } from 'react';
import { Avatar, Badge, Checkbox, PageHeader, Stat } from '@/components/ui';
import { Client, Video } from '@/lib/types';
import { TEAM } from '@/lib/store';

interface ProductionPageProps {
  clients: Client[];
  videos: Video[];
  setVideos: (fn: (prev: Video[]) => Video[]) => void;
}

type EditingStatus = 'Not Started' | 'Editing' | 'Delivered' | 'Revision' | 'Approved';

interface WeekGroup {
  week: number;
  clients: (Client & { videoData: Video[] })[];
}

export default function ProductionPage({
  clients,
  videos,
  setVideos,
}: ProductionPageProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3, 4]));

  // Group clients by week
  const weekGroups = useMemo<WeekGroup[]>(() => {
    const grouped: Record<number, (Client & { videoData: Video[] })[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    clients.forEach((client) => {
      const week = client.week || 1;
      if (week in grouped) {
        const videoData = videos.filter((v) => v.clientId === client.id);
        grouped[week].push({ ...client, videoData });
      }
    });

    return Object.entries(grouped)
      .map(([week, clientList]) => ({
        week: parseInt(week),
        clients: clientList,
      }))
      .sort((a, b) => a.week - b.week);
  }, [clients, videos]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalVideos = videos.length;
    const weeklyRevenue = clients.reduce((sum, client) => sum + (client.monthlyRevenue || 0), 0) / 4;

    return { totalClients, totalVideos, weeklyRevenue };
  }, [clients, videos]);

  // Get most common editing status for a client
  const getEditingStatus = (videoData: Video[]): EditingStatus => {
    if (videoData.length === 0) return 'Not Started';

    const statusCounts: Record<EditingStatus, number> = {
      'Not Started': 0,
      'Editing': 0,
      'Delivered': 0,
      'Revision': 0,
      'Approved': 0,
    };

    videoData.forEach((video) => {
      const status = (video.editingStatus || 'Not Started') as EditingStatus;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    const statuses = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status]) => status as EditingStatus);

    if (statuses.length > 1) return 'Approved'; // Represent mixed as the highest status
    return statuses[0] || 'Not Started';
  };

  const getStatusBadgeVariant = (status: EditingStatus): string => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Delivered':
        return 'active';
      case 'Editing':
        return 'warning';
      case 'Revision':
        return 'danger';
      case 'Not Started':
      default:
        return 'default';
    }
  };

  const getAssignedEditor = (editorId?: string) => {
    if (!editorId) return null;
    return TEAM.find((member) => member.id === editorId && member.role === 'editor');
  };

  const toggleWeekExpanded = (week: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(week)) {
      newExpanded.delete(week);
    } else {
      newExpanded.add(week);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleVideoPropertyChange = (videoId: string, property: string, value: any) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId ? { ...video, [property]: value } : video
      )
    );
  };

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader
        title="Production Control Center"
        subtitle="Manage all client videos and production workflow"
      />

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginTop: '40px',
          marginBottom: '40px',
        }}
      >
        <Stat
          label="Total Clients"
          value={stats.totalClients}
        />
        <Stat
          label="Videos in Pipeline"
          value={stats.totalVideos}
        />
        <Stat
          label="Weekly Revenue"
          value={`$${Math.round(stats.weeklyRevenue).toLocaleString()}`}
        />
      </div>

      {/* Weekly Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {weekGroups.map((group) => {
          const isExpanded = expandedWeeks.has(group.week);
          const shootCount = group.clients.reduce(
            (sum, client) =>
              sum +
              (client.videoData.filter((v) => v.shootDate).length > 0 ? 1 : 0),
            0
          );
          const isShootLimitReached = shootCount >= 6;

          return (
            <div
              key={group.week}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E3E3E0',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {/* Week Header */}
              <div
                onClick={() => toggleWeekExpanded(group.week)}
                style={{
                  padding: '16px 24px',
                  cursor: 'pointer',
                  backgroundColor: '#F7F7F5',
                  borderBottom: isExpanded ? '1px solid #E3E3E0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1A1A1A',
                    }}
                  >
                    Week {group.week}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      color: '#9B9B9B',
                      fontWeight: '500',
                    }}
                  >
                    {group.clients.length} client{group.clients.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '18px',
                    color: '#6B6B6B',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
              </div>

              {/* Shoot Limit Warning */}
              {isExpanded && isShootLimitReached && (
                <div
                  style={{
                    backgroundColor: '#FCE8E6',
                    border: '1px solid #EB5757',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    padding: '12px 24px',
                    color: '#A1261D',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  Shoot limit reached for this week
                </div>
              )}

              {/* Table Content */}
              {isExpanded && (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#F7F7F5', borderBottom: '1px solid #E3E3E0' }}>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Client Name
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Monthly Revenue
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Assigned Editor
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Shoot Date
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Footage Uploaded
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Editing Status
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Ready for Posting
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Sent to Guido
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Posted
                        </th>
                        <th
                          style={{
                            padding: '12px 24px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#1A1A1A',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Revisions Used
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.clients.map((client, idx) => {
                        const firstVideo = client.videoData[0];
                        const editingStatus = getEditingStatus(client.videoData);

                        return (
                          <tr
                            key={client.id}
                            style={{
                              borderBottom: '1px solid #E3E3E0',
                              backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F7F7F5',
                            }}
                          >
                            {/* Client Name */}
                            <td style={{ padding: '16px 24px', color: '#1A1A1A', fontWeight: '500' }}>
                              {client.name}
                            </td>

                            {/* Monthly Revenue */}
                            <td style={{ padding: '16px 24px', color: '#1A1A1A' }}>
                              ${(client.monthlyRevenue || 0).toLocaleString()}
                            </td>

                            {/* Assigned Editor */}
                            <td style={{ padding: '16px 24px' }}>
                              {client.assignedEditor ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <Avatar
                                    initials={getAssignedEditor(client.assignedEditor)?.initials || '??'}
                                    size={24}
                                  />
                                  <span style={{ color: '#1A1A1A', fontSize: '13px' }}>
                                    {getAssignedEditor(client.assignedEditor)?.name}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: '#9B9B9B', fontSize: '13px' }}>Unassigned</span>
                              )}
                            </td>

                            {/* Shoot Date */}
                            <td style={{ padding: '16px 24px', color: '#1A1A1A' }}>
                              {firstVideo?.shootDate || ''}
                            </td>

                            {/* Footage Uploaded */}
                            <td style={{ padding: '16px 24px' }}>
                              {firstVideo?.footageUploaded ? (
                                <Badge variant="success">Yes</Badge>
                              ) : (
                                <Badge>No</Badge>
                              )}
                            </td>

                            {/* Editing Status */}
                            <td style={{ padding: '16px 24px' }}>
                              <Badge variant={getStatusBadgeVariant(editingStatus)}>
                                {editingStatus}
                              </Badge>
                            </td>

                            {/* Approved */}
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              {firstVideo?.editingStatus === 'approved' ? (
                                <Badge variant="success">Yes</Badge>
                              ) : (
                                <Badge>No</Badge>
                              )}
                            </td>

                            {/* Sent to Guido */}
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              <Checkbox
                                checked={firstVideo?.sentToGuido || false}
                                onChange={() =>
                                  firstVideo &&
                                  handleVideoPropertyChange(
                                    firstVideo.id,
                                    'sentToGuido',
                                    !firstVideo.sentToGuido
                                  )
                                }
                              />
                            </td>

                            {/* Posted */}
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              <Checkbox
                                checked={firstVideo?.posted || false}
                                onChange={() =>
                                  firstVideo &&
                                  handleVideoPropertyChange(
                                    firstVideo.id,
                                    'posted',
                                    !firstVideo.posted
                                  )
                                }
                              />
                            </td>

                            {/* Revisions Used */}
                            <td style={{ padding: '16px 24px', textAlign: 'center', color: '#1A1A1A' }}>
                              {firstVideo?.revisionsUsed || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
