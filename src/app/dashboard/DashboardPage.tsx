"use client";

import React, { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Client, Video, Lead, AdCampaign } from "@/lib/types";
import { ContentPipeline } from "@/lib/db";
import { WEEKLY_TARGET } from "@/lib/store";
import { AppUser } from "@/lib/auth";
import { Avatar, Badge, Btn, Stat, PageHeader, ProgressBar, EmptyState } from "@/components/ui";
import { exportClients, exportLeads, exportVideos, exportCampaigns } from "@/lib/exportCsv";

interface DashboardPageProps {
  clients?: Client[];
  videos?: Video[];
  leads?: Lead[];
  ads?: AdCampaign[];
  users?: AppUser[];
}

/* ─── Design Tokens ─── */
const PRIMARY = "#5B5FC7";
const SECONDARY = "#8B8FD6";
const LIGHT = "#C5C7F2";
const ACCENT_GREEN = "#22C55E";
const ACCENT_ORANGE = "#F59E0B";
const ACCENT_RED = "#EF4444";

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  padding: 32,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

const statValue: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#1A1A1A",
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#6B6B6B",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const sectionGap = 32;

export default function DashboardPage({
  clients = [],
  videos = [],
  leads = [],
  ads = [],
  users = [],
}: DashboardPageProps) {
  const today = new Date("2026-03-30");
  const [periodFilter, setPeriodFilter] = useState("month");

  const [contents, setContents] = useState<ContentPipeline[]>([]);
  
  useEffect(() => {
    import("@/lib/db").then(m => m.fetchContent().then(setContents));
  }, []);

  // ─── Core Stats ───
  const activeClients = useMemo(() => clients.filter((c) => c.status === "active").length, [clients]);

  const monthlyRevenue = useMemo(
    () => clients.reduce((sum, c) => sum + (c.status === "active" ? c.monthlyRevenue : 0), 0),
    [clients]
  );

  const contentsThisWeek = useMemo(
    () => contents.filter((c) => {
      if (!c.scheduledDate) return false;
      const d = new Date(c.scheduledDate);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return d >= weekStart && d <= weekEnd;
    }).length,
    [contents, today]
  );

  const pendingApprovals = useMemo(
    () => contents.filter((c) => c.status === "pending_approval").length,
    [contents]
  );

  const activeAds = useMemo(() => ads.filter((a) => a.status === "active").length, [ads]);

  const totalAdSpend = useMemo(() => ads.reduce((sum, a) => sum + a.spent, 0), [ads]);

  // ─── Revenue Metrics ───
  const mrr = monthlyRevenue;
  const quarterlyRevenue = mrr * 3;
  const annualRunRate = mrr * 12;
  const avgRevenuePerClient = activeClients > 0 ? Math.round(mrr / activeClients) : 0;

  // ─── Pipeline Health ───
  const totalLeads = leads.length;

  const conversionRate = useMemo(() => {
    const closedWon = leads.filter((l) => l.stage === "closed_won").length;
    const resolved = leads.filter((l) => l.stage === "closed_won" || l.stage === "closed_lost").length;
    return resolved > 0 ? Math.round((closedWon / resolved) * 100) : 0;
  }, [leads]);

  const avgDealSize = useMemo(() => {
    const wonLeads = leads.filter((l) => l.stage === "closed_won");
    if (wonLeads.length === 0) return 0;
    return Math.round(wonLeads.reduce((sum, l) => sum + l.estimatedRevenue, 0) / wonLeads.length);
  }, [leads]);

  const pipelineValue = useMemo(() => {
    return leads
      .filter((l) => l.stage !== "closed_won" && l.stage !== "closed_lost")
      .reduce((sum, l) => sum + l.estimatedRevenue, 0);
  }, [leads]);

  // ─── Lead Stage Breakdown ───
  const leadStages = useMemo(() => {
    const stages = ["lead", "call", "proposal", "follow_up", "closed_won", "closed_lost"] as const;
    const stageLabels: Record<string, string> = {
      lead: "New Lead",
      call: "Discovery Call",
      proposal: "Proposal",
      follow_up: "Follow Up",
      closed_won: "Closed Won",
      closed_lost: "Closed Lost",
    };
    const stageColors: Record<string, string> = {
      lead: LIGHT,
      call: SECONDARY,
      proposal: PRIMARY,
      follow_up: ACCENT_ORANGE,
      closed_won: ACCENT_GREEN,
      closed_lost: ACCENT_RED,
    };
    return stages.map((s) => ({
      key: s,
      label: stageLabels[s],
      count: leads.filter((l) => l.stage === s).length,
      color: stageColors[s],
    }));
  }, [leads]);

  // ─── Content Pipeline Chart Data ───
  const contentPipelineData = useMemo(() => {
    const statuses = ["draft", "optimized", "staged", "pending_approval", "approved", "published"] as const;
    const labels: Record<string, string> = {
      draft: "Drafts",
      optimized: "AI Optimized",
      staged: "Staged",
      pending_approval: "Reviewing",
      approved: "Approved",
      published: "Published",
    };
    return statuses.map((s) => ({
      name: labels[s],
      count: contents.filter((c) => c.status === s).length,
    }));
  }, [contents]);

  // ─── Team / Content Breakdown ───
  const teamData = useMemo(() => {
    const contentTypes = ["Blog", "Social", "EDM", "Graphic", "Adhoc"];
    return contentTypes.map((type) => {
      const typeContents = contents.filter((c) => c.type === type);
      const inProgress = typeContents.filter((c) => c.status !== "published").length;
      const completed = typeContents.filter((c) => c.status === "published").length;
      return { 
        type, 
        inProgress, 
        completed, 
        total: typeContents.length, 
      };
    }).filter(d => d.total > 0);
  }, [contents]);

  // ─── Bottlenecks ───
  const contentNotScheduledAhead = useMemo(() => {
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(today.getDate() + 7);
    return contents.filter((c) => {
      if (!c.scheduledDate) return false;
      const schedDate = new Date(c.scheduledDate);
      return schedDate < sevenDaysOut && c.status !== "approved" && c.status !== "published";
    });
  }, [contents, today]);

  // ─── Helpers ───
  const fmtCurrency = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
  };

  const alertBorderColor = (severity: "danger" | "warning" | "info") => {
    if (severity === "danger") return ACCENT_RED;
    if (severity === "warning") return ACCENT_ORANGE;
    return PRIMARY;
  };

  /* ─── Bottleneck alerts combined ─── */
  const bottleneckAlerts = useMemo(() => {
    const alerts: { key: string; severity: "danger" | "warning" | "info"; title: string; detail: string }[] = [];
    
    contentNotScheduledAhead.slice(0, 5).forEach((c) => {
      const daysOut = c.scheduledDate
        ? Math.ceil((new Date(c.scheduledDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      alerts.push({
        key: `ns-${c.id}`,
        severity: daysOut !== null && daysOut < 0 ? "danger" : "warning",
        title: `Content needs attention: ${c.title}`,
        detail: daysOut !== null ? `${daysOut} days until scheduled but not approved` : "No schedule date",
      });
    });
    
    return alerts;
  }, [contentNotScheduledAhead, today]);

  // ─── Table header cell style ───
  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 20px",
    fontWeight: 600,
    color: "#6B6B6B",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <div style={{ background: "transparent", minHeight: "100vh", padding: "0" }}>

      {/* ═══════════════ 1. Header Row ═══════════════ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sectionGap + 4 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", margin: 0, letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>Pipeline & Content ops</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Period selector */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "1px solid #E8E8E6",
              background: "#FFF", color: "#5B5FC7", fontSize: 13, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", appearance: "none",
              paddingRight: 28, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235B5FC7' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
            }}
          >
            <option value="month">This Month</option>
            <option value="week">This Week</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Btn onClick={() => {}} style={{ fontSize: 11, padding: "6px 12px" }}>Export Report</Btn>
        </div>
      </div>

      {/* ═══════════════ 2. Top Stats Row ═══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: sectionGap, marginBottom: sectionGap }}>
        {/* Active Clients */}
        <div className="glass" style={{ ...cardStyle, borderTop: `4px solid ${PRIMARY}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Active Clients</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div style={statValue}>{activeClients}</div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="glass" style={{ ...cardStyle, borderTop: `4px solid ${SECONDARY}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Monthly Revenue</div>
          <div style={{ ...statValue, marginTop: 8 }}>{fmtCurrency(monthlyRevenue)}</div>
        </div>

        {/* Content Scheduled This Week */}
        <div className="glass" style={{ ...cardStyle, borderTop: `4px solid ${LIGHT}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Content This Week</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={statValue}>{contentsThisWeek}</div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass" style={{ ...cardStyle, borderTop: `4px solid ${ACCENT_ORANGE}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Pending Approvals</div>
          <div style={{ ...statValue, marginTop: 8 }}>{pendingApprovals}</div>
        </div>
      </div>

      {/* ═══════════════ 3. Charts Row ═══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: sectionGap, marginBottom: sectionGap }}>
        {/* Content Pipeline Bar Chart */}
        <div className="glass" style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 20 }}>
            Content Pipeline
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={contentPipelineData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E6" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6B6B6B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B6B6B", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E8E6",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="count" fill={PRIMARY} radius={[6, 6, 0, 0]} name="Contents" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Health */}
        <div className="glass" style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 20 }}>
            Lead Pipeline Health
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {leadStages.map((stage) => {
              const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
              return (
                <div key={stage.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#1A1A1A" }}>{stage.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B" }}>{stage.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "#F0F0EE", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: 4,
                        background: stage.color,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ 4. Team Performance / Content Type ═══════════════ */}
      <div className="glass" style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: sectionGap }}>
        <div style={{ padding: "20px 24px 0", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
          Content Distribution
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #E8E8E6" }}>
              <th style={thStyle}>Type</th>
              <th style={{ ...thStyle, textAlign: "right" }}>In Progress</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Published</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((row, idx) => (
              <tr
                key={row.type}
                style={{ borderBottom: idx < teamData.length - 1 ? "1px solid #E8E8E6" : "none" }}
              >
                <td style={{ padding: "12px 20px" }}>
                  <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{row.type}</span>
                </td>
                <td style={{ textAlign: "right", padding: "12px 20px", color: "#1A1A1A" }}>
                  {row.inProgress}
                </td>
                <td style={{ textAlign: "right", padding: "12px 20px", color: "#1A1A1A" }}>
                  {row.completed}
                </td>
                <td style={{ textAlign: "right", padding: "12px 20px", fontWeight: 600 }}>
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══════════════ 5. Bottleneck Alerts ═══════════════ */}
      <div className="glass" style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
          Bottleneck Alerts (Content)
        </div>
        {bottleneckAlerts.length === 0 ? (
          <div style={{ padding: "20px 24px 24px", fontSize: 13, color: "#6B6B6B" }}>
            No bottlenecks detected -- all systems healthy
          </div>
        ) : (
          <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {bottleneckAlerts.map((alert) => (
              <div
                key={alert.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  background: "#FAFAFA",
                  borderRadius: 8,
                  borderLeft: `4px solid ${alertBorderColor(alert.severity)}`,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: alertBorderColor(alert.severity) + "18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={alertBorderColor(alert.severity)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{alert.title}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{alert.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
