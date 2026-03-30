"use client";

import React, { useState, useMemo } from "react";
import { Lead } from "@/lib/types";
import { INIT_LEADS } from "@/lib/store";
import { Avatar, Badge, Btn, PageHeader, FilterPills, EmptyState } from "@/components/ui";

interface SalesPageProps {
  leads?: Lead[];
  setLeads?: (fn: (prev: Lead[]) => Lead[]) => void;
  onClosedWon?: (lead: Lead) => void;
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
}: SalesPageProps) {
  const [leads, setInternalLeads] = useState<Lead[]>(initialLeads);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [showClosedWonConfirm, setShowClosedWonConfirm] = useState<Lead | null>(null);
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

  const handleCreateLead = () => {
    if (!formData.contactName || !formData.company || !formData.email || !formData.source) {
      return;
    }

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
    };

    const updated = [...leads, newLead];
    setInternalLeads(updated);
    setLeads(() => updated);
    setFormData({ contactName: "", company: "", email: "", phone: "", source: "", estimatedRevenue: "", notes: "" });
    setShowNewLeadForm(false);
  };

  const totalValue = filteredLeads.reduce((sum, l) => sum + l.estimatedRevenue, 0);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", padding: "56px" }}>
      <PageHeader
        title="Sales Pipeline"
        subtitle={`${filteredLeads.length} leads | $${(totalValue / 1000).toFixed(1)}K total value`}
      >
        <Btn variant="primary" onClick={() => setShowNewLeadForm(true)}>
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
          gridTemplateColumns: "repeat(6, 1fr)",
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
              padding: "20px",
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
              {leadsByStage[stage].map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead)}
                  style={{
                    padding: "16px",
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
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: "3px" }}>
                        {lead.company}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                        {lead.contactName}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
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
                      }}
                    >
                      {lead.notes}
                    </div>
                  )}
                </div>
              ))}

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

      {/* New Lead Form Modal */}
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
          onClick={() => setShowNewLeadForm(false)}
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
              New Lead
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
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Btn onClick={() => setShowNewLeadForm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreateLead}>
                Create Lead
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
    </div>
  );
}
