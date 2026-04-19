"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Badge, Btn, Avatar, showToast } from "@/components/ui";
import { logActivity } from "@/lib/activityLog";
import { fetchContent, upsertContent, deleteContent } from "@/lib/db";
import { ContentPipeline } from "@/lib/types";

interface Props {
  userName?: string;
  // Kept for backward compatibility with page.tsx
  videos?: any[];
  setVideos?: any;
  clients?: any[];
  users?: any[];
}

const COLUMNS = [
  { id: "draft", label: "Drafts" },
  { id: "optimized", label: "AI Optimized" },
  { id: "staged", label: "Staged (WP/GHL)" },
  { id: "pending_approval", label: "Pending Review" },
  { id: "approved", label: "Approved" },
  { id: "published", label: "Published" },
];

export default function PublishingPage({ userName }: Props) {
  const [contentItems, setContentItems] = useState<ContentPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ContentPipeline> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchContent();
    setContentItems(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingItem?.title || !editingItem?.type) return showToast("Title and type are required", "error");
    
    const isNew = !editingItem.id;
    const payload: ContentPipeline = {
      id: editingItem.id || `content-${Date.now()}`,
      title: editingItem.title,
      type: editingItem.type,
      rawDraft: editingItem.rawDraft || "",
      optimizedContent: editingItem.optimizedContent || "",
      status: editingItem.status || "draft",
      feedback: editingItem.feedback || "",
      scheduledDate: editingItem.scheduledDate || "",
    };

    await upsertContent(payload);
    await loadData();
    setModalOpen(false);
    setEditingItem(null);
    showToast(`Content ${isNew ? "created" : "updated"} successfully!`, "success");
    logActivity({
      user: userName || "Unknown",
      action: isNew ? "created" : "updated",
      entity: "document",
      entityName: payload.title,
      details: isNew ? "Added new content draft" : "Updated content details",
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteContent(id);
      await loadData();
      showToast("Content deleted", "success");
      logActivity({ user: userName || "Unknown", action: "deleted", entity: "document", entityName: title });
    }
  };

  const advanceStatus = async (item: ContentPipeline, newStatus: ContentPipeline["status"]) => {
    const updated = { ...item, status: newStatus };
    await upsertContent(updated);
    await loadData();
    showToast(`Moved to ${newStatus}`, "info");
    logActivity({ user: userName || "Unknown", action: "moved", entity: "document", entityName: item.title, details: `Status changed to ${newStatus}` });
    
    // Simulate AI Generation delay if moved to optimized
    if (newStatus === "optimized" && !item.optimizedContent) {
      showToast("AI Optimization in progress...", "info");
      setTimeout(async () => {
        const aiSimulated = { 
          ...updated, 
          optimizedContent: `[AI GENERATED OPTIMIZATION]\n\n${item.rawDraft}\n\n(Note: This is a placeholder until OpenAI is connected!)` 
        };
        await upsertContent(aiSimulated);
        await loadData();
        showToast("AI Optimization complete!", "success");
        logActivity({ user: "System AI", action: "updated", entity: "document", entityName: item.title, details: "Generated optimized content" });
      }, 2500);
    }
  };

  return (
    <div style={{ padding: "0 40px 60px", background: "#FFFFFF", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <PageHeader title="Content Engine" subtitle="Automated Publishing Pipeline" />
          <Btn variant="primary" onClick={() => { setEditingItem({ type: "Blog", status: "draft" }); setModalOpen(true); }}>
            + New Draft
          </Btn>
        </div>

        <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 20 }}>
          {COLUMNS.map(col => {
            const items = contentItems.filter(i => i.status === col.id);
            return (
              <div key={col.id} style={{ flex: "0 0 320px", background: "#F7F7F5", borderRadius: 12, padding: 16, border: "1px solid #E3E3E0" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                  {col.label}
                  <span style={{ color: "#9B9B9B", background: "#EBEBEA", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>{items.length}</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 200 }}>
                  {items.map(item => (
                    <div key={item.id} className="glass" style={{ background: "#FFFFFF", padding: 16, borderRadius: 8, border: "1px solid #E3E3E0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }} onClick={() => { setEditingItem(item); setModalOpen(true); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", color: "#6B6B6B", textTransform: "uppercase" }}>{item.type}</span>
                        {item.scheduledDate && <span style={{ fontSize: 10, color: "#4DAB9A", background: "#EAF5F2", padding: "2px 6px", borderRadius: 4 }}>{new Date(item.scheduledDate).toLocaleDateString()}</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12, lineHeight: 1.3 }}>{item.title}</div>
                      
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                        {item.status === "draft" && <button onClick={() => advanceStatus(item, "optimized")} style={{ flex: 1, padding: "6px", background: "#1A1A1A", color: "#FFF", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Optimize with AI</button>}
                        {item.status === "optimized" && <button onClick={() => advanceStatus(item, "staged")} style={{ flex: 1, padding: "6px", background: "#2383E2", color: "#FFF", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Mark as Staged</button>}
                        {item.status === "staged" && <button onClick={() => advanceStatus(item, "pending_approval")} style={{ flex: 1, padding: "6px", background: "#CB7F2C", color: "#FFF", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Request Review</button>}
                        {item.status === "pending_approval" && <button onClick={() => advanceStatus(item, "approved")} style={{ flex: 1, padding: "6px", background: "#4DAB9A", color: "#FFF", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Approve</button>}
                        {item.status === "approved" && <button onClick={() => advanceStatus(item, "published")} style={{ flex: 1, padding: "6px", background: "#1A1A1A", color: "#FFF", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Publish</button>}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div style={{ textAlign: "center", color: "#9B9B9B", fontSize: 12, padding: "20px 0" }}>No items</div>}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Editor Modal */}
        {modalOpen && editingItem && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setModalOpen(false)}>
            <div style={{ background: "#FFF", width: 900, height: "85vh", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #EBEBEA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{editingItem.id ? "Edit Content" : "New Content Draft"}</h2>
                <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#9B9B9B" }}>&times;</button>
              </div>
              
              <div style={{ flex: 1, overflow: "auto", padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>Title</label>
                    <input type="text" value={editingItem.title || ""} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #E3E3E0", borderRadius: 6, fontSize: 14 }} placeholder="e.g. 5 Fall Styling Tips" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>Content Type</label>
                    <select value={editingItem.type || "Blog"} onChange={e => setEditingItem({ ...editingItem, type: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #E3E3E0", borderRadius: 6, fontSize: 14 }}>
                      <option>Blog Post</option>
                      <option>EDM / Newsletter</option>
                      <option>Social Caption</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>Raw Draft / Instructions</label>
                    <textarea value={editingItem.rawDraft || ""} onChange={e => setEditingItem({ ...editingItem, rawDraft: e.target.value })} style={{ flex: 1, width: "100%", padding: 10, border: "1px solid #E3E3E0", borderRadius: 6, fontSize: 14, resize: "none" }} placeholder="Paste the rough draft here..." />
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16, background: "#F7F7F5", padding: 16, borderRadius: 8 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>AI Optimized Content</label>
                    <textarea value={editingItem.optimizedContent || ""} onChange={e => setEditingItem({ ...editingItem, optimizedContent: e.target.value })} style={{ flex: 1, width: "100%", padding: 10, border: "1px solid #E3E3E0", borderRadius: 6, fontSize: 14, resize: "none", background: "#FFF" }} placeholder="Optimized result will appear here. You can manually edit it." />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>Feedback / Notes</label>
                    <textarea value={editingItem.feedback || ""} onChange={e => setEditingItem({ ...editingItem, feedback: e.target.value })} style={{ width: "100%", padding: 10, border: "1px solid #E3E3E0", borderRadius: 6, fontSize: 14, height: 80, resize: "none", background: "#FFF" }} placeholder="Sigourney can leave revision notes here..." />
                  </div>
                </div>
              </div>
              
              <div style={{ padding: "16px 24px", borderTop: "1px solid #EBEBEA", display: "flex", justifyContent: "space-between", background: "#FDFDFD", borderRadius: "0 0 16px 16px" }}>
                {editingItem.id ? (
                  <button onClick={() => handleDelete(editingItem.id!, editingItem.title || "Untitled")} style={{ padding: "8px 16px", color: "#EB5757", background: "transparent", border: "1px solid #FADADA", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>Delete Draft</button>
                ) : <div/>}
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setModalOpen(false)} style={{ padding: "8px 16px", border: "1px solid #E3E3E0", borderRadius: 6, background: "#FFF", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleSave} style={{ padding: "8px 24px", border: "none", borderRadius: 6, background: "#1A1A1A", color: "#FFF", cursor: "pointer", fontWeight: 600 }}>Save Content</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
