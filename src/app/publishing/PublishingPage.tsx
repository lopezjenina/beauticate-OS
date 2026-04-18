"use client";

import React, { useMemo, useState } from "react";
import { Video, Client } from "@/lib/types";
import { AppUser } from "@/lib/auth";
import { PageHeader, Badge, Btn, Avatar, Stat, showToast } from "@/components/ui";
import { logActivity } from "@/lib/activityLog";
import { updateVideoField, upsertVideo } from "@/lib/db";

interface Props {
  videos: Video[];
  setVideos: (fn: (prev: Video[]) => Video[]) => void;
  userName?: string;
  clients?: Client[];
  users?: AppUser[];
}

export default function PublishingPage({ videos, setVideos, userName, clients = [], users = [] }: Props) {
  const today = new Date("2026-03-30");
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    new Set([1, 2, 3, 4])
  );

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [noteModalVideoId, setNoteModalVideoId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const publishingVideos = videos.filter(
    (v) => v.editingStatus === "approved" && v.sentToGuido === true
  );

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || "Unknown";

  const getEditorName = (editorId: string) =>
    users.find((u) => u.id === editorId)?.username || "Unknown";

  const getEditorInitials = (editorId: string) => {
    const name = users.find((u) => u.id === editorId)?.username || "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const getWeekNumber = (dateStr: string): number => {
    const date = new Date(dateStr);
    const weekStart = new Date("2026-03-30");
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    let week = 1;
    while (date >= new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      weekStart.setDate(weekStart.getDate() + 7);
      week++;
    }
    return week;
  };

  const groupedByWeek = useMemo(() => {
    const groups: Record<number, Video[]> = { 1: [], 2: [], 3: [], 4: [] };
    publishingVideos.forEach((video) => {
      const week = getWeekNumber(video.scheduledDate || today.toISOString());
      if (week in groups) {
        groups[week].push(video);
      } else {
        groups[week] = [video];
      }
    });
    return groups;
  }, [publishingVideos]);

  const stats = useMemo(() => {
    const totalInQueue = publishingVideos.length;
    const captionsDone = publishingVideos.filter(
      (v) => v.captionWritten
    ).length;
    const thumbnailsDone = publishingVideos.filter(
      (v) => v.thumbnailDone
    ).length;
    const scheduled = publishingVideos.filter(
      (v) => v.postingStatus === "scheduled"
    ).length;

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    const postedThisWeek = publishingVideos.filter((v) => {
      if (v.postingStatus !== "posted" || !v.scheduledDate) return false;
      const schedDate = new Date(v.scheduledDate);
      return schedDate >= thisWeekStart && schedDate <= thisWeekEnd;
    }).length;

    return { totalInQueue, captionsDone, thumbnailsDone, scheduled, postedThisWeek };
  }, [publishingVideos]);

  const updateVideo = (videoId: string, updates: Partial<Video>) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, ...updates } : v))
    );
  };

  const toggleCaption = (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      updateVideo(videoId, { captionWritten: !video.captionWritten });
      updateVideoField(videoId, "captionWritten", !video.captionWritten);
      logActivity({ user: userName || "Unknown", action: "updated", entity: "video", entityName: video.title || "Untitled", details: `Caption marked ${!video.captionWritten ? "done" : "pending"}` });
    }
  };

  const toggleThumbnail = (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      updateVideo(videoId, { thumbnailDone: !video.thumbnailDone });
      updateVideoField(videoId, "thumbnailDone", !video.thumbnailDone);
      logActivity({ user: userName || "Unknown", action: "updated", entity: "video", entityName: video.title || "Untitled", details: `Thumbnail marked ${!video.thumbnailDone ? "done" : "pending"}` });
    }
  };

  const setScheduledDate = (videoId: string, dateStr: string) => {
    const video = videos.find((v) => v.id === videoId);
    updateVideo(videoId, { scheduledDate: dateStr });
    updateVideoField(videoId, "scheduledDate", dateStr);
    if (video) logActivity({ user: userName || "Unknown", action: "updated", entity: "video", entityName: video.title || "Untitled", details: `Scheduled date set to ${dateStr}` });
  };

  const setPostingStatus = (
    videoId: string,
    status: "pending" | "scheduled" | "posted"
  ) => {
    const video = videos.find((v) => v.id === videoId);
    updateVideo(videoId, { postingStatus: status });
    updateVideoField(videoId, "postingStatus", status);
    if (video) logActivity({ user: userName || "Unknown", action: "updated", entity: "video", entityName: video.title || "Untitled", details: `Posting status → ${status}` });
    if (status === "posted") showToast(`"${video?.title || "Video"}" marked as posted`, "success");
    else if (status === "scheduled") showToast(`"${video?.title || "Video"}" scheduled`, "info");
  };

  const toggleWeekExpanded = (week: number) => {
    const next = new Set(expandedWeeks);
    if (next.has(week)) next.delete(week);
    else next.add(week);
    setExpandedWeeks(next);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "posted":
        return { bg: "#E6F4EA", text: "#1E7E34", border: "#A3D9A5" };
      case "scheduled":
        return { bg: "#E8F0FE", text: "#1A73E8", border: "#A8C7FA" };
      default:
        return { bg: "#F7F7F5", text: "#6B6B6B", border: "#E3E3E0" };
    }
  };

  const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube"];

  const platformColor = (platform: string) => {
    switch (platform) {
      case "Instagram": return "#E1306C";
      case "TikTok": return "#010101";
      case "Facebook": return "#1877F2";
      case "YouTube": return "#FF0000";
      default: return "#6B6B6B";
    }
  };

  const handleVideoUpdate = (videoId: string, field: string, value: any) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, [field]: value } : v))
    );
    updateVideoField(videoId, field, value);
  };

  return (
    <div
      style={{
        padding: "0 40px 60px",
        background: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <PageHeader
          title="Content Publishing"
          subtitle="Guido's board: Production → Distribution"
        />

        {/* Stats Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div style={{ background: "#F7F7F5", padding: 20, borderRadius: 8 }}>
            <Stat
              label="Total in Queue"
              value={stats.totalInQueue}
              sub="approved videos"
            />
          </div>
          <div style={{ background: "#F7F7F5", padding: 20, borderRadius: 8 }}>
            <Stat
              label="Captions Done"
              value={stats.captionsDone}
              sub={`of ${stats.totalInQueue}`}
            />
          </div>
          <div style={{ background: "#F7F7F5", padding: 20, borderRadius: 8 }}>
            <Stat
              label="Thumbnails Done"
              value={stats.thumbnailsDone}
              sub={`of ${stats.totalInQueue}`}
            />
          </div>
          <div style={{ background: "#F7F7F5", padding: 20, borderRadius: 8 }}>
            <Stat
              label="Scheduled"
              value={stats.scheduled}
              sub="ready to post"
            />
          </div>
          <div style={{ background: "#F7F7F5", padding: 20, borderRadius: 8 }}>
            <Stat
              label="Posted This Week"
              value={stats.postedThisWeek}
              sub="live content"
            />
          </div>
        </div>

        {/* Week Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3, 4].map((week) => {
            const weekVideos = groupedByWeek[week] || [];
            const isExpanded = expandedWeeks.has(week);
            const weekPosted = weekVideos.filter(
              (v) => v.postingStatus === "posted"
            ).length;

            return (
              <div
                key={week}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E3E3E0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {/* Week Header */}
                <div
                  onClick={() => toggleWeekExpanded(week)}
                  style={{
                    padding: "16px 24px",
                    cursor: "pointer",
                    backgroundColor: "#F7F7F5",
                    borderBottom: isExpanded ? "1px solid #E3E3E0" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#1A1A1A",
                      }}
                    >
                      Week {week}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#9B9B9B",
                        fontWeight: 500,
                      }}
                    >
                      {weekVideos.length} video
                      {weekVideos.length !== 1 ? "s" : ""}
                    </span>
                    {weekPosted > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#1E7E34",
                          background: "#E6F4EA",
                          padding: "2px 8px",
                          borderRadius: 10,
                        }}
                      >
                        {weekPosted} posted
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 18,
                      color: "#6B6B6B",
                      transition: "transform 0.2s",
                      transform: isExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* Table Content */}
                {isExpanded && (
                  <div style={{ overflowX: "auto" }}>
                    {weekVideos.length === 0 ? (
                      <div
                        style={{
                          padding: 32,
                          textAlign: "center",
                          color: "#9B9B9B",
                          fontSize: 13,
                        }}
                      >
                        No videos scheduled for this week.
                      </div>
                    ) : (
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 13,
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              borderBottom: "1px solid #E3E3E0",
                              textAlign: "left",
                            }}
                          >
                            {[
                              "Video",
                              "Platform",
                              "Editor",
                              "Caption",
                              "Thumbnail",
                              "Scheduled Date",
                              "Status",
                              "Notes",
                            ].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: "10px 16px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#9B9B9B",
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {weekVideos.map((video) => {
                            const isPosted =
                              video.postingStatus === "posted";
                            const sc = statusColor(video.postingStatus);
                            return (
                              <React.Fragment key={video.id}>
                              <tr
                                onClick={() => setExpandedRowId(expandedRowId === video.id ? null : video.id)}
                                style={{
                                  borderBottom: "1px solid #F0F0EE",
                                  backgroundColor: isPosted
                                    ? "#F6FBF7"
                                    : expandedRowId === video.id ? "#F0F0EE" : "transparent",
                                  transition: "background-color 0.15s",
                                  cursor: "pointer",
                                }}
                              >
                                {/* Video Title + Client */}
                                <td
                                  style={{
                                    padding: "14px 16px",
                                    minWidth: 180,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#1A1A1A",
                                      fontSize: 13,
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {video.title || "Untitled Video"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "#9B9B9B",
                                      marginTop: 2,
                                    }}
                                  >
                                    {getClientName(video.clientId)}
                                  </div>
                                </td>

                                {/* Platform Multi-Select Pills */}
                                <td style={{ padding: "14px 16px" }}>
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {PLATFORMS.map(p => {
                                      const isActive = (video.platform || "").split(",").map(s => s.trim()).includes(p);
                                      return (
                                        <button
                                          key={p}
                                          onClick={() => {
                                            const current = (video.platform || "").split(",").map(s => s.trim()).filter(Boolean);
                                            const updated = isActive ? current.filter(x => x !== p) : [...current, p];
                                            handleVideoUpdate(video.id, "platform", updated.join(", "));
                                            logActivity({ user: userName || "Unknown", action: "updated", entity: "video", entityName: video.title || "Untitled", details: `${isActive ? "Removed" : "Added"} platform ${p}` });
                                          }}
                                          style={{
                                            padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 500,
                                            border: isActive ? "none" : "1px solid #E3E3E0",
                                            background: isActive ? platformColor(p) + "18" : "transparent",
                                            color: isActive ? platformColor(p) : "#9B9B9B",
                                            cursor: "pointer", fontFamily: "inherit",
                                          }}
                                        >
                                          {p}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>

                                {/* Editor */}
                                <td style={{ padding: "14px 16px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <Avatar
                                      initials={getEditorInitials(
                                        video.editorId
                                      )}
                                      size={22}
                                    />
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "#6B6B6B",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {getEditorName(video.editorId)}
                                    </span>
                                  </div>
                                </td>

                                {/* Caption Toggle */}
                                <td style={{ padding: "14px 16px" }}>
                                  <button
                                    onClick={() => toggleCaption(video.id)}
                                    style={{
                                      padding: "4px 14px",
                                      borderRadius: 20,
                                      fontSize: 12,
                                      fontWeight: 500,
                                      border: "none",
                                      background: video.captionWritten ? "#EAF5F2" : "#F7F7F5",
                                      color: video.captionWritten ? "#4DAB9A" : "#9B9B9B",
                                      cursor: "pointer",
                                      fontFamily: "inherit",
                                      whiteSpace: "nowrap" as const,
                                    }}
                                  >
                                    {video.captionWritten ? "\u2713 Done" : "Pending"}
                                  </button>
                                </td>

                                {/* Thumbnail Toggle */}
                                <td style={{ padding: "14px 16px" }}>
                                  <button
                                    onClick={() => toggleThumbnail(video.id)}
                                    style={{
                                      padding: "4px 14px",
                                      borderRadius: 20,
                                      fontSize: 12,
                                      fontWeight: 500,
                                      border: "none",
                                      background: video.thumbnailDone ? "#EAF5F2" : "#F7F7F5",
                                      color: video.thumbnailDone ? "#4DAB9A" : "#9B9B9B",
                                      cursor: "pointer",
                                      fontFamily: "inherit",
                                      whiteSpace: "nowrap" as const,
                                    }}
                                  >
                                    {video.thumbnailDone ? "\u2713 Done" : "Pending"}
                                  </button>
                                </td>

                                {/* Scheduled Date */}
                                <td style={{ padding: "14px 16px" }}>
                                  <input
                                    type="date"
                                    value={video.scheduledDate || ""}
                                    onChange={(e) =>
                                      setScheduledDate(
                                        video.id,
                                        e.target.value
                                      )
                                    }
                                    style={{
                                      padding: "5px 8px",
                                      fontSize: 12,
                                      border: "1px solid #E3E3E0",
                                      borderRadius: 6,
                                      fontFamily: "inherit",
                                      color: "#1A1A1A",
                                      background: "#FFFFFF",
                                      outline: "none",
                                      minWidth: 130,
                                    }}
                                  />
                                </td>

                                {/* Posting Status */}
                                <td style={{ padding: "14px 16px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <select
                                      value={video.postingStatus}
                                      onChange={(e) =>
                                        setPostingStatus(
                                          video.id,
                                          e.target.value as
                                            | "pending"
                                            | "scheduled"
                                            | "posted"
                                        )
                                      }
                                      style={{
                                        padding: "5px 8px",
                                        fontSize: 12,
                                        border: `1px solid ${sc.border}`,
                                        borderRadius: 6,
                                        fontFamily: "inherit",
                                        color: sc.text,
                                        backgroundColor: sc.bg,
                                        outline: "none",
                                        cursor: "pointer",
                                        fontWeight: 500,
                                      }}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="scheduled">
                                        Scheduled
                                      </option>
                                      <option value="posted">Posted</option>
                                    </select>
                                    {isPosted && (
                                      <span
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 700,
                                          color: "#1E7E34",
                                          backgroundColor: "#E6F4EA",
                                          padding: "3px 8px",
                                          borderRadius: 10,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        Posted
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Notes */}
                                <td style={{ padding: "14px 16px", minWidth: 140 }}>
                                  {(video.notes || []).length > 0 ? (
                                    <span
                                      onClick={(e) => { e.stopPropagation(); setNoteModalVideoId(video.id); }}
                                      style={{
                                        fontSize: 12, fontWeight: 600, color: "#4DAB9A",
                                        cursor: "pointer", padding: "3px 10px", borderRadius: 12,
                                        background: "#EAF5F2", whiteSpace: "nowrap",
                                      }}
                                    >
                                      {video.notes.length} note{video.notes.length !== 1 ? "s" : ""}
                                    </span>
                                  ) : (
                                    <span
                                      onClick={(e) => { e.stopPropagation(); setNoteModalVideoId(video.id); }}
                                      style={{
                                        fontSize: 12, color: "#9B9B9B", cursor: "pointer",
                                        fontWeight: 500,
                                      }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#4DAB9A"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9B9B9B"; }}
                                    >
                                      + Add note
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {/* Expandable History Row */}
                              {expandedRowId === video.id && (
                                <tr>
                                  <td colSpan={8} style={{ padding: 0 }}>
                                    <div style={{
                                      background: "#F7F7F5", padding: "16px 24px",
                                      borderTop: "1px solid #E3E3E0",
                                    }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>History</div>
                                      {(video.notes || []).length === 0 ? (
                                        <div style={{ fontSize: 12, color: "#9B9B9B", padding: "8px 0" }}>No history entries yet.</div>
                                      ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                          {video.notes.map((n, i) => {
                                            const actionColor = n.from === "Publishing" ? "#4DAB9A" : n.from === "publishing" ? "#4DAB9A" : "#1A73E8";
                                            return (
                                              <div key={i} style={{
                                                padding: "8px 12px", background: "#FFFFFF",
                                                borderRadius: 6, borderLeft: `3px solid ${actionColor}`,
                                                fontSize: 12,
                                              }}>
                                                <span style={{ color: "#9B9B9B", fontSize: 11 }}>
                                                  {new Date(n.date).toLocaleDateString()} — {n.from}
                                                </span>
                                                <div style={{ color: "#1A1A1A", marginTop: 2 }}>{n.text}</div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
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
                    <button onClick={() => { if (!noteText.trim()) return; const vid = videos.find(v => v.id === noteModalVideoId); const newNotes = [...(vid?.notes || []), { from: userName || "Publishing", date: new Date().toISOString(), text: noteText.trim() }]; setVideos(prev => prev.map(v => v.id === noteModalVideoId ? { ...v, notes: newNotes } : v)); if (vid) upsertVideo({ ...vid, notes: newNotes }); logActivity({ user: userName || "Unknown", action: "updated", entity: "video", entityName: vid?.title || "Untitled", details: "Added publishing note" }); setNoteText(""); }} style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: "#1A1A1A", color: "#FFF", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Save Note</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
