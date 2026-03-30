"use client";

import React, { useState } from "react";
import { Video, Note } from "@/lib/types";
import { TEAM, INIT_CLIENTS } from "@/lib/store";
import { PageHeader, Badge, Avatar, EmptyState } from "@/components/ui";

interface Props {
  videos: Video[];
  setVideos: (fn: (prev: Video[]) => Video[]) => void;
  userName: string;
}

export default function ApprovalsPage({ videos, setVideos, userName }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState<string | null>(null);

  const reviewableVideos = videos.filter(
    (v) => v.editingStatus === "delivered" || v.editingStatus === "revision"
  );

  const getClientName = (clientId: string) => {
    return INIT_CLIENTS.find((c) => c.id === clientId)?.name || "Unknown";
  };

  const getEditorName = (editorId: string) => {
    return TEAM.find((t) => t.id === editorId)?.name || "Unknown";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleApprove = (videoId: string) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const newNote: Note = {
      from: userName,
      date: dateStr,
      text: "Approved",
      action: "approve",
    };

    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              editingStatus: "approved" as const,
              sentToGuido: true,
              notes: [...(v.notes || []), newNote],
            }
          : v
      )
    );
    setExpandedId(null);
  };

  const handleRequestRevision = (videoId: string) => {
    if (!revisionText.trim()) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const newNote: Note = {
      from: userName,
      date: dateStr,
      text: revisionText,
      action: "revision",
    };

    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              editingStatus: "revision" as const,
              notes: [...(v.notes || []), newNote],
            }
          : v
      )
    );
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
    <div
      style={{
        padding: "0 40px 60px",
        background: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <PageHeader
          title="Internal Approvals"
          subtitle="Gate between Editing and Guido Publishing"
        />

        {reviewableVideos.length === 0 ? (
          <EmptyState title="No items pending approval. Videos moved to Delivered in the production board will appear here." />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {reviewableVideos.map((video) => {
              const isExpanded = expandedId === video.id;
              const isRevision = video.editingStatus === "revision";
              const pColor = platformColor(video.platform);

              return (
                <div
                  key={video.id}
                  style={{
                    background: "#FFF",
                    border: "1px solid #E3E3E0",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {/* Card row */}
                  <div
                    onClick={() => toggleExpand(video.id)}
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FAFAF9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FFF";
                    }}
                  >
                    {/* Title + Client */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1A1A1A",
                          marginBottom: 4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {video.title}
                      </div>
                      <div style={{ fontSize: 13, color: "#6B6B6B" }}>
                        {getClientName(video.clientId)}
                      </div>
                    </div>

                    {/* Editor */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#6B6B6B",
                        flexShrink: 0,
                      }}
                    >
                      <Avatar
                        initials={
                          TEAM.find((t) => t.id === video.editorId)?.initials || "?"
                        }
                        size={24}
                      />
                      {getEditorName(video.editorId)}
                    </div>

                    {/* Platform badge */}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        padding: "4px 10px",
                        borderRadius: 4,
                        background: pColor.bg,
                        color: pColor.color,
                        flexShrink: 0,
                      }}
                    >
                      {video.platform}
                    </div>

                    {/* Status badge for revision */}
                    {isRevision && (
                      <Badge variant="warning">Revision</Badge>
                    )}

                    {/* Due date */}
                    <div
                      style={{
                        fontSize: 13,
                        color: "#9B9B9B",
                        flexShrink: 0,
                        minWidth: 80,
                        textAlign: "right",
                      }}
                    >
                      Due {video.dueDate}
                    </div>

                    {/* Expand indicator */}
                    <div
                      style={{
                        fontSize: 14,
                        color: "#9B9B9B",
                        flexShrink: 0,
                        transition: "transform 0.2s",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      &#9662;
                    </div>
                  </div>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div
                      style={{
                        background: "#F7F7F5",
                        padding: 24,
                        borderTop: "1px solid #E3E3E0",
                      }}
                    >
                      {/* Details row */}
                      <div
                        style={{
                          display: "flex",
                          gap: 32,
                          marginBottom: 24,
                          fontSize: 13,
                          color: "#6B6B6B",
                        }}
                      >
                        <div>
                          <span style={{ color: "#9B9B9B" }}>Client: </span>
                          <span style={{ color: "#1A1A1A", fontWeight: 500 }}>
                            {getClientName(video.clientId)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#9B9B9B" }}>Editor: </span>
                          <span style={{ color: "#1A1A1A", fontWeight: 500 }}>
                            {getEditorName(video.editorId)}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#9B9B9B" }}>Week: </span>
                          <span style={{ color: "#1A1A1A", fontWeight: 500 }}>
                            {video.week}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#9B9B9B" }}>Status: </span>
                          <span style={{ color: "#1A1A1A", fontWeight: 500 }}>
                            {video.editingStatus}
                          </span>
                        </div>
                      </div>

                      {/* Notes history */}
                      {video.notes && video.notes.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#9B9B9B",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: 12,
                            }}
                          >
                            Notes History
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                            }}
                          >
                            {video.notes.map((note, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: "#FFF",
                                  padding: 14,
                                  borderRadius: 6,
                                  borderLeft: `3px solid ${
                                    note.action === "approve"
                                      ? "#4DAB9A"
                                      : note.action === "revision"
                                      ? "#CB7F2C"
                                      : "#E3E3E0"
                                  }`,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 6,
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: "#1A1A1A",
                                      }}
                                    >
                                      {note.from}
                                    </span>
                                    <span style={{ fontSize: 12, color: "#9B9B9B" }}>
                                      {formatDate(note.date)}
                                    </span>
                                  </div>
                                  {note.action && (
                                    <Badge
                                      variant={
                                        note.action === "approve"
                                          ? "success"
                                          : "warning"
                                      }
                                    >
                                      {note.action === "approve"
                                        ? "Approved"
                                        : "Revision Requested"}
                                    </Badge>
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#1A1A1A",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {note.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Revision text input */}
                      {showRevisionInput === video.id && (
                        <div style={{ marginBottom: 20 }}>
                          <textarea
                            value={revisionText}
                            onChange={(e) => setRevisionText(e.target.value)}
                            placeholder="Describe the changes needed..."
                            style={{
                              width: "100%",
                              padding: 14,
                              border: "1px solid #E3E3E0",
                              borderRadius: 6,
                              fontSize: 14,
                              fontFamily: "inherit",
                              color: "#1A1A1A",
                              marginBottom: 10,
                              minHeight: 100,
                              resize: "vertical",
                              background: "#FFF",
                              boxSizing: "border-box",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleRequestRevision(video.id)}
                              disabled={!revisionText.trim()}
                              style={{
                                background: revisionText.trim() ? "#EB5757" : "#E3E3E0",
                                color: revisionText.trim() ? "#FFF" : "#9B9B9B",
                                padding: "10px 24px",
                                borderRadius: 6,
                                border: "none",
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: revisionText.trim() ? "pointer" : "not-allowed",
                              }}
                            >
                              Submit Revision Request
                            </button>
                            <button
                              onClick={() => {
                                setShowRevisionInput(null);
                                setRevisionText("");
                              }}
                              style={{
                                background: "transparent",
                                color: "#6B6B6B",
                                padding: "10px 24px",
                                borderRadius: 6,
                                border: "1px solid #E3E3E0",
                                fontSize: 14,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => handleApprove(video.id)}
                          style={{
                            background: "#1A1A1A",
                            color: "#FFF",
                            padding: "10px 24px",
                            borderRadius: 6,
                            border: "none",
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>

                        {showRevisionInput !== video.id && (
                          <button
                            onClick={() => setShowRevisionInput(video.id)}
                            style={{
                              background: "transparent",
                              color: "#EB5757",
                              padding: "10px 24px",
                              borderRadius: 6,
                              border: "1px solid #EB5757",
                              fontSize: 14,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Request Revision
                          </button>
                        )}

                        {isRevision && (
                          <button
                            onClick={() => handleCancelRevision(video.id)}
                            style={{
                              background: "transparent",
                              color: "#6B6B6B",
                              padding: "10px 24px",
                              borderRadius: 6,
                              border: "1px solid #E3E3E0",
                              fontSize: 14,
                              cursor: "pointer",
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
