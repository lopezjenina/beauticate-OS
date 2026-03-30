"use client";

import React, { useState } from "react";
import { Video, Note } from "@/lib/types";
import { TEAM, INIT_CLIENTS } from "@/lib/store";
import { PageHeader, Badge, Btn, Avatar, EmptyState } from "@/components/ui";

interface Props {
  videos: Video[];
  setVideos: (fn: (prev: Video[]) => Video[]) => void;
  userName: string;
}

export default function ApprovalsPage({ videos, setVideos, userName }: Props) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");

  const pendingVideos = videos.filter((v) => v.editingStatus === "delivered");
  const selectedVideo = selectedVideoId
    ? videos.find((v) => v.id === selectedVideoId)
    : null;

  const getClientName = (clientId: string) => {
    return INIT_CLIENTS.find((c) => c.id === clientId)?.name || "Unknown";
  };

  const getEditorName = (editorId: string) => {
    return TEAM.find((t) => t.id === editorId)?.name || "Unknown";
  };

  const handleApprove = (videoId: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, editingStatus: "approved" as const, sentToGuido: true }
          : v
      )
    );
    setSelectedVideoId(null);
  };

  const handleRequestRevision = (videoId: string) => {
    if (!revisionText.trim()) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;

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
    setSelectedVideoId(null);
  };

  if (selectedVideo) {
    return (
      <div
        style={{
          padding: "0 40px 60px",
          background: "#FFFFFF",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={() => setSelectedVideoId(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-sec)",
                fontSize: 14,
                cursor: "pointer",
                padding: 0,
                marginBottom: 20,
              }}
            >
              ← Back to list
            </button>

            <PageHeader
              title={selectedVideo.title}
              subtitle={`${getClientName(selectedVideo.clientId)} - Week ${selectedVideo.week}`}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 40,
            }}
          >
            <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 16 }}>
                DETAILS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 4 }}>
                    Client
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {getClientName(selectedVideo.clientId)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 4 }}>
                    Editor
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                    }}
                  >
                    <Avatar
                      initials={
                        TEAM.find((t) => t.id === selectedVideo.editorId)
                          ?.initials || "?"
                      }
                      size={28}
                    />
                    {getEditorName(selectedVideo.editorId)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 4 }}>
                    Platform
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {selectedVideo.platform}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 4 }}>
                    Due Date
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {selectedVideo.dueDate}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 16 }}>
                ACTIONS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Btn
                  variant="primary"
                  onClick={() => handleApprove(selectedVideo.id)}
                  style={{ width: "100%" }}
                >
                  Approve
                </Btn>
                <Btn
                  variant="default"
                  onClick={() => {
                    if (
                      revisionText.trim() &&
                      window.confirm(
                        "Are you sure? This will discard your revision text."
                      )
                    ) {
                      setRevisionText("");
                    }
                  }}
                  style={{ width: "100%", color: "#EB5757", borderColor: "#EB5757" }}
                >
                  Cancel Revision
                </Btn>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 16 }}>
              REQUEST REVISION
            </div>
            <textarea
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder="Describe the changes needed..."
              style={{
                width: "100%",
                padding: 16,
                border: "1px solid #E3E3E0",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                color: "#1A1A1A",
                marginBottom: 12,
                minHeight: 120,
                resize: "vertical",
              }}
            />
            <Btn
              variant="default"
              onClick={() => handleRequestRevision(selectedVideo.id)}
              disabled={!revisionText.trim()}
              style={{ color: "#CB7F2C", borderColor: "#CB7F2C" }}
            >
              Submit Revision Request
            </Btn>
          </div>

          {selectedVideo.notes && selectedVideo.notes.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 16 }}>
                NOTES & FEEDBACK
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {selectedVideo.notes.map((note, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#F7F7F5",
                      padding: 16,
                      borderRadius: 8,
                      borderLeft: `3px solid ${
                        note.action === "approve" ? "#4DAB9A" : "#CB7F2C"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#1A1A1A",
                          }}
                        >
                          {note.from}
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}
                        >
                          {note.date}
                        </div>
                      </div>
                      {note.action && (
                        <Badge
                          variant={
                            note.action === "approve" ? "success" : "warning"
                          }
                        >
                          {note.action === "approve"
                            ? "Approved"
                            : "Revision Requested"}
                        </Badge>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: "#1A1A1A", lineHeight: 1.5 }}>
                      {note.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "0 40px 60px",
        background: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <PageHeader
          title="Internal Approvals"
          subtitle="Gate between Editing and Guido Publishing"
        />

        {pendingVideos.length === 0 ? (
          <EmptyState title="No items pending approval. Videos moved to Delivered in the production board will appear here." />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {pendingVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideoId(video.id)}
                style={{
                  padding: 20,
                  background: "#F7F7F5",
                  borderRadius: 8,
                  border: "1px solid #E3E3E0",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#EFEFED";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F7F7F5";
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 20,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 24,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                        {video.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          fontSize: 13,
                          color: "#6B6B6B",
                        }}
                      >
                        <span>{getClientName(video.clientId)}</span>
                        <span>
                          {TEAM.find((t) => t.id === video.editorId)?.name ||
                            "Unknown"}
                        </span>
                        <span>{video.platform}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        style={{ fontSize: 13, color: "#9B9B9B", marginBottom: 8 }}
                      >
                        Due {video.dueDate}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn
                          variant="primary"
                          onClick={(e) => {
                            e?.stopPropagation();
                            handleApprove(video.id);
                          }}
                        >
                          Approve
                        </Btn>
                        <Btn
                          variant="default"
                          onClick={(e) => {
                            e?.stopPropagation();
                            setSelectedVideoId(video.id);
                          }}
                        >
                          Revision
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
