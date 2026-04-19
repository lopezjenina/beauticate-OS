"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader, Btn, showToast } from "@/components/ui";
import { logActivity } from "@/lib/activityLog";
import { fetchContent, upsertContent, deleteContent } from "@/lib/db";
import { ContentPipeline } from "@/lib/types";

/* ─── KANBAN CONFIG ─── */
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
  "Blog Post", "EDM / Newsletter", "Social Caption", "Video Script", "Ad Copy", "Case Study", "Landing Page",
];

/* ─── CUSTOM MARKDOWN RENDERER ─── */
function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function MarkdownRenderer({ content, preview = false }: { content: string, preview?: boolean }) {
  if (!content) return null;
  
  const lines = content.split('\n');
  const rendered = lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: 8 }} />;
    
    // Headings
    if (trimmed.startsWith('### ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, margin: '14px 0 6px', color: '#1A1A1A' }}>{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith('## ')) return <h2 key={i} style={{ fontSize: 17, fontWeight: 800, margin: '18px 0 8px', color: '#1A1A1A' }}>{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith('# ')) return <h1 key={i} style={{ fontSize: 20, fontWeight: 800, margin: '22px 0 10px', color: '#1A1A1A' }}>{trimmed.slice(2)}</h1>;
    
    // Bullets
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4, marginBottom: 4 }}>
        <span style={{ color: '#B88B58' }}>•</span>
        <span style={{ fontSize: 13, lineHeight: 1.5 }}>{renderInline(trimmed.slice(2))}</span>
      </div>;
    }
    
    return <p key={i} style={{ margin: '0 0 6px', fontSize: 13, lineHeight: 1.6, color: '#333' }}>{renderInline(line)}</p>;
  });

  if (preview) {
    return <div style={{ maxHeight: 100, overflow: 'hidden', position: 'relative' }}>
      {rendered.slice(0, 3)}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, #FFF)' }} />
    </div>;
  }
  
  return <div style={{ color: '#333' }}>{rendered}</div>;
}

/* ─── KANBAN CARD ─── */
function ContentCard({
  item, onOpen, onOptimize, onAdvance, optimizingId,
}: {
  item: ContentPipeline;
  onOpen: () => void;
  onOptimize: () => void;
  onAdvance: (status: ContentPipeline["status"]) => void;
  optimizingId: string | null;
}) {
  const isOptimizing = optimizingId === item.id;
  const colDef = COLUMNS.find(c => c.id === item.status);
  const color = colDef?.color || "#1A1A1A";

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

  const nextStatus = getNextStatus();

  return (
    <div
      onClick={onOpen}
      style={{
        background: "#FFFFFF",
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid #EBEBE8",
        boxShadow: isOptimizing ? `0 0 0 2px ${color}40, 0 12px 24px ${color}15` : "0 2px 4px rgba(0,0,0,0.03)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        animation: isOptimizing ? "pulse 2s infinite" : "none",
      }}
      onMouseEnter={e => {
        if (!isOptimizing) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
          e.currentTarget.style.borderColor = `${color}40`;
        }
      }}
      onMouseLeave={e => {
        if (!isOptimizing) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.03)";
          e.currentTarget.style.borderColor = "#EBEBE8";
        }
      }}
    >
      {/* Type & Date */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
          color: color, background: `${color}12`, padding: "2px 8px", borderRadius: 4,
        }}>
          {item.type}
        </span>
        <span style={{ fontSize: 10, color: "#A0A09E", fontWeight: 500 }}>
          {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Main Content */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.3 }}>
        {item.title}
      </div>

      <div style={{ marginBottom: 14 }}>
        {item.optimizedContent ? (
          <div style={{ fontSize: 12, color: "#6B6B6B" }}>
            <span style={{ color: color, fontWeight: 600, fontSize: 10, display: "block", marginBottom: 4 }}>✓ OPTIMIZED</span>
            <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {item.optimizedContent.replace(/[#*]/g, '').slice(0, 100)}...
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#8E8E8C", fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.rawDraft.slice(0, 100)}...
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, borderTop: "1px solid #F5F5F3", paddingTop: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#EEE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#666" }}>
          {item.createdBy?.[0] || "U"}
        </div>
        <span style={{ fontSize: 10, color: "#8E8E8C", flex: 1 }}>{item.createdBy}</span>
        {item.status === "revision" && <span style={{ fontSize: 9, fontWeight: 700, color: "#C55E5E" }}>NEED REVISION</span>}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
        {item.status === "draft" && (
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: isOptimizing ? "#F5F5F3" : "linear-gradient(135deg, #1A1A1A, #333)",
              color: isOptimizing ? "#A0A09E" : "#FFF", border: "none", cursor: isOptimizing ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            {isOptimizing ? (
              <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #D0D0CE", borderTopColor: color, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            ) : "✨ Optimize"}
          </button>
        )}
        {nextStatus && !isOptimizing && (
          <button
            onClick={() => onAdvance(nextStatus)}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: "#FFF", color: color, border: `1.5px solid ${color}30`, cursor: "pointer",
            }}
          >
            Advance →
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function PublishingPage({ userName }: { userName?: string }) {
  const [contentItems, setContentItems] = useState<ContentPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ContentPipeline | null>(null);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  const [form, setForm] = useState({ title: "", content: "", type: "Blog Post", links: "", notes: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await fetchContent();
    setContentItems(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) return showToast("Title and Content are required", "error");

    const payload: ContentPipeline = {
      id: crypto.randomUUID(), title: form.title, type: form.type, rawDraft: form.content,
      status: "draft", links: form.links, notes: form.notes, createdBy: userName || "Unknown",
    };

    await upsertContent(payload);
    setContentItems(prev => [payload, ...prev]);
    setForm({ title: "", content: "", type: "Blog Post", links: "", notes: "" });
    setCreateOpen(false);
    showToast("Draft submitted!", "success");
    logActivity({ user: userName || "Unknown", action: "created", entity: "document", entityName: payload.title });
  };

  const handleOptimize = async (item: ContentPipeline) => {
    setOptimizingId(item.id);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItem: item }),
      });

      if (!res.ok) throw new Error("Optimization failed");
      const { result } = await res.json();

      const updated = { ...item, optimizedContent: result, status: "optimized" as const };
      
      // Update local state IMMEDIATELY for snappy UI
      setContentItems(prev => prev.map(i => i.id === item.id ? updated : i));
      if (viewItem?.id === item.id) setViewItem(updated);
      
      await upsertContent(updated);
      showToast("Optimized with OpenRouter Llama 3!", "success");
      logActivity({ user: "AI Engine", action: "updated", entity: "document", entityName: item.title, details: "AI Optimization complete" });
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setOptimizingId(null);
    }
  };

  const moveStatus = async (item: ContentPipeline, newStatus: ContentPipeline["status"]) => {
    const updated = { ...item, status: newStatus };
    setContentItems(prev => prev.map(i => i.id === item.id ? updated : i));
    if (viewItem?.id === item.id) setViewItem(updated);
    await upsertContent(updated);
    showToast(`Status updated to ${newStatus}`, "info");
  };

  const handleDelete = async (item: ContentPipeline) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await deleteContent(item.id);
    setContentItems(prev => prev.filter(i => i.id !== item.id));
    setViewItem(null);
    showToast("Deleted", "success");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", border: "1px solid #E3E3E0", borderRadius: 10,
    fontSize: 14, background: "#FAFAF9", outline: "none", transition: "all 0.2s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "0 16px", minHeight: "calc(100vh - 100px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <PageHeader title="Content Engine" subtitle="Editorial Pipeline & AI Optimization" />
        <Btn variant="primary" onClick={() => setCreateOpen(true)} style={{ borderRadius: 10, padding: "10px 24px" }}>
          + New Draft
        </Btn>
      </div>

      {/* KANBAN BOARD */}
      <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 24, flex: 1, alignItems: "flex-start" }}>
        {COLUMNS.map(col => {
          const items = contentItems.filter(i => i.status === col.id);
          return (
            <div key={col.id} style={{
              flex: "0 0 300px", background: "#F7F7F5", borderRadius: 16, border: "1px solid #EBEBE8",
              display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 220px)",
            }}>
              <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: `2.5px solid ${col.color}20` }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", flex: 1 }}>{col.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.color, background: `${col.color}15`, padding: "2px 10px", borderRadius: 20 }}>{items.length}</span>
              </div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
                {items.map(item => (
                  <ContentCard key={item.id} item={item} onOpen={() => setViewItem(item)} onOptimize={() => handleOptimize(item)} onAdvance={s => moveStatus(item, s)} optimizingId={optimizingId} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE MODAL */}
      {createOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.5)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setCreateOpen(false)}>
          <div style={{ background: "#FFF", width: 640, borderRadius: 20, padding: 32, boxShadow: "0 30px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 800 }}>Create New Draft</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <input style={inputStyle} placeholder="Article Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <textarea style={{ ...inputStyle, height: 200 }} placeholder="Paste draft content here..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
              <select style={inputStyle} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 10 }}>
                <Btn variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Btn>
                <Btn variant="primary" onClick={handleSubmit}>Create Draft</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.5)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setViewItem(null)}>
          <div style={{ background: "#FFF", width: "90%", maxWidth: 1000, height: "85vh", borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 80px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 32px", borderBottom: "1px solid #EEE", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFAF9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: COLUMNS.find(c => c.id === viewItem.status)?.color, background: `${COLUMNS.find(c => c.id === viewItem.status)?.color}15`, padding: "4px 12px", borderRadius: 6 }}>{viewItem.status}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8E8E8C" }}>{viewItem.type}</span>
              </div>
              <button onClick={() => setViewItem(null)} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: "#BBB" }}>&times;</button>
            </div>
            
            <div style={{ flex: 1, overflow: "auto", padding: "40px" }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: "#1A1A1A", lineHeight: 1.2 }}>{viewItem.title}</h1>
              <div style={{ fontSize: 13, color: "#8E8E8C", marginBottom: 40 }}>By {viewItem.createdBy} • Produced on {new Date().toLocaleDateString()}</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#B88B58", marginBottom: 16, letterSpacing: "0.05em" }}>Original Draft</h4>
                  <div style={{ background: "#FAFAF9", padding: 24, borderRadius: 16, border: "1px solid #EBEBE8", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {viewItem.rawDraft}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#2383E2", marginBottom: 16, letterSpacing: "0.05em" }}>AI Optimized Version</h4>
                  {viewItem.optimizedContent ? (
                    <div style={{ background: "#F0F7FF", padding: 24, borderRadius: 16, border: "1px solid #D0E3F5" }}>
                      <MarkdownRenderer content={viewItem.optimizedContent} />
                    </div>
                  ) : (
                    <div style={{ padding: 40, border: "2px dashed #EEE", borderRadius: 16, textAlign: "center", color: "#BBB" }}>
                      No optimized content yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: "20px 32px", borderTop: "1px solid #EEE", display: "flex", justifyContent: "space-between", background: "#FFF" }}>
              <button onClick={() => handleDelete(viewItem)} style={{ color: "#C55E5E", background: "none", border: "none", fontWeight: 600, cursor: "pointer" }}>Delete Document</button>
              <div style={{ display: "flex", gap: 12 }}>
                {viewItem.status === "draft" && <Btn variant="primary" onClick={() => handleOptimize(viewItem)} disabled={optimizingId === viewItem.id}>{optimizingId === viewItem.id ? "Optimizing..." : "✨ Run AI Optimization"}</Btn>}
                {viewItem.status === "review" && <Btn variant="primary" onClick={() => moveStatus(viewItem, "approved")}>Approve & Ready</Btn>}
                <Btn variant="secondary" onClick={() => setViewItem(null)}>Close</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 
          0% { background: #FFF; }
          50% { background: #FAFAFA; border-color: #2383E240; }
          100% { background: #FFF; }
        }
      `}</style>
    </div>
  );
}
