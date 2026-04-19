"use client";

import React, { useState, useMemo } from "react";
import { Video, Note, Client } from "@/lib/types";
import { AppUser } from "@/lib/auth";
import { PageHeader, Badge, Avatar, EmptyState, Stat, showToast } from "@/components/ui";

interface Props {
  videos: Video[];
  setVideos: (fn: (prev: Video[]) => Video[]) => void;
  userName: string;
  clients?: Client[];
  users?: AppUser[];
}

export default function ApprovalsPage({ videos, setVideos, userName, clients = [], users = [] }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "delivered" | "revision">("all");

  const reviewableVideos = useMemo(() => {
    const base = videos.filter(
      (v) => v.editingStatus === "delivered" || v.editingStatus === "revision"
    );
    if (filter === "all") return base;
    return base.filter(v => v.editingStatus === filter);
  }, [videos, filter]);

  const deliveredCount = videos.filter(v => v.editingStatus === "delivered").length;
  const revisionCount = videos.filter(v => v.editingStatus === "revision").length;

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || "Unknown";

  const getEditorName = (editorId: string) =>
    users.find((u) => u.id === editorId)?.username || "Unknown";

  const getEditorInitials = (editorId: string) => {
    const name = users.find((u) => u.id === editorId)?.username || "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleApprove = (videoId: string) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const newNote: Note = { from: userName, date: dateStr, text: "Approved", action: "approve" };
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, editingStatus: "approved" as const, sentToGuido: true, notes: [...(v.notes || []), newNote] }
          : v
      )
    );
    const video = videos.find(v => v.id === videoId);
    showToast(`"${video?.title || "Video"}" approved`, "success");
    setExpandedId(null);
  };

  const handleRequestRevision = (videoId: string) => {
    if (!revisionText.trim()) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const newNote: Note = { from: userName, date: dateStr, text: revisionText, action: "revision" };
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, editingStatus: "revision" as const, notes: [...(v.notes || []), newNote] }
          : v
      )
    );
    const video = videos.find(v => v.id === videoId);
    showToast(`Revision requested for "${video?.title || "Video"}"`, "info");
    setRevisionText("");
    setShowRevisionInput(null);
  };

  const handleCancelRevision = (videoId: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, editingStatus: "delivered" as const } : v
      )
    );
  };

  const toggleExpand = (videoId: string) => {
    if (expandedId === videoId) {
      setExpandedId(null);
      setShowRevisionInput(null);
      setRevisionText("");
    } else {
      setExpandedId(videoId);
      setShowRevisionInput(null);
      setRevisionText("");
    }
  };

  const platformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("tiktok")) return { bg: "#F0E6F6", color: "#7B2D8E" };
    if (p.includes("youtube")) return { bg: "#FDECEA", color: "#CC0000" };
    if (p.includes("instagram") || p.includes("reels")) return { bg: "#FCE4EC", color: "#C2185B" };
    return { bg: "#E8F0FE", color: "#1A73E8" };
  };

  return (
    <div style={{ padding: "0 40px 60px", background: "#FFFFFF", minHeight: "100vh" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <PageHeader title="Internal Approvals" subtitle="Review delivered videos before publishing" />

        {/* Stats + Filter Bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, alignItems: "stretch" }}>
          <div style={{
            flex: 1, background: "#F7F7F5", borderRadius: 10, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#E8F0FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>{deliveredCount}</div>
              <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 500 }}>Awaiting Review</div>
            </div>
          </div>
          <div style={{
            flex: 1, background: "#F7F7F5", borderRadius: 10, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: revisionCount > 0 ? "#FDF3E7" : "#EAF5F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: revisionCount > 0 ? "#CB7F2C" : "#1A1A1A" }}>{revisionCount}</div>
              <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 500 }}>In Revision</div>
            </div>
          </div>
          <div style={{
            flex: 1, background: "#F7F7F5", borderRadius: 10, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EAF5F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#4DAB9A" }}>{deliveredCount + revisionCount}</div>
              <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 500 }}>Total Queue</div>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {([
            { label: `All (${deliveredCount + revisionCount})`, value: "all" },
            { label: `Delivered (${deliveredCount})`, value: "delivered" },
            { label: `Revision (${revisionCount})`, value: "revision" },
          ] as const).map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: `1px solid ${filter === f.value ? "#1A1A1A" : "#E3E3E0"}`,
                background: filter === f.value ? "#1A1A1A" : "#FFF",
                color: filter === f.value ? "#FFF" : "#6B6B6B",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {reviewableVideos.length === 0 ? (
          <EmptyState title="No items pending approval" subtitle="Videos marked as Delivered in Production will appear here for review." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviewableVideos.map((video) => {
              const isExpanded = expandedId === video.id;
              const isRevision = video.editingStatus === "revision";
              const pColor = platformColor(video.platform);
              const revisionNotes = (video.notes || []).filter(n => n.action === "revision");
              const isOverdue = video.dueDate < new Date().toISOString().split("T")[0] && !video.posted;

              return (
                <div
                  key={video.id}
                  style={{
                    background: "#FFF",
                    border: `1px solid ${isRevision ? "#F5DEB3" : "#E3E3E0"}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    borderLeft: isRevision ? "3px solid #CB7F2C" : "3px solid transparent",
                  }}
                >
                  {/* Card header */}
                  <div
                    onClick={() => toggleExpand(video.id)}
                    style={{
                      padding: "14px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FAFAF9"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#FFF"; }}
                  >
                    {/* Title + Client */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {video.title}
                        </span>
                        {isRevision && revisionNotes.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: "#FDF3E7", color: "#CB7F2C", padding: "1px 6px", borderRadius: 8 }}>
                            Rev {revisionNotes.length}
                          </span>
                        )}
                        {isOverdue && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: "#FDF2F2", color: "#EB5757", padding: "1px 6px", borderRadius: 8 }}>
                            Overdue
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#9B9B9B" }}>
                        {getClientName(video.clientId)} · Week {video.week}
                      </div>
                    </div>

                    {/* Editor */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <Avatar initials={getEditorInitials(video.editorId)} size={24} />
                      <span style={{ fontSize: 12, color: "#6B6B6B" }}>{getEditorName(video.editorId)}</span>
                    </div>

                    {/* Platform badge */}
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 12,
                      background: pColor.bg, color: pColor.color, flexShrink: 0,
                    }}>
                      {video.platform}
                    </span>

                    {/* Status */}
                    <Badge variant={isRevision ? "warning" : "active"}>
                      {isRevision ? "Revision" : "Delivered"}
                    </Badge>

                    {/* Due date */}
                    <span style={{ fontSize: 12, color: isOverdue ? "#EB5757" : "#9B9B9B", flexShrink: 0, minWidth: 60, textAlign: "right", fontWeight: isOverdue ? 600 : 400 }}>
                      {formatDate(video.dueDate)}
                    </span>

                    {/* Quick approve button (no expand needed) */}
                    {!isExpanded && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(video.id); }}
                        style={{
                          padding: "5px 14px", borderRadius: 6, border: "none",
                          background: "#1A1A1A", color: "#FFF", fontSize: 12, fontWeight: 500,
                          cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                        }}
                      >
                        Approve
                      </button>
                    )}

                    {/* Chevron */}
                    <span style={{
                      fontSize: 14, color: "#9B9B9B", flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}>&#9662;</span>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div style={{ background: "#FAFAF9", padding: "20px 24px", borderTop: "1px solid #E3E3E0" }}>
                      {/* Detail chips */}
                      <div style={{ display: "flex", gap: 24, marginBottom: 20, fontSize: 13 }}>
                        <div><span style={{ color: "#9B9B9B" }}>Client </span><span style={{ fontWeight: 500 }}>{getClientName(video.clientId)}</span></div>
                        <div><span style={{ color: "#9B9B9B" }}>Editor </span><span style={{ fontWeight: 500 }}>{getEditorName(video.editorId)}</span></div>
                        <div><span style={{ color: "#9B9B9B" }}>Due </span><span style={{ fontWeight: 500, color: isOverdue ? "#EB5757" : "#1A1A1A" }}>{formatDate(video.dueDate)}</span></div>
                        <div><span style={{ color: "#9B9B9B" }}>Revisions </span><span style={{ fontWeight: 500 }}>{video.revisionsUsed || 0}</span></div>
                      </div>

                      {/* Notes timeline */}
                      {video.notes && video.notes.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                            Review History
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {video.notes.map((note, idx) => (
                              <div key={idx} style={{
                                background: "#FFF", padding: "12px 16px", borderRadius: 8,
                                borderLeft: `3px solid ${note.action === "approve" ? "#4DAB9A" : note.action === "revision" ? "#CB7F2C" : "#E3E3E0"}`,
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{note.from}</span>
                                    <span style={{ fontSize: 11, color: "#9B9B9B" }}>{formatDate(note.date)}</span>
                                  </div>
                                  {note.action && (
                                    <Badge variant={note.action === "approve" ? "success" : "warning"}>
                                      {note.action === "approve" ? "Approved" : "Revision"}
                                    </Badge>
                                  )}
                                </div>
                                <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.5 }}>{note.text}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Revision input */}
                      {showRevisionInput === video.id && (
                        <div style={{ marginBottom: 16 }}>
                          <textarea
                            value={revisionText}
                            onChange={(e) => setRevisionText(e.target.value)}
                            placeholder="Describe the changes needed..."
                            autoFocus
                            style={{
                              width: "100%", padding: 14, border: "1px solid #E3E3E0", borderRadius: 8,
                              fontSize: 13, fontFamily: "inherit", color: "#1A1A1A", marginBottom: 10,
                              minHeight: 90, resize: "vertical", background: "#FFF", boxSizing: "border-box",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleRequestRevision(video.id)}
                              disabled={!revisionText.trim()}
                              style={{
                                background: revisionText.trim() ? "#CB7F2C" : "#E3E3E0",
                                color: revisionText.trim() ? "#FFF" : "#9B9B9B",
                                padding: "8px 20px", borderRadius: 6, border: "none",
                                fontSize: 13, fontWeight: 500, cursor: revisionText.trim() ? "pointer" : "not-allowed",
                                fontFamily: "inherit",
                              }}
                            >
                              Submit Revision Request
                            </button>
                            <button
                              onClick={() => { setShowRevisionInput(null); setRevisionText(""); }}
                              style={{
                                background: "transparent", color: "#6B6B6B", padding: "8px 20px",
                                borderRadius: 6, border: "1px solid #E3E3E0", fontSize: 13, cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 10, borderTop: showRevisionInput === video.id ? "none" : "1px solid #E3E3E0", paddingTop: showRevisionInput === video.id ? 0 : 16 }}>
                        <button
                          onClick={() => handleApprove(video.id)}
                          style={{
                            background: "#1A1A1A", color: "#FFF", padding: "9px 24px",
                            borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          Approve Video
                        </button>
                        {showRevisionInput !== video.id && (
                          <button
                            onClick={() => setShowRevisionInput(video.id)}
                            style={{
                              background: "transparent", color: "#CB7F2C", padding: "9px 24px",
                              borderRadius: 8, border: "1px solid #CB7F2C", fontSize: 13, fontWeight: 500,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            Request Revision
                          </button>
                        )}
                        {isRevision && (
                          <button
                            onClick={() => handleCancelRevision(video.id)}
                            style={{
                              background: "transparent", color: "#6B6B6B", padding: "9px 24px",
                              borderRadius: 8, border: "1px solid #E3E3E0", fontSize: 13,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            Cancel Revision
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
