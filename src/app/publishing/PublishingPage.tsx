"use client";

import React, { useMemo } from "react";
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

  const publishingVideos = videos.filter(
    (v) => v.editingStatus === "approved" && v.sentToGuido === true
  );

  const getClientName = (clientId: string) => {
    return INIT_CLIENTS.find((c) => c.id === clientId)?.name || "Unknown";
  };

  const getEditorName = (editorId: string) => {
    return TEAM.find((t) => t.id === editorId)?.name || "Unknown";
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

    const behindSchedule = publishingVideos.filter((v) => {
      if (!v.scheduledDate) return true;
      const schedDate = new Date(v.scheduledDate);
      return schedDate < sevenDaysFromNow;
    }).length;

    return { totalInQueue, scheduled, postedThisWeek, behindSchedule };
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
    }
  };

  const toggleThumbnail = (videoId: string) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      updateVideo(videoId, { thumbnailDone: !video.thumbnailDone });
    }
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

  const getDateWarning = (
    scheduledDate: string | undefined
  ): { type: "danger" | "warning" | null; text: string } => {
    if (!scheduledDate) {
      return { type: "warning", text: "Not scheduled" };
    }
    const schedDate = new Date(scheduledDate);
    if (schedDate < sevenDaysFromNow) {
      return { type: "danger", text: "Within 7 days" };
    }
    return { type: null, text: "" };
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            marginBottom: 48,
          }}
        >
          <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 8 }}>
            <Stat
              label="Total in Queue"
              value={stats.totalInQueue}
              sub="pending approval"
            />
          </div>
          <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 8 }}>
            <Stat
              label="Scheduled"
              value={stats.scheduled}
              sub="ready to post"
            />
          </div>
          <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 8 }}>
            <Stat
              label="Posted This Week"
              value={stats.postedThisWeek}
              sub="live content"
            />
          </div>
          <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 8 }}>
            <Stat
              label="Behind Schedule"
              value={stats.behindSchedule}
              sub="violating 7-day rule"
            />
          </div>
        </div>

        {[1, 2, 3, 4].map((week) => {
          const weekVideos = groupedByWeek[week] || [];
          const weekLabel = `Week ${week} Posts`;

          return (
            <div key={week} style={{ marginBottom: 48 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  marginBottom: 16,
                  letterSpacing: "0.02em",
                }}
              >
                {weekLabel}
              </div>

              {weekVideos.length === 0 ? (
                <div
                  style={{
                    padding: "32px",
                    background: "#F7F7F5",
                    borderRadius: 8,
                    textAlign: "center",
                    color: "#9B9B9B",
                    fontSize: 13,
                  }}
                >
                  No videos scheduled for this week.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 16,
                  }}
                >
                  {weekVideos.map((video) => {
                    const warning = getDateWarning(video.scheduledDate);
                    return (
                      <div
                        key={video.id}
                        style={{
                          background: "#F7F7F5",
                          border: "1px solid #E3E3E0",
                          borderRadius: 8,
                          padding: 20,
                        }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#1A1A1A",
                              marginBottom: 4,
                            }}
                          >
                            {getClientName(video.clientId)}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 12,
                              color: "#6B6B6B",
                              marginBottom: 8,
                            }}
                          >
                            <Avatar
                              initials={
                                TEAM.find((t) => t.id === video.editorId)
                                  ?.initials || "?"
                              }
                              size={20}
                            />
                            {getEditorName(video.editorId)}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#9B9B9B",
                            }}
                          >
                            {video.platform}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          <Badge
                            variant={
                              video.captionWritten ? "success" : "default"
                            }
                          >
                            {video.captionWritten
                              ? "Caption written"
                              : "Caption pending"}
                          </Badge>
                          <Badge
                            variant={video.thumbnailDone ? "success" : "default"}
                          >
                            {video.thumbnailDone
                              ? "Thumbnail done"
                              : "Thumbnail pending"}
                          </Badge>
                          {warning.type && (
                            <Badge variant={warning.type}>
                              {warning.text}
                            </Badge>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: 11,
                                color: "#6B6B6B",
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              Scheduled Date
                            </label>
                            <input
                              type="date"
                              value={video.scheduledDate || ""}
                              onChange={(e) =>
                                setScheduledDate(video.id, e.target.value)
                              }
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: 12,
                                border: "1px solid #E3E3E0",
                                borderRadius: 4,
                                fontFamily: "inherit",
                                color: "#1A1A1A",
                              }}
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                fontSize: 11,
                                color: "#6B6B6B",
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              Posting Status
                            </label>
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
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: 12,
                                border: "1px solid #E3E3E0",
                                borderRadius: 4,
                                fontFamily: "inherit",
                                color: "#1A1A1A",
                                background: "#FFFFFF",
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="posted">Posted</option>
                            </select>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <Btn
                            variant="ghost"
                            onClick={() => toggleCaption(video.id)}
                            style={{
                              width: "100%",
                              justifyContent: "flex-start",
                              padding: "6px 12px",
                            }}
                          >
                            {video.captionWritten
                              ? "✓ Caption written"
                              : "Mark caption written"}
                          </Btn>
                          <Btn
                            variant="ghost"
                            onClick={() => toggleThumbnail(video.id)}
                            style={{
                              width: "100%",
                              justifyContent: "flex-start",
                              padding: "6px 12px",
                            }}
                          >
                            {video.thumbnailDone
                              ? "✓ Thumbnail done"
                              : "Mark thumbnail done"}
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
