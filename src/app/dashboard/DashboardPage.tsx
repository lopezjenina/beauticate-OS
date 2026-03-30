"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Client, Video, Lead, AdCampaign } from "@/lib/types";
import { TEAM, EDITORS, WEEKLY_TARGET, INIT_CLIENTS, INIT_VIDEOS, INIT_LEADS, INIT_ADS } from "@/lib/store";
import { Avatar, Badge, Btn, Stat, PageHeader, ProgressBar, EmptyState } from "@/components/ui";
import { exportClients, exportLeads, exportVideos, exportCampaigns } from "@/lib/exportCsv";

interface DashboardPageProps {
  clients?: Client[];
  videos?: Video[];
  leads?: Lead[];
  ads?: AdCampaign[];
}

/* ─── Design Tokens ─── */
const PRIMARY = "#5B5FC7";
const SECONDARY = "#8B8FD6";
const LIGHT = "#C5C7F2";
const ACCENT_GREEN = "#22C55E";
const ACCENT_ORANGE = "#F59E0B";
const ACCENT_RED = "#EF4444";

const cardStyle: React.CSSProperties = {
  background: "#FFF",
  border: "1px solid #E8E8E6",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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

const sectionGap = 20;

export default function DashboardPage({
  clients = INIT_CLIENTS,
  videos = INIT_VIDEOS,
  leads = INIT_LEADS,
  ads = INIT_ADS,
}: DashboardPageProps) {
  const today = new Date("2026-03-30");

  // ─── Core Stats ───
  const activeClients = useMemo(() => clients.filter((c) => c.status === "active").length, [clients]);

  const monthlyRevenue = useMemo(
    () => clients.reduce((sum, c) => sum + (c.status === "active" ? c.monthlyRevenue : 0), 0),
    [clients]
  );

  const videosThisWeek = useMemo(
    () => videos.filter((v) => {
      const shootDate = new Date(v.shootDate);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return shootDate >= weekStart && shootDate <= weekEnd;
    }).length,
    [videos, today]
  );

  const editorCapacity = useMemo(() => {
    const assigned = videos.filter((v) => v.editingStatus !== "approved").length;
    const totalCap = EDITORS.reduce((sum, e) => sum + e.weeklyVideoCap, 0);
    return Math.round((assigned / totalCap) * 100);
  }, [videos]);

  const contentPendingApproval = useMemo(
    () => videos.filter((v) => v.editingStatus === "delivered").length,
    [videos]
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

  // ─── Content Velocity ───
  const videosCompletedThisMonth = useMemo(
    () => videos.filter((v) => v.editingStatus === "approved" || v.posted).length,
    [videos]
  );

  const videosInProgress = useMemo(
    () => videos.filter((v) => v.editingStatus === "editing" || v.editingStatus === "delivered").length,
    [videos]
  );

  const revisionRate = useMemo(() => {
    if (videos.length === 0) return 0;
    const withRevisions = videos.filter((v) => v.revisionsUsed > 0).length;
    return Math.round((withRevisions / videos.length) * 100);
  }, [videos]);

  // ─── Content Pipeline Chart Data ───
  const contentPipelineData = useMemo(() => {
    const statuses = ["not_started", "editing", "delivered", "revision", "approved"] as const;
    const labels: Record<string, string> = {
      not_started: "Not Started",
      editing: "Editing",
      delivered: "Delivered",
      revision: "Revision",
      approved: "Approved",
    };
    return statuses.map((s) => ({
      name: labels[s],
      count: videos.filter((v) => v.editingStatus === s).length,
    }));
  }, [videos]);

  // ─── Team Performance ───
  const teamData = useMemo(() => {
    return EDITORS.map((editor) => {
      const editorVideos = videos.filter((v) => v.editorId === editor.id);
      const assigned = editorVideos.filter((v) => v.editingStatus !== "approved").length;
      const completed = editorVideos.filter((v) => v.editingStatus === "approved").length;
      const capacityPct = editor.weeklyVideoCap > 0
        ? Math.round((assigned / editor.weeklyVideoCap) * 100)
        : 0;
      return { editor, assigned, completed, total: editorVideos.length, capacityPct };
    });
  }, [videos]);

  // ─── Bottlenecks ───
  const editorsOverCapacity = useMemo(() => {
    return EDITORS.map((editor) => {
      const assigned = videos.filter(
        (v) => v.editorId === editor.id && v.editingStatus !== "approved"
      ).length;
      return {
        editor,
        assigned,
        isCapped: assigned > editor.weeklyVideoCap,
      };
    }).filter((e) => e.isCapped);
  }, [videos]);

  const contentNotScheduledAhead = useMemo(() => {
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(today.getDate() + 7);
    return videos.filter((v) => {
      if (!v.scheduledDate) return false;
      const schedDate = new Date(v.scheduledDate);
      return schedDate < sevenDaysOut && v.editingStatus !== "approved";
    });
  }, [videos, today]);

  const clientsStuckSameStage = useMemo(() => {
    const threshold = new Date(today);
    threshold.setDate(today.getDate() - 14);
    return clients.filter((c) => {
      const clientVideos = videos.filter((v) => v.clientId === c.id);
      const allApproved = clientVideos.every((v) => v.editingStatus === "approved");
      const allSameStage = clientVideos.length > 0 && clientVideos.every((v) => v.editingStatus === clientVideos[0].editingStatus);
      return allSameStage && !allApproved;
    });
  }, [clients, videos]);

  // ─── Editor Chart Data ───
  const chartData = useMemo(() => {
    return EDITORS.map((editor) => {
      const assigned = videos.filter(
        (v) => v.editorId === editor.id && v.editingStatus !== "approved"
      ).length;
      const completed = videos.filter(
        (v) => v.editorId === editor.id && v.editingStatus === "approved"
      ).length;
      return {
        name: editor.initials,
        assigned,
        completed,
      };
    });
  }, [videos]);

  // ─── Helpers ───
  const fmtCurrency = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
  };

  const weeklyPct = WEEKLY_TARGET > 0 ? Math.min(Math.round((videosThisWeek / WEEKLY_TARGET) * 100), 100) : 0;

  const capacityDotColor = (pct: number) => {
    if (pct > 100) return ACCENT_RED;
    if (pct > 80) return ACCENT_ORANGE;
    return ACCENT_GREEN;
  };

  const alertBorderColor = (severity: "danger" | "warning" | "info") => {
    if (severity === "danger") return ACCENT_RED;
    if (severity === "warning") return ACCENT_ORANGE;
    return PRIMARY;
  };

  /* ─── Progress Ring SVG ─── */
  const ProgressRing = ({ pct, size = 48 }: { pct: number; size?: number }) => {
    const stroke = 4;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E8E6" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={PRIMARY}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  /* ─── Bottleneck alerts combined ─── */
  const bottleneckAlerts = useMemo(() => {
    const alerts: { key: string; severity: "danger" | "warning" | "info"; title: string; detail: string }[] = [];
    editorsOverCapacity.forEach((item) => {
      alerts.push({
        key: `oc-${item.editor.id}`,
        severity: "danger",
        title: `${item.editor.name} over capacity`,
        detail: `${item.assigned}/${item.editor.weeklyVideoCap} videos assigned`,
      });
    });
    contentNotScheduledAhead.slice(0, 5).forEach((v) => {
      const client = clients.find((c) => c.id === v.clientId);
      const daysOut = v.scheduledDate
        ? Math.ceil((new Date(v.scheduledDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      alerts.push({
        key: `ns-${v.id}`,
        severity: daysOut !== null && daysOut < 0 ? "danger" : "warning",
        title: `Content not ready: ${client?.name || "Unknown"}`,
        detail: daysOut !== null ? `${daysOut} days until scheduled` : "No schedule date",
      });
    });
    clientsStuckSameStage.forEach((c) => {
      const clientVideos = videos.filter((vv) => vv.clientId === c.id);
      const stage = clientVideos[0]?.editingStatus || "unknown";
      alerts.push({
        key: `stuck-${c.id}`,
        severity: "warning",
        title: `${c.name} stuck in stage`,
        detail: `All videos at "${stage}"`,
      });
    });
    return alerts;
  }, [editorsOverCapacity, contentNotScheduledAhead, clientsStuckSameStage, clients, videos, today]);

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
    <div style={{ background: "#F8F8FA", minHeight: "100vh", padding: "40px 48px" }}>

      {/* ═══════════════ 1. Header Row ═══════════════ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sectionGap + 4 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", margin: 0, letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#6B6B6B", margin: "4px 0 0" }}>Agency operations at a glance</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Period selector (visual) */}
          <div
            style={{
              ...cardStyle,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: PRIMARY,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "default",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            This Month
          </div>
          <Btn onClick={() => exportClients(clients)} style={{ fontSize: 11, padding: "6px 12px" }}>Export Clients</Btn>
          <Btn onClick={() => exportLeads(leads)} style={{ fontSize: 11, padding: "6px 12px" }}>Export Leads</Btn>
          <Btn onClick={() => exportVideos(videos)} style={{ fontSize: 11, padding: "6px 12px" }}>Export Videos</Btn>
          <Btn onClick={() => exportCampaigns(ads)} style={{ fontSize: 11, padding: "6px 12px" }}>Export Ads</Btn>
        </div>
      </div>

      {/* ═══════════════ 2. Top Stats Row ═══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: sectionGap, marginBottom: sectionGap }}>
        {/* Active Clients */}
        <div style={{ ...cardStyle, borderTop: `4px solid ${PRIMARY}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Active Clients</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div style={statValue}>{activeClients}</div>
            {activeClients > 0 && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT_GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            )}
          </div>
        </div>

        {/* Monthly Revenue */}
        <div style={{ ...cardStyle, borderTop: `4px solid ${SECONDARY}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Monthly Revenue</div>
          <div style={{ ...statValue, marginTop: 8 }}>{fmtCurrency(monthlyRevenue)}</div>
        </div>

        {/* Videos This Week */}
        <div style={{ ...cardStyle, borderTop: `4px solid ${LIGHT}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Videos This Week</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <div style={statValue}>{videosThisWeek}</div>
            <div style={{ position: "relative", width: 48, height: 48 }}>
              <ProgressRing pct={weeklyPct} size={48} />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: PRIMARY,
                }}
              >
                {weeklyPct}%
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>of {WEEKLY_TARGET} target</div>
        </div>

        {/* Ad Spend */}
        <div style={{ ...cardStyle, borderTop: `4px solid ${ACCENT_ORANGE}`, padding: "20px 24px 24px" }}>
          <div style={statLabel}>Ad Spend</div>
          <div style={{ ...statValue, marginTop: 8 }}>{fmtCurrency(totalAdSpend)}</div>
          <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{activeAds} active campaigns</div>
        </div>
      </div>

      {/* ═══════════════ 3. Charts Row ═══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: sectionGap, marginBottom: sectionGap }}>
        {/* Content Pipeline Bar Chart */}
        <div style={cardStyle}>
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
              <Bar dataKey="count" fill={PRIMARY} radius={[6, 6, 0, 0]} name="Videos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Health */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 20 }}>
            Pipeline Health
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
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #E8E8E6", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 500 }}>Conversion</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: PRIMARY }}>{conversionRate}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 500 }}>Pipeline Value</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A" }}>{fmtCurrency(pipelineValue)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6B6B6B", fontWeight: 500 }}>Avg Deal</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A" }}>{fmtCurrency(avgDealSize)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ 4. Revenue Row ═══════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: sectionGap, marginBottom: sectionGap }}>
        {[
          { label: "Monthly Recurring Revenue", value: fmtCurrency(mrr) },
          { label: "Quarterly Revenue", value: fmtCurrency(quarterlyRevenue) },
          { label: "Annual Run Rate", value: fmtCurrency(annualRunRate) },
          { label: "Avg Revenue / Client", value: fmtCurrency(avgRevenuePerClient) },
        ].map((item) => (
          <div key={item.label} style={cardStyle}>
            <div style={statLabel}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", marginTop: 8, letterSpacing: "-0.02em" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════ 5. Team Performance ═══════════════ */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: sectionGap }}>
        <div style={{ padding: "20px 24px 0", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
          Team Performance
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #E8E8E6" }}>
              <th style={thStyle}>Editor</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Assigned</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Completed</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Capacity</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((row, idx) => (
              <tr
                key={row.editor.id}
                style={{ borderBottom: idx < teamData.length - 1 ? "1px solid #E8E8E6" : "none" }}
              >
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Capacity dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: capacityDotColor(row.capacityPct),
                        flexShrink: 0,
                      }}
                    />
                    <Avatar initials={row.editor.initials} size={28} />
                    <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{row.editor.name}</span>
                  </div>
                </td>
                <td style={{ textAlign: "right", padding: "12px 20px", color: "#1A1A1A" }}>
                  {row.assigned}
                </td>
                <td style={{ textAlign: "right", padding: "12px 20px", color: "#1A1A1A" }}>
                  {row.completed}
                </td>
                <td style={{ textAlign: "right", padding: "12px 20px" }}>
                  <Badge variant={row.capacityPct > 100 ? "danger" : row.capacityPct > 80 ? "warning" : "default"}>
                    {row.capacityPct}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══════════════ 6. Bottleneck Alerts ═══════════════ */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
          Bottleneck Alerts
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
