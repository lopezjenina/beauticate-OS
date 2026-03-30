"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Client, Video, Lead, AdCampaign } from "@/lib/types";
import { TEAM, EDITORS, WEEKLY_TARGET, INIT_CLIENTS, INIT_VIDEOS, INIT_LEADS, INIT_ADS } from "@/lib/store";
import { Avatar, Badge, Btn, Stat, PageHeader, ProgressBar, EmptyState } from "@/components/ui";

interface DashboardPageProps {
  clients?: Client[];
  videos?: Video[];
  leads?: Lead[];
  ads?: AdCampaign[];
}

const sectionHeader: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text)",
  marginBottom: 16,
  marginTop: 32,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border)",
};

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

  // ─── Chart Data ───
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

  const secondaryStat: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const secondaryLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const secondaryValue: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: "#1A1A1A",
    letterSpacing: "-0.01em",
  };

  const cardStyle: React.CSSProperties = {
    padding: "28px",
    background: "#F7F7F5",
    borderRadius: "8px",
    border: "1px solid #E3E3E0",
  };

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", padding: "56px" }}>
      <PageHeader
        title="Executive Dashboard"
        subtitle="At a glance view of agency operations"
      />

      {/* ─── Main Stats Grid ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "40px",
          marginBottom: "24px",
          borderBottom: "1px solid #E3E3E0",
          paddingBottom: "40px",
        }}
      >
        <Stat label="Total Active Clients" value={activeClients} />
        <Stat label="Monthly Revenue" value={`$${(monthlyRevenue / 1000).toFixed(1)}K`} />
        <Stat label="Videos This Week" value={videosThisWeek} />
        <Stat label="Editor Capacity" value={`${editorCapacity}%`} sub={`${WEEKLY_TARGET} target`} />
        <Stat label="Content Pending Approval" value={contentPendingApproval} />
        <Stat label="Ads Active" value={activeAds} />
      </div>

      {/* ═══════════════ Revenue ═══════════════ */}
      <div style={sectionHeader}>Revenue</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
          marginBottom: "8px",
        }}
      >
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Monthly Recurring Revenue</div>
          <div style={secondaryValue}>{fmtCurrency(mrr)}</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Quarterly Revenue</div>
          <div style={secondaryValue}>{fmtCurrency(quarterlyRevenue)}</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Annual Run Rate</div>
          <div style={secondaryValue}>{fmtCurrency(annualRunRate)}</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Avg Revenue / Client</div>
          <div style={secondaryValue}>{fmtCurrency(avgRevenuePerClient)}</div>
        </div>
      </div>

      {/* ═══════════════ Pipeline Health ═══════════════ */}
      <div style={sectionHeader}>Pipeline</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
          marginBottom: "8px",
        }}
      >
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Total Leads</div>
          <div style={secondaryValue}>{totalLeads}</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Conversion Rate</div>
          <div style={secondaryValue}>{conversionRate}%</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Avg Deal Size</div>
          <div style={secondaryValue}>{fmtCurrency(avgDealSize)}</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Pipeline Value</div>
          <div style={secondaryValue}>{fmtCurrency(pipelineValue)}</div>
        </div>
      </div>

      {/* ═══════════════ Content Velocity ═══════════════ */}
      <div style={sectionHeader}>Content</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "32px",
          marginBottom: "8px",
        }}
      >
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Videos Completed This Month</div>
          <div style={secondaryValue}>{videosCompletedThisMonth}</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Videos In Progress</div>
          <div style={secondaryValue}>{videosInProgress}</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Avg Turnaround</div>
          <div style={secondaryValue}>4.2 days</div>
        </div>
        <div style={secondaryStat}>
          <div style={secondaryLabel}>Revision Rate</div>
          <div style={secondaryValue}>{revisionRate}%</div>
        </div>
      </div>

      {/* ═══════════════ Team Performance ═══════════════ */}
      <div style={sectionHeader}>Team</div>
      <div
        style={{
          ...cardStyle,
          padding: 0,
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#F7F7F5",
                borderBottom: "1px solid #E3E3E0",
              }}
            >
              <th style={{ textAlign: "left", padding: "12px 20px", fontWeight: 600, color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Editor
              </th>
              <th style={{ textAlign: "right", padding: "12px 20px", fontWeight: 600, color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Assigned
              </th>
              <th style={{ textAlign: "right", padding: "12px 20px", fontWeight: 600, color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Completed
              </th>
              <th style={{ textAlign: "right", padding: "12px 20px", fontWeight: 600, color: "#6B6B6B", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Capacity
              </th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((row, idx) => (
              <tr
                key={row.editor.id}
                style={{
                  borderBottom: idx < teamData.length - 1 ? "1px solid #E3E3E0" : "none",
                }}
              >
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

      {/* ═══════════════ Bottlenecks ═══════════════ */}
      <div style={sectionHeader}>Bottlenecks</div>
      <div style={{ marginBottom: "48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px" }}>
          {/* Editors Over Capacity */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: "20px" }}>
              Editors Over Capacity
            </div>
            {editorsOverCapacity.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6B6B6B" }}>All editors within capacity</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {editorsOverCapacity.map((item) => (
                  <div key={item.editor.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Avatar initials={item.editor.initials} size={28} />
                      <div style={{ fontSize: 13, color: "#1A1A1A" }}>{item.editor.name}</div>
                    </div>
                    <Badge variant="danger">
                      {item.assigned}/{item.editor.weeklyVideoCap}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Not 7 Days Ahead */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: "20px" }}>
              Content Not 7 Days Ahead
            </div>
            {contentNotScheduledAhead.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6B6B6B" }}>All content scheduled properly</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {contentNotScheduledAhead.slice(0, 5).map((v) => {
                  const client = clients.find((c) => c.id === v.clientId);
                  const daysOut = v.scheduledDate
                    ? Math.ceil(
                        (new Date(v.scheduledDate).getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;
                  return (
                    <div key={v.id} style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 12, color: "#1A1A1A" }}>{client?.name}</div>
                      <Badge variant={daysOut !== null && daysOut < 0 ? "danger" : "warning"}>
                        {daysOut} days
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clients Stuck in Same Stage */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: "20px" }}>
              Clients Stuck in Same Stage
            </div>
            {clientsStuckSameStage.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6B6B6B" }}>All clients progressing</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {clientsStuckSameStage.map((c) => {
                  const clientVideos = videos.filter((v) => v.clientId === c.id);
                  const stage = clientVideos[0]?.editingStatus || "unknown";
                  return (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Avatar initials={c.initials} size={28} />
                        <div style={{ fontSize: 13, color: "#1A1A1A" }}>{c.name}</div>
                      </div>
                      <Badge variant="warning">{stage}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ Videos Per Editor Chart ═══════════════ */}
      <div style={{ ...cardStyle, padding: "40px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: "28px" }}>
          Videos Per Editor
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E3E0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#6B6B6B", fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: "#6B6B6B", fontSize: 12 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E3E3E0",
                borderRadius: "6px",
                fontSize: 12,
              }}
            />
            <Bar dataKey="assigned" fill="#CB7F2C" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#4DAB9A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
