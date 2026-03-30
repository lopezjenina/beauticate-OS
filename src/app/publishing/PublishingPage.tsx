"use client";

import React, { useMemo, useState } from "react";
import { Video } from "@/lib/types";
import { TEAM, INIT_CLIENTS } from "@/lib/store";
import { PageHeader, Badge, Btn, Avatar, Stat } from "@/components/ui";

interface Props {
  videos: Video[];
  setVideos: (fn: (prev: Video[]) => Video[]) => void;
}

export default function PublishingPage({ videos, setVideos }: Props) {
  const today = new Date("2026-03-30");
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    new Set([1, 2, 3, 4])
  );

  const publishingVideos = videos.filter(
    (v) => v.editingStatus === "approved" && v.sentToGuido === true
  );

  const getClientName = (clientId: string) =>
    INIT_CLIENTS.find((c) => c.id === clientId)?.name || "Unknown";

  const getEditorName = (editorId: string) =>
    TEAM.find((t) => t.id === editorId)?.name || "Unknown";

  const getEditorInitials = (editorId: string) =>
    TEAM.find((t) => t.id === editorId)?.initials || "?";

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
    if (video) updateVideo(videoId, { captionWritten: !video.captionWritten });
  };

  const toggleThumbnail = (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) updateVideo(videoId, { thumbnailDone: !video.thumbnailDone });
  };

  const setScheduledDate = (videoId: string, dateStr: string) => {
    updateVideo(videoId, { scheduledDate: dateStr });
  };

  const setPostingStatus = (
    videoId: string,
    status: "pending" | "scheduled" | "posted"
  ) => {
    updateVideo(videoId, { postingStatus: status });
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

  const platformLabel = (platform: string) => {
    const map: Record<string, { label: string; color: string }> = {
      instagram: { label: "IG", color: "#E1306C" },
      youtube: { label: "YT", color: "#FF0000" },
      tiktok: { label: "TT", color: "#010101" },
      facebook: { label: "FB", color: "#1877F2" },
      linkedin: { label: "LI", color: "#0A66C2" },
    };
    const key = platform.toLowerCase();
    return map[key] || { label: platform.slice(0, 2).toUpperCase(), color: "#6B6B6B" };
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
                            const pl = platformLabel(video.platform);

                            return (
                              <tr
                                key={video.id}
                                style={{
                                  borderBottom: "1px solid #F0F0EE",
                                  backgroundColor: isPosted
                                    ? "#F6FBF7"
                                    : "transparent",
                                  transition: "background-color 0.15s",
                                }}
                              >
                                {/* Video Title + Client */}
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    minWidth: 180,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 500,
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

                                {/* Platform Badge */}
                                <td style={{ padding: "12px 16px" }}>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: "#FFFFFF",
                                      backgroundColor: pl.color,
                                      padding: "3px 8px",
                                      borderRadius: 4,
                                      letterSpacing: "0.04em",
                                    }}
                                  >
                                    {pl.label}
                                  </span>
                                </td>

                                {/* Editor */}
                                <td style={{ padding: "12px 16px" }}>
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
                                <td style={{ padding: "12px 16px" }}>
                                  <button
                                    onClick={() => toggleCaption(video.id)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "4px 10px",
                                      borderRadius: 12,
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      fontFamily: "inherit",
                                      backgroundColor: video.captionWritten
                                        ? "#E6F4EA"
                                        : "#F0F0EE",
                                      color: video.captionWritten
                                        ? "#1E7E34"
                                        : "#9B9B9B",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    {video.captionWritten ? "✓ Done" : "Pending"}
                                  </button>
                                </td>

                                {/* Thumbnail Toggle */}
                                <td style={{ padding: "12px 16px" }}>
                                  <button
                                    onClick={() => toggleThumbnail(video.id)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "4px 10px",
                                      borderRadius: 12,
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      fontFamily: "inherit",
                                      backgroundColor: video.thumbnailDone
                                        ? "#E6F4EA"
                                        : "#F0F0EE",
                                      color: video.thumbnailDone
                                        ? "#1E7E34"
                                        : "#9B9B9B",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    {video.thumbnailDone ? "✓ Done" : "Pending"}
                                  </button>
                                </td>

                                {/* Scheduled Date */}
                                <td style={{ padding: "12px 16px" }}>
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
                                <td style={{ padding: "12px 16px" }}>
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
                              </tr>
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
      </div>
    </div>
  );
}
