'use client';

import React, { useState, useMemo } from 'react';
import { Avatar, Badge, Btn, Checkbox, ConfirmModal, PageHeader, Stat } from '@/components/ui';
import { Client, Video } from '@/lib/types';
import { TEAM, EDITORS } from '@/lib/store';

interface ProductionPageProps {
  clients: Client[];
  videos: Video[];
  setVideos: (fn: (prev: Video[]) => Video[]) => void;
  canDelete?: boolean;
  editors?: { id: string; name: string }[];
}

type EditingStatus = 'Not Started' | 'Editing' | 'Delivered' | 'Revision' | 'Approved';

interface WeekGroup {
  week: number;
  clients: (Client & { videoData: Video[] })[];
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "editing", label: "Editing" },
  { value: "delivered", label: "Delivered" },
  { value: "revision", label: "Revision" },
  { value: "approved", label: "Approved" },
];

const inlineSelectStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 12,
  border: "1px solid #E3E3E0",
  borderRadius: 4,
  fontFamily: "inherit",
  background: "#FFF",
};

const inlineNumberStyle: React.CSSProperties = {
  width: 50,
  padding: "4px 6px",
  fontSize: 12,
  border: "1px solid #E3E3E0",
  borderRadius: 4,
  textAlign: "center" as const,
  fontFamily: "inherit",
  background: "#FFF",
};

export default function ProductionPage({
  clients,
  videos,
  setVideos,
  canDelete,
  editors: editorsProp,
}: ProductionPageProps) {
  const editorList = editorsProp || EDITORS.map(e => ({ id: e.id, name: e.name }));
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [noteModalVideoId, setNoteModalVideoId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [selectedClientForVideo, setSelectedClientForVideo] = useState<Client | null>(null);
  const [videoFormData, setVideoFormData] = useState({ title: "", platform: "Instagram", shootDate: "", dueDate: "" });

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

  const handleCreateVideo = () => {
    if (!selectedClientForVideo || !videoFormData.title) return;
    const client = selectedClientForVideo;
    const newVideo: Video = {
      id: `v-${Date.now()}`,
      clientId: client.id,
      editorId: client.assignedEditor || EDITORS[0]?.id || "e1",
      week: client.week,
      title: videoFormData.title,
      shootDate: videoFormData.shootDate || new Date().toISOString().split("T")[0],
      dueDate: videoFormData.dueDate || new Date().toISOString().split("T")[0],
      footageUploaded: false,
      editingStatus: "not_started",
      revisionsUsed: 0,
      captionWritten: false,
      thumbnailDone: false,
      platform: videoFormData.platform,
      postingStatus: "pending",
      sentToGuido: false,
      posted: false,
      notes: [],
    };
    setVideos((prev) => [...prev, newVideo]);
    setShowAddVideoModal(false);
    setSelectedClientForVideo(null);
    setVideoFormData({ title: "", platform: "Instagram", shootDate: "", dueDate: "" });
  };

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader
        title="Production Control Center"
        subtitle="Manage all client videos and production workflow"
      >
        <Btn variant="primary" onClick={() => { setSelectedClientForVideo(clients[0] || null); setShowAddVideoModal(true); }}>
          Add Video
        </Btn>
      </PageHeader>

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
                        {canDelete && (
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
                            Delete
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {group.clients.map((client, idx) => {
                        const firstVideo = client.videoData[0];
                        const editingStatus = getEditingStatus(client.videoData);
                        const isRowExpanded = expandedRowId === client.id;

                        return (
                          <React.Fragment key={client.id}>
                          <tr
                            style={{
                              borderBottom: '1px solid #E3E3E0',
                              backgroundColor: isRowExpanded ? '#F0F0EE' : idx % 2 === 0 ? '#FFFFFF' : '#F7F7F5',
                            }}
                          >
                            {/* Client Name */}
                            <td
                              onClick={() => setExpandedRowId(isRowExpanded ? null : client.id)}
                              style={{ padding: '16px 24px', color: '#1A1A1A', fontWeight: '500', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 10, color: "#9B9B9B", transition: "transform 0.2s", transform: isRowExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>&#9654;</span>
                                {client.name}
                              </span>
                            </td>

                            {/* Monthly Revenue */}
                            <td style={{ padding: '16px 24px', color: '#1A1A1A' }}>
                              ${(client.monthlyRevenue || 0).toLocaleString()}
                            </td>

                            {/* Assigned Editor */}
                            <td style={{ padding: '16px 24px' }}>
                              {firstVideo ? (
                                <select
                                  value={firstVideo.editorId || ''}
                                  onChange={(e) =>
                                    handleVideoPropertyChange(firstVideo.id, 'editorId', e.target.value)
                                  }
                                  style={inlineSelectStyle}
                                >
                                  <option value="">Unassigned</option>
                                  {editorList.map((editor) => (
                                    <option key={editor.id} value={editor.id}>
                                      {editor.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ color: '#9B9B9B', fontSize: '13px' }}>Unassigned</span>
                              )}
                            </td>

                            {/* Shoot Date */}
                            <td style={{ padding: '16px 24px' }}>
                              <input
                                type="date"
                                value={firstVideo?.shootDate || ''}
                                onChange={(e) =>
                                  firstVideo &&
                                  handleVideoPropertyChange(firstVideo.id, 'shootDate', e.target.value)
                                }
                                style={inlineSelectStyle}
                              />
                            </td>

                            {/* Footage Uploaded */}
                            <td style={{ padding: '16px 24px' }}>
                              <Checkbox
                                checked={firstVideo?.footageUploaded || false}
                                onChange={() =>
                                  firstVideo &&
                                  handleVideoPropertyChange(
                                    firstVideo.id,
                                    'footageUploaded',
                                    !firstVideo.footageUploaded
                                  )
                                }
                              />
                            </td>

                            {/* Editing Status */}
                            <td style={{ padding: '16px 24px' }}>
                              <select
                                value={firstVideo?.editingStatus || 'not_started'}
                                onChange={(e) =>
                                  firstVideo &&
                                  handleVideoPropertyChange(firstVideo.id, 'editingStatus', e.target.value)
                                }
                                style={inlineSelectStyle}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
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
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                value={firstVideo?.revisionsUsed || 0}
                                onChange={(e) =>
                                  firstVideo &&
                                  handleVideoPropertyChange(
                                    firstVideo.id,
                                    'revisionsUsed',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                style={inlineNumberStyle}
                              />
                            </td>

                            {/* Delete */}
                            {canDelete && (
                              <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                <button
                                  onClick={() => firstVideo && setDeletingVideo(firstVideo)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#EB5757',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                          {/* Expanded Row */}
                          {isRowExpanded && (
                            <tr>
                              <td colSpan={canDelete ? 11 : 10} style={{ padding: 0 }}>
                                <div style={{ background: "#F7F7F5", padding: "16px 24px", borderTop: "1px solid #E3E3E0" }}>
                                  {/* Mini video table */}
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>
                                    Videos ({client.videoData.length})
                                  </div>
                                  {client.videoData.length === 0 ? (
                                    <div style={{ fontSize: 12, color: "#9B9B9B", padding: "8px 0" }}>No videos for this client.</div>
                                  ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, background: "#FFFFFF", borderRadius: 6, overflow: "hidden", border: "1px solid #E3E3E0" }}>
                                      <thead>
                                        <tr style={{ borderBottom: "1px solid #E3E3E0", background: "#FAFAF9" }}>
                                          {["Title", "Platform", "Status", "Due Date", "Notes", "Status Timeline"].map(h => (
                                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {client.videoData.map((vid) => {
                                          const statusSteps = ["not_started", "editing", "delivered", "revision", "approved"];
                                          const statusLabels: Record<string, string> = { not_started: "Not Started", editing: "Editing", delivered: "Delivered", revision: "Revision", approved: "Approved" };
                                          const currentIdx = statusSteps.indexOf(vid.editingStatus || "not_started");
                                          return (
                                            <tr key={vid.id} style={{ borderBottom: "1px solid #F0F0EE" }}>
                                              <td style={{ padding: "10px 12px", fontWeight: 500, color: "#1A1A1A" }}>{vid.title || "Untitled"}</td>
                                              <td style={{ padding: "10px 12px", color: "#6B6B6B" }}>{vid.platform || "—"}</td>
                                              <td style={{ padding: "10px 12px" }}>
                                                <Badge variant={getStatusBadgeVariant((statusLabels[vid.editingStatus || "not_started"] || "Not Started") as EditingStatus)}>
                                                  {statusLabels[vid.editingStatus || "not_started"] || "Not Started"}
                                                </Badge>
                                              </td>
                                              <td style={{ padding: "10px 12px", color: "#6B6B6B" }}>{vid.dueDate || "—"}</td>
                                              <td style={{ padding: "10px 12px" }}>
                                                {(vid.notes || []).length > 0 ? (
                                                  <span
                                                    onClick={(e) => { e.stopPropagation(); setNoteModalVideoId(vid.id); }}
                                                    style={{ fontSize: 11, fontWeight: 600, color: "#4DAB9A", cursor: "pointer", padding: "2px 8px", borderRadius: 10, background: "#EAF5F2" }}
                                                  >
                                                    {vid.notes.length} note{vid.notes.length !== 1 ? "s" : ""}
                                                  </span>
                                                ) : (
                                                  <span
                                                    onClick={(e) => { e.stopPropagation(); setNoteModalVideoId(vid.id); }}
                                                    style={{ fontSize: 11, color: "#9B9B9B", cursor: "pointer", fontWeight: 500 }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#4DAB9A"; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9B9B9B"; }}
                                                  >
                                                    + Add note
                                                  </span>
                                                )}
                                              </td>
                                              <td style={{ padding: "10px 12px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                  {statusSteps.map((step, si) => {
                                                    const isCompleted = si <= currentIdx;
                                                    const isCurrent = si === currentIdx;
                                                    return (
                                                      <React.Fragment key={step}>
                                                        <div style={{
                                                          width: isCurrent ? 10 : 8, height: isCurrent ? 10 : 8,
                                                          borderRadius: "50%",
                                                          background: isCompleted ? "#4DAB9A" : "#E3E3E0",
                                                          border: isCurrent ? "2px solid #4DAB9A" : "none",
                                                          boxSizing: "border-box",
                                                        }} title={statusLabels[step]} />
                                                        {si < statusSteps.length - 1 && (
                                                          <div style={{ width: 12, height: 2, background: si < currentIdx ? "#4DAB9A" : "#E3E3E0" }} />
                                                        )}
                                                      </React.Fragment>
                                                    );
                                                  })}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  )}

                                  {/* History / Notes */}
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginTop: 16, marginBottom: 8 }}>History</div>
                                  {(() => {
                                    const allNotes = client.videoData.flatMap(vid => (vid.notes || []).map(n => ({ ...n, videoTitle: vid.title })));
                                    if (allNotes.length === 0) return <div style={{ fontSize: 12, color: "#9B9B9B", padding: "8px 0" }}>No history entries yet.</div>;
                                    return (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {allNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((n, i) => {
                                          const actionColor = n.from === "Production" ? "#1A73E8" : n.from === "Publishing" ? "#4DAB9A" : "#9B9B9B";
                                          return (
                                            <div key={i} style={{ padding: "8px 12px", background: "#FFFFFF", borderRadius: 6, borderLeft: `3px solid ${actionColor}`, fontSize: 12 }}>
                                              <span style={{ color: "#9B9B9B", fontSize: 11 }}>{new Date(n.date).toLocaleDateString()} — {n.from} — {n.videoTitle}</span>
                                              <div style={{ color: "#1A1A1A", marginTop: 2 }}>{n.text}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
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

      {/* Notes Modal */}
      {noteModalVideoId && (() => {
        const video = videos.find(v => v.id === noteModalVideoId);
        if (!video) return null;
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }} onClick={() => { setNoteModalVideoId(null); setNoteText(""); }}>
            <div style={{ background: "#FFF", borderRadius: 12, width: 480, maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E3E3E0" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Notes — {video.title}</h3>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
                {(video.notes || []).length === 0 ? (
                  <div style={{ textAlign: "center", color: "#9B9B9B", padding: "24px 0", fontSize: 13 }}>No notes yet</div>
                ) : (
                  video.notes.map((n, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: i < video.notes.length - 1 ? "1px solid #EBEBEA" : "none" }}>
                      <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 4 }}>{new Date(n.date).toLocaleDateString()} — {n.from}</div>
                      <div style={{ fontSize: 13, color: "#1A1A1A" }}>{n.text}</div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid #E3E3E0" }}>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E3E3E0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                  <button onClick={() => { setNoteModalVideoId(null); setNoteText(""); }} style={{ padding: "8px 16px", border: "1px solid #E3E3E0", borderRadius: 6, background: "transparent", color: "#6B6B6B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  <button onClick={() => { if (!noteText.trim()) return; setVideos(prev => prev.map(v => v.id === noteModalVideoId ? { ...v, notes: [...v.notes, { from: "Production", date: new Date().toISOString(), text: noteText.trim() }] } : v)); setNoteText(""); }} style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: "#1A1A1A", color: "#FFF", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Save Note</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirm Modal */}
      {deletingVideo && (
        <ConfirmModal
          title="Delete Video"
          message="This will permanently remove this video from production."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            setVideos(prev => prev.filter(v => v.id !== deletingVideo.id));
            setDeletingVideo(null);
          }}
          onCancel={() => setDeletingVideo(null)}
        />
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setShowAddVideoModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF", borderRadius: 8, border: "1px solid #E3E3E0",
              padding: 40, maxWidth: 500, width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A", margin: "0 0 28px", letterSpacing: "-0.01em" }}>
              Add Video
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>Client</label>
                <select
                  value={selectedClientForVideo?.id || ""}
                  onChange={(e) => setSelectedClientForVideo(clients.find((c) => c.id === e.target.value) || null)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #E3E3E0", fontSize: 13, fontFamily: "inherit" }}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>Title</label>
                <input
                  type="text" value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  placeholder="e.g., Brand intro reel"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #E3E3E0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>Platform</label>
                <select
                  value={videoFormData.platform}
                  onChange={(e) => setVideoFormData({ ...videoFormData, platform: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #E3E3E0", fontSize: 13, fontFamily: "inherit" }}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Facebook">Facebook</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>Shoot Date</label>
                  <input
                    type="date" value={videoFormData.shootDate}
                    onChange={(e) => setVideoFormData({ ...videoFormData, shootDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #E3E3E0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>Due Date</label>
                  <input
                    type="date" value={videoFormData.dueDate}
                    onChange={(e) => setVideoFormData({ ...videoFormData, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #E3E3E0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn onClick={() => setShowAddVideoModal(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreateVideo}>Create Video</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
