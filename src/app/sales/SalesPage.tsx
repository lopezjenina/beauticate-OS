"use client";

import React, { useState, useMemo } from "react";
import { Lead, Attachment } from "@/lib/types";
import { INIT_LEADS } from "@/lib/store";
import { Avatar, Badge, Btn, PageHeader, FilterPills, EmptyState, ConfirmModal, FileUploadArea, AttachmentList, LinkInput } from "@/components/ui";

interface SalesPageProps {
  leads?: Lead[];
  setLeads?: (fn: (prev: Lead[]) => Lead[]) => void;
  onClosedWon?: (lead: Lead) => void;
  canDelete?: boolean;
}

const PIPELINE_STAGES = ["lead", "call", "proposal", "follow_up", "closed_won", "closed_lost"] as const;
const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  call: "Call",
  proposal: "Proposal",
  follow_up: "Follow Up",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function SalesPage({
  leads: initialLeads = INIT_LEADS,
  setLeads = () => {},
  onClosedWon = () => {},
  canDelete = false,
}: SalesPageProps) {
  const [leads, setInternalLeads] = useState<Lead[]>(initialLeads);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [showClosedWonConfirm, setShowClosedWonConfirm] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contactName: "",
    company: "",
    email: "",
    phone: "",
    source: "",
    estimatedRevenue: "",
    notes: "",
  });

  const sources = useMemo(() => {
    const uniqueSources = Array.from(new Set(leads.map((l) => l.source)));
    return uniqueSources;
  }, [leads]);

  const sourceOptions = [
    { label: "All Sources", value: null },
    ...sources.map((src) => ({ label: src, value: src })),
  ];

  const filteredLeads = useMemo(() => {
    if (!sourceFilter) return leads;
    return leads.filter((l) => l.source === sourceFilter);
  }, [leads, sourceFilter]);

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    PIPELINE_STAGES.forEach((stage) => {
      grouped[stage] = filteredLeads.filter((l) => l.stage === stage);
    });
    return grouped;
  }, [filteredLeads]);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnStage = (stage: typeof PIPELINE_STAGES[number]) => {
    if (!draggedLead) return;

    if (stage === "closed_won") {
      setShowClosedWonConfirm(draggedLead);
    } else {
      const updated = leads.map((l) =>
        l.id === draggedLead.id ? { ...l, stage } : l
      );
      setInternalLeads(updated);
      setLeads(() => updated);
    }

    setDraggedLead(null);
  };

  const confirmClosedWon = () => {
    if (!showClosedWonConfirm) return;

    const updated = leads.map((l) =>
      l.id === showClosedWonConfirm.id
        ? { ...l, stage: "closed_won" as const, closeDate: new Date().toISOString().split("T")[0] }
        : l
    );
    setInternalLeads(updated);
    setLeads(() => updated);
    onClosedWon(showClosedWonConfirm);
    setShowClosedWonConfirm(null);
  };

  const resetForm = () => {
    setFormData({ contactName: "", company: "", email: "", phone: "", source: "", estimatedRevenue: "", notes: "" });
    setFormAttachments([]);
    setEditingLead(null);
    setInlineEditId(null);
    setShowNewLeadForm(false);
  };

  const handleEditLead = (lead: Lead) => {
    setFormData({
      contactName: lead.contactName,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      estimatedRevenue: String(lead.estimatedRevenue),
      notes: lead.notes,
    });
    setFormAttachments(lead.attachments || []);
    setEditingLead(lead);
    setInlineEditId(lead.id);
  };

  const handleInlineSave = () => {
    if (!editingLead || !formData.contactName || !formData.company || !formData.email || !formData.source) {
      return;
    }
    const updated = leads.map((l) =>
      l.id === editingLead.id
        ? {
            ...l,
            contactName: formData.contactName,
            company: formData.company,
            email: formData.email,
            phone: formData.phone,
            source: formData.source,
            estimatedRevenue: parseInt(formData.estimatedRevenue) || 0,
            notes: formData.notes,
            attachments: formAttachments.length > 0 ? formAttachments : undefined,
          }
        : l
    );
    setInternalLeads(updated);
    setLeads(() => updated);
    resetForm();
  };

  const handleInlineCancel = () => {
    setFormData({ contactName: "", company: "", email: "", phone: "", source: "", estimatedRevenue: "", notes: "" });
    setFormAttachments([]);
    setEditingLead(null);
    setInlineEditId(null);
  };

  const handleDeleteLead = () => {
    if (!deletingLead) return;
    const updated = leads.filter((l) => l.id !== deletingLead.id);
    setInternalLeads(updated);
    setLeads(() => updated);
    setDeletingLead(null);
  };

  const handleCreateLead = () => {
    if (!formData.contactName || !formData.company || !formData.email || !formData.source) {
      return;
    }

    if (editingLead) {
      const updated = leads.map((l) =>
        l.id === editingLead.id
          ? {
              ...l,
              contactName: formData.contactName,
              company: formData.company,
              email: formData.email,
              phone: formData.phone,
              source: formData.source,
              estimatedRevenue: parseInt(formData.estimatedRevenue) || 0,
              notes: formData.notes,
              attachments: formAttachments.length > 0 ? formAttachments : undefined,
            }
          : l
      );
      setInternalLeads(updated);
      setLeads(() => updated);
    } else {
      const newLead: Lead = {
        id: `l${Date.now()}`,
        contactName: formData.contactName,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        source: formData.source,
        estimatedRevenue: parseInt(formData.estimatedRevenue) || 0,
        stage: "lead",
        notes: formData.notes,
        createdAt: new Date().toISOString().split("T")[0],
        attachments: formAttachments.length > 0 ? formAttachments : undefined,
      };
      const updated = [...leads, newLead];
      setInternalLeads(updated);
      setLeads(() => updated);
    }
    resetForm();
  };

  const handleFilesSelected = (files: { name: string; url: string; type: "image" | "video" | "document" }[]) => {
    const newAttachments: Attachment[] = files.map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      name: f.name,
      url: f.url,
      type: f.type,
      thumbnailUrl: f.type === "image" ? f.url : undefined,
      addedAt: new Date().toISOString(),
    }));
    setFormAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleLinkAdd = (link: { name: string; url: string }) => {
    setFormAttachments((prev) => [...prev, {
      id: `att-${Date.now()}`,
      name: link.name,
      url: link.url,
      type: "link" as const,
      addedAt: new Date().toISOString(),
    }]);
  };

  const totalValue = filteredLeads.reduce((sum, l) => sum + l.estimatedRevenue, 0);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", padding: "56px" }}>
      <PageHeader
        title="Sales Pipeline"
        subtitle={`${filteredLeads.length} leads | $${(totalValue / 1000).toFixed(1)}K total value`}
      >
        <Btn variant="primary" onClick={() => { resetForm(); setShowNewLeadForm(true); }}>
          New Lead
        </Btn>
      </PageHeader>

      {/* Source Filter */}
      <FilterPills
        options={sourceOptions}
        value={sourceFilter}
        onChange={setSourceFilter}
      />

      {/* Kanban Board */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(200px, 1fr))",
          overflowX: "auto",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage}
            onDragOver={handleDragOver}
            onDrop={() => handleDropOnStage(stage)}
            style={{
              background: "#F7F7F5",
              borderRadius: "8px",
              border: "1px solid #E3E3E0",
              padding: "16px 14px",
              minHeight: "500px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1A1A1A",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {STAGE_LABELS[stage]}
            </div>
            <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: "20px" }}>
              {leadsByStage[stage].length}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {leadsByStage[stage].map((lead) =>
                inlineEditId === lead.id ? (
                  /* ---- Inline Edit Card ---- */
                  <div
                    key={lead.id}
                    style={{
                      padding: "16px 14px",
                      background: "#FFFFFF",
                      borderRadius: "6px",
                      border: "1px solid #D0D0D0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        type="text"
                        placeholder="Company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        style={{ padding: "4px 8px", fontSize: 13, border: "1px solid #E3E3E0", borderRadius: 4, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      />
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #E3E3E0", borderRadius: 4, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #E3E3E0", borderRadius: 4, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #E3E3E0", borderRadius: 4, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      />
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #E3E3E0", borderRadius: 4, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      >
                        <option value="">Select source</option>
                        <option value="Instagram DM">Instagram DM</option>
                        <option value="Referral">Referral</option>
                        <option value="Website">Website</option>
                        <option value="Cold outreach">Cold outreach</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Event">Event</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Revenue"
                        value={formData.estimatedRevenue}
                        onChange={(e) => setFormData({ ...formData, estimatedRevenue: e.target.value })}
                        style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #E3E3E0", borderRadius: 4, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      />
                      <textarea
                        placeholder="Notes"
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #E3E3E0", borderRadius: 4, width: "100%", fontFamily: "inherit", boxSizing: "border-box" as const, resize: "vertical" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <Btn variant="primary" onClick={handleInlineSave} style={{ fontSize: 11, padding: "4px 12px" }}>Save</Btn>
                      <Btn variant="ghost" onClick={handleInlineCancel} style={{ fontSize: 11, padding: "4px 12px" }}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  /* ---- Read-only Card ---- */
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    style={{
                      padding: "16px 14px",
                      background: "#FFFFFF",
                      borderRadius: "6px",
                      border: "1px solid #E3E3E0",
                      cursor: "grab",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                      (e.currentTarget as HTMLElement).style.borderColor = "#D0D0D0";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLElement).style.borderColor = "#E3E3E0";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: "4px" }}>
                          {lead.company}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                          {lead.contactName}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <Badge variant="default">${lead.estimatedRevenue.toLocaleString()}</Badge>
                    </div>

                    <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: "8px" }}>
                      {lead.source}
                    </div>

                    {lead.notes && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6B6B6B",
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          marginTop: "6px",
                        }}
                      >
                        {lead.notes}
                      </div>
                    )}

                    {lead.attachments && lead.attachments.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>
                        {lead.attachments.length} file{lead.attachments.length !== 1 ? "s" : ""}
                      </div>
                    )}

                    {/* Edit / Delete buttons */}
                    <div style={{ display: "flex", gap: 6, marginTop: 8, paddingTop: 6, borderTop: "1px solid #EBEBEA" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditLead(lead); }}
                        style={{
                          flex: 1, padding: "4px 0", border: "none", background: "transparent",
                          color: "#6B6B6B", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                          borderRadius: 4,
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F0F0EE"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        Edit
                      </button>
                      {canDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingLead(lead); }}
                          style={{
                            flex: 1, padding: "4px 0", border: "none", background: "transparent",
                            color: "#EB5757", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                            borderRadius: 4,
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FDECEC"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}

              {leadsByStage[stage].length === 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#9B9B9B",
                    textAlign: "center",
                    padding: "32px 0",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  No leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New / Edit Lead Form Modal */}
      {showNewLeadForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={resetForm}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid #E3E3E0",
              padding: "40px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A", margin: "0 0 28px", letterSpacing: "-0.01em" }}>
              {editingLead ? "Edit Lead" : "New Lead"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "28px" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #E3E3E0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  placeholder="e.g., Diana Ruiz"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #E3E3E0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  placeholder="e.g., Halo Skincare"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #E3E3E0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  placeholder="diana@haloskincare.com"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #E3E3E0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  placeholder="201-555-0101"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #E3E3E0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select source</option>
                  <option value="Instagram DM">Instagram DM</option>
                  <option value="Referral">Referral</option>
                  <option value="Website">Website</option>
                  <option value="Cold outreach">Cold outreach</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Event">Event</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Estimated Revenue
                </label>
                <input
                  type="number"
                  value={formData.estimatedRevenue}
                  onChange={(e) => setFormData({ ...formData, estimatedRevenue: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #E3E3E0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  placeholder="3000"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #E3E3E0",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  placeholder="Add notes..."
                />
              </div>

              {/* Attachments Section */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: "6px" }}>
                  Attachments
                </label>
                <FileUploadArea onFilesSelected={handleFilesSelected} />
                <div style={{ marginTop: 10 }}>
                  <LinkInput onAdd={handleLinkAdd} />
                </div>
                <AttachmentList
                  attachments={formAttachments}
                  onRemove={(id) => setFormAttachments((prev) => prev.filter((a) => a.id !== id))}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Btn onClick={resetForm}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreateLead}>
                {editingLead ? "Save Changes" : "Create Lead"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Closed Won Confirmation Modal */}
      {showClosedWonConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
          onClick={() => setShowClosedWonConfirm(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid #E3E3E0",
              padding: "40px",
              maxWidth: "400px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A", marginBottom: "12px" }}>
              Closing Won
            </div>
            <div style={{ fontSize: 14, color: "#6B6B6B", marginBottom: "28px" }}>
              Move {showClosedWonConfirm.company} to Closed Won and create as a new client?
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Btn onClick={() => setShowClosedWonConfirm(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={confirmClosedWon}>
                Confirm
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingLead && (
        <ConfirmModal
          title="Delete Lead"
          message={`This will permanently remove ${deletingLead.company} from your pipeline.`}
          onConfirm={handleDeleteLead}
          onCancel={() => setDeletingLead(null)}
        />
      )}
    </div>
  );
}
