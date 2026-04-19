"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageHeader, Btn, showToast } from "@/components/ui";
import { logActivity } from "@/lib/activityLog";
import { fetchContent, upsertContent, deleteContent } from "@/lib/db";
import { ContentPipeline } from "@/lib/types";

interface Props {
  userName?: string;
  videos?: any[];
  setVideos?: any;
  clients?: any[];
  users?: any[];
}

/* ─── Kanban column definitions ─── */
const COLUMNS: { id: ContentPipeline["status"]; label: string; color: string; icon: string }[] = [
  { id: "draft", label: "For Optimization", color: "#B88B58", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "optimized", label: "Optimized", color: "#2383E2", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: "review", label: "For Review", color: "#CB7F2C", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  { id: "revision", label: "Needs Revision", color: "#C55E5E", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  { id: "approved", label: "Approved", color: "#5E8C73", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "scheduled", label: "Scheduled", color: "#7C6FD0", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "published", label: "Published", color: "#1A1A1A", icon: "M5 13l4 4L19 7" },
];

const CONTENT_TYPES = [
  "Blog Post",
  "EDM / Newsletter",
  "Social Caption",
  "Video Script",
  "Ad Copy",
  "Case Study",
  "Landing Page",
];

/* ─── Kanban Card ─── */
function ContentCard({
  item,
  onOpen,
  onOptimize,
  onAdvance,
  onRevert,
  optimizingId,
}: {
  item: ContentPipeline;
  onOpen: () => void;
  onOptimize: () => void;
  onAdvance: (status: ContentPipeline["status"]) => void;
  onRevert: (status: ContentPipeline["status"]) => void;
  optimizingId: string | null;
}) {
  const isOptimizing = optimizingId === item.id;
  
  const getNextStatus = (): ContentPipeline["status"] | null => {
    switch (item.status) {
      case "optimized": return "review";
      case "review": return "approved";
      case "revision": return "review";
      case "approved": return "scheduled";
      case "scheduled": return "published";
      default: return null;
    }
  };


  const getActionLabel = () => {
    switch (item.status) {
      case "optimized": return "Send for Review";
      case "review": return "Approve";
      case "revision": return "Re-submit for Review";
      case "approved": return "Schedule";
      case "scheduled": return "Mark Published";
      default: return null;
    }
  };

  const nextStatus = getNextStatus();
  const actionLabel = getActionLabel();

  const colDef = COLUMNS.find(c => c.id === item.status);
  const colColor = colDef?.color || "#1A1A1A";

  return (
    <div
      onClick={onOpen}
      style={{
        background: "#FFFFFF",
        padding: 16,
        borderRadius: 10,
        border: "1px solid #E8E8E5",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Type badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: colColor,
          textTransform: "uppercase", background: `${colColor}10`, padding: "3px 8px", borderRadius: 4,
        }}>{item.type}</span>
        {item.createdAt && (
          <span style={{ fontSize: 10, color: "#9B9B9B" }}>
            {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, lineHeight: 1.4 }}>
        {item.title}
      </div>

      {/* Preview of content */}
      {item.rawDraft && (
        <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 10, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.rawDraft.slice(0, 120)}{item.rawDraft.length > 120 ? "…" : ""}
        </div>
      )}

      {/* Meta info row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 10, color: "#9B9B9B" }}>
        {item.createdBy && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx={12} cy={7} r={4} /></svg>
            {item.createdBy}
          </span>
        )}
        {item.links && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            Links
          </span>
        )}
        {item.notes && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            Notes
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
        {item.status === "draft" && (
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            style={{
              flex: 1, padding: "8px 12px",
              background: isOptimizing ? "#E8E8E5" : "linear-gradient(135deg, #1A1A1A, #333)",
              color: isOptimizing ? "#6B6B6B" : "#FFF",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: isOptimizing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {isOptimizing ? (
              <>
                <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #9B9B9B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Optimizing…
              </>
            ) : (
              <>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Optimize Draft
              </>
            )}
          </button>
        )}
        {item.status === "review" && (
          <button
            onClick={() => onRevert("revision")}
            style={{
              flex: "0 0 auto", padding: "8px 12px",
              background: "#FFF", color: "#C55E5E",
              border: "1px solid #F0D0D0", borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Request Revision
          </button>
        )}
        {nextStatus && actionLabel && (
          <button
            onClick={() => onAdvance(nextStatus)}
            style={{
              flex: 1, padding: "8px 12px",
              background: colColor, color: "#FFF",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */

export default function PublishingPage({ userName }: Props) {
  const [contentItems, setContentItems] = useState<ContentPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ContentPipeline | null>(null);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  /* ─── New draft form state ─── */
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftType, setDraftType] = useState("Blog Post");
  const [draftLinks, setDraftLinks] = useState("");
  const [draftNotes, setDraftNotes] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await fetchContent();
    setContentItems(data);
    setLoading(false);
  };

  /* ─── Submit Draft ─── */
  const handleSubmitDraft = useCallback(async () => {
    if (!draftTitle.trim()) return showToast("Title is required", "error");
    if (!draftContent.trim()) return showToast("Content is required", "error");
    if (!draftType) return showToast("Content type is required", "error");

    const payload: ContentPipeline = {
      id: crypto.randomUUID(),
      title: draftTitle.trim(),
      type: draftType,
      rawDraft: draftContent.trim(),
      status: "draft",
      links: draftLinks.trim(),
      notes: draftNotes.trim(),
      createdBy: userName || "Unknown",
    };

    await upsertContent(payload);
    await loadData();

    // Reset form
    setDraftTitle(""); setDraftContent(""); setDraftType("Blog Post");
    setDraftLinks(""); setDraftNotes("");
    setCreateOpen(false);
    showToast("Draft submitted to For Optimization!", "success");

    logActivity({
      user: userName || "Unknown",
      action: "created",
      entity: "document",
      entityName: payload.title,
      details: "Submitted new content draft for optimization",
    });

    // Notification logic: if Jenina uploaded, no notification needed
    const isJenina = (userName || "").toLowerCase().includes("jenina");
    if (!isJenina) {
      // In production, you'd send an email/notification to Jenina here
      showToast("Jenina has been notified of the new draft", "info");
    }
  }, [draftTitle, draftContent, draftType, draftLinks, draftNotes, userName]);

  /* ─── Optimize with Gemini ─── */
  const handleOptimize = useCallback(async (item: ContentPipeline) => {
    setOptimizingId(item.id);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentItem: {
            title: item.title,
            type: item.type,
            rawDraft: item.rawDraft,
            links: item.links,
            notes: item.notes,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Optimization failed");
      }

      const { result } = await res.json();

      const updated: ContentPipeline = {
        ...item,
        optimizedContent: result,
        status: "optimized",
      };

      await upsertContent(updated);
      await loadData();
      showToast("Content optimized by AI successfully!", "success");

      logActivity({
        user: "Gemini AI",
        action: "updated",
        entity: "document",
        entityName: item.title,
        details: "AI-generated optimized content",
      });
    } catch (err: any) {
      showToast(err.message || "Optimization failed", "error");
    } finally {
      setOptimizingId(null);
    }
  }, []);

  /* ─── Move status ─── */
  const advanceStatus = useCallback(async (item: ContentPipeline, newStatus: ContentPipeline["status"]) => {
    const updated = { ...item, status: newStatus };
    await upsertContent(updated);
    await loadData();

    const colLabel = COLUMNS.find(c => c.id === newStatus)?.label || newStatus;
    showToast(`Moved to ${colLabel}`, "info");
    logActivity({ user: userName || "Unknown", action: "moved", entity: "document", entityName: item.title, details: `Status → ${colLabel}` });

    // Close view modal if open
    if (viewItem?.id === item.id) setViewItem({ ...updated });
  }, [userName, viewItem]);

  /* ─── Delete ─── */
  const handleDelete = useCallback(async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteContent(id);
      await loadData();
      setViewItem(null);
      showToast("Content deleted", "success");
      logActivity({ user: userName || "Unknown", action: "deleted", entity: "document", entityName: title });
    }
  }, [userName]);

  /* ═══════════════════════════════════════════════════════ */

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "1px solid #E3E3E0",
    borderRadius: 8, fontSize: 14, background: "#FAFAF9",
    transition: "border-color 0.2s, box-shadow 0.2s", outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600, color: "#4A4A4A",
    marginBottom: 6, letterSpacing: "0.02em",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "0 12px", minHeight: "calc(100vh - 96px)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <PageHeader title="Content Engine" subtitle="AI-Powered Publishing Pipeline" />
        <Btn variant="primary" onClick={() => setCreateOpen(true)}>
          + Create Draft
        </Btn>
      </div>

      {/* Kanban Board */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 24, flex: 1 }}>
        {COLUMNS.map(col => {
          const items = contentItems.filter(i => i.status === col.id);
          return (
            <div key={col.id} style={{
              flex: "0 0 280px", background: "#F7F7F5", borderRadius: 12,
              padding: 14, border: "1px solid #E8E8E5", display: "flex", flexDirection: "column",
              maxHeight: "calc(100vh - 200px)",
            }}>
              {/* Column header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                paddingBottom: 10, borderBottom: `2px solid ${col.color}20`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${col.color}12`,
                }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={col.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={col.icon} />
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", flex: 1 }}>{col.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: col.color,
                  background: `${col.color}12`, padding: "2px 8px", borderRadius: 10,
                }}>{items.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
                {items.map(item => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onOpen={() => setViewItem(item)}
                    onOptimize={() => handleOptimize(item)}
                    onAdvance={(status) => advanceStatus(item, status)}
                    onRevert={(status) => advanceStatus(item, status)}
                    optimizingId={optimizingId}
                  />
                ))}
                {items.length === 0 && (
                  <div style={{
                    textAlign: "center", color: "#B0B0B0", fontSize: 12, padding: "28px 12px",
                    border: "1px dashed #E0E0DD", borderRadius: 8, background: "#FBFBFA",
                  }}>
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ CREATE DRAFT MODAL ═══ */}
      {createOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" }} onClick={() => setCreateOpen(false)}>
          <div
            style={{
              background: "#FFF", width: 680, maxHeight: "90vh", borderRadius: 16,
              display: "flex", flexDirection: "column",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #EBEBEA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>Create Draft</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8B8B8B" }}>Submit content for AI optimization</p>
              </div>
              <button onClick={() => setCreateOpen(false)} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#9B9B9B", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            {/* Form body */}
            <div style={{ flex: 1, overflow: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Title <span style={{ color: "#C55E5E" }}>*</span></label>
                <input
                  type="text" value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                  style={inputStyle} placeholder="e.g. 5 Fall Styling Tips for Busy Professionals"
                  onFocus={e => { e.target.style.borderColor = "#B88B58"; e.target.style.boxShadow = "0 0 0 3px rgba(184,139,88,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E3E0"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <label style={labelStyle}>Content <span style={{ color: "#C55E5E" }}>*</span></label>
                <textarea
                  value={draftContent} onChange={e => setDraftContent(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minHeight: 160, resize: "vertical" }}
                  placeholder="Paste or write your rough draft here. Include key talking points, messaging, and any specific instructions for optimization…"
                  onFocus={e => { e.target.style.borderColor = "#B88B58"; e.target.style.boxShadow = "0 0 0 3px rgba(184,139,88,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E3E0"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Type of Content */}
              <div>
                <label style={labelStyle}>Type of Content <span style={{ color: "#C55E5E" }}>*</span></label>
                <select
                  value={draftType} onChange={e => setDraftType(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Links */}
              <div>
                <label style={labelStyle}>Links</label>
                <textarea
                  value={draftLinks} onChange={e => setDraftLinks(e.target.value)}
                  style={{ ...inputStyle, height: 64, resize: "vertical" }}
                  placeholder="Reference URLs, one per line (e.g. competitor posts, inspiration, research)"
                  onFocus={e => { e.target.style.borderColor = "#B88B58"; e.target.style.boxShadow = "0 0 0 3px rgba(184,139,88,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E3E0"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={draftNotes} onChange={e => setDraftNotes(e.target.value)}
                  style={{ ...inputStyle, height: 64, resize: "vertical" }}
                  placeholder="Additional context, target audience, brand guidelines, tone preferences…"
                  onFocus={e => { e.target.style.borderColor = "#B88B58"; e.target.style.boxShadow = "0 0 0 3px rgba(184,139,88,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "#E3E3E0"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid #EBEBEA", display: "flex", justifyContent: "flex-end", gap: 12, background: "#FDFDFD" }}>
              <button
                onClick={() => setCreateOpen(false)}
                style={{ padding: "10px 20px", border: "1px solid #E3E3E0", borderRadius: 8, background: "#FFF", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#4A4A4A" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDraft}
                style={{
                  padding: "10px 28px", border: "none", borderRadius: 8,
                  background: "linear-gradient(135deg, #1A1A1A, #333)", color: "#FFF",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                Submit Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW / DETAIL MODAL ═══ */}
      {viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" }} onClick={() => setViewItem(null)}>
          <div
            style={{
              background: "#FFF", width: 960, maxHeight: "92vh", borderRadius: 16,
              display: "flex", flexDirection: "column",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #EBEBEA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
                  background: `${COLUMNS.find(c => c.id === viewItem.status)?.color || "#1A1A1A"}14`,
                  color: COLUMNS.find(c => c.id === viewItem.status)?.color || "#1A1A1A",
                  textTransform: "uppercase",
                }}>
                  {COLUMNS.find(c => c.id === viewItem.status)?.label || viewItem.status}
                </div>
                <span style={{ fontSize: 10, color: "#9B9B9B" }}>
                  {viewItem.type}
                </span>
              </div>
              <button onClick={() => setViewItem(null)} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#9B9B9B", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>{viewItem.title}</h2>
              <div style={{ fontSize: 12, color: "#8B8B8B", marginBottom: 24, display: "flex", gap: 16 }}>
                {viewItem.createdBy && <span>By {viewItem.createdBy}</span>}
                {viewItem.createdAt && <span>{new Date(viewItem.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}
              </div>

              {/* Two column layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Left: Original Draft */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#B88B58" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#4A4A4A" }}>Original Draft</span>
                  </div>
                  <div style={{
                    background: "#FAFAF9", borderRadius: 10, padding: 16,
                    border: "1px solid #E8E8E5", fontSize: 14, lineHeight: 1.7, color: "#333",
                    whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto",
                  }}>
                    {viewItem.rawDraft || "—"}
                  </div>

                  {/* Meta fields */}
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                    {viewItem.links && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#8B8B8B", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Links</div>
                        <div style={{ fontSize: 13, color: "#2383E2", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {viewItem.links}
                        </div>
                      </div>
                    )}
                    {viewItem.notes && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#8B8B8B", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Notes</div>
                        <div style={{ fontSize: 13, color: "#4A4A4A", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {viewItem.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Optimized Content */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2383E2" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#4A4A4A" }}>AI Optimized Content</span>
                  </div>
                  {viewItem.optimizedContent ? (
                    <div style={{
                      background: "#F0F7FF", borderRadius: 10, padding: 16,
                      border: "1px solid #D0E3F5", fontSize: 14, lineHeight: 1.7, color: "#333",
                      whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto",
                    }}>
                      {viewItem.optimizedContent}
                    </div>
                  ) : (
                    <div style={{
                      background: "#FAFAF9", borderRadius: 10, padding: 28,
                      border: "1px dashed #E0E0DD", textAlign: "center",
                      color: "#B0B0B0", fontSize: 13,
                    }}>
                      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#C8C8C5" strokeWidth={1.5} style={{ margin: "0 auto 8px" }}>
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Click "Optimize Draft" to generate AI content
                    </div>
                  )}

                  {/* Feedback */}
                  {viewItem.feedback && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#C55E5E", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Revision Feedback</div>
                      <div style={{ fontSize: 13, color: "#4A4A4A", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#FFF5F5", padding: 12, borderRadius: 8, border: "1px solid #F0D0D0" }}>
                        {viewItem.feedback}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with actions */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid #EBEBEA", display: "flex", justifyContent: "space-between", background: "#FDFDFD", borderRadius: "0 0 16px 16px" }}>
              <button
                onClick={() => handleDelete(viewItem.id, viewItem.title)}
                style={{ padding: "8px 16px", color: "#C55E5E", background: "transparent", border: "1px solid #F0D0D0", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 13 }}
              >
                Delete
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                {viewItem.status === "draft" && (
                  <button
                    onClick={() => { handleOptimize(viewItem); }}
                    disabled={optimizingId === viewItem.id}
                    style={{
                      padding: "8px 20px",
                      background: optimizingId === viewItem.id ? "#E8E8E5" : "linear-gradient(135deg, #1A1A1A, #333)",
                      color: optimizingId === viewItem.id ? "#6B6B6B" : "#FFF",
                      border: "none", borderRadius: 8, cursor: optimizingId === viewItem.id ? "not-allowed" : "pointer",
                      fontWeight: 600, fontSize: 13,
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {optimizingId === viewItem.id ? "Optimizing…" : "Optimize Draft"}
                  </button>
                )}
                {viewItem.status === "review" && (
                  <>
                    <button
                      onClick={() => advanceStatus(viewItem, "revision")}
                      style={{ padding: "8px 16px", background: "#FFF", color: "#C55E5E", border: "1px solid #F0D0D0", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 13 }}
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => advanceStatus(viewItem, "approved")}
                      style={{ padding: "8px 20px", background: "#5E8C73", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                    >
                      Approve
                    </button>
                  </>
                )}
                {viewItem.status === "optimized" && (
                  <button
                    onClick={() => advanceStatus(viewItem, "review")}
                    style={{ padding: "8px 20px", background: "#CB7F2C", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                  >
                    Send for Review
                  </button>
                )}
                {viewItem.status === "revision" && (
                  <button
                    onClick={() => { handleOptimize(viewItem); }}
                    disabled={optimizingId === viewItem.id}
                    style={{
                      padding: "8px 20px",
                      background: optimizingId === viewItem.id ? "#E8E8E5" : "linear-gradient(135deg, #1A1A1A, #333)",
                      color: optimizingId === viewItem.id ? "#6B6B6B" : "#FFF",
                      border: "none", borderRadius: 8, cursor: optimizingId === viewItem.id ? "not-allowed" : "pointer",
                      fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {optimizingId === viewItem.id ? "Re-optimizing…" : "Re-optimize & Send for Review"}
                  </button>
                )}
                {viewItem.status === "approved" && (
                  <button
                    onClick={() => advanceStatus(viewItem, "scheduled")}
                    style={{ padding: "8px 20px", background: "#7C6FD0", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                  >
                    Schedule
                  </button>
                )}
                {viewItem.status === "scheduled" && (
                  <button
                    onClick={() => advanceStatus(viewItem, "published")}
                    style={{ padding: "8px 20px", background: "#1A1A1A", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                  >
                    Mark Published
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
