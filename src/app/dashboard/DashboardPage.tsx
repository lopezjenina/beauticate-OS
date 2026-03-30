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

export default function DashboardPage({
  clients = INIT_CLIENTS,
  videos = INIT_VIDEOS,
  leads = INIT_LEADS,
  ads = INIT_ADS,
}: DashboardPageProps) {
  const today = new Date("2026-03-30");

  // Calculate stats
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

  // Bottlenecks
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

  // Chart data
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

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", padding: "56px" }}>
      <PageHeader
        title="Executive Dashboard"
        subtitle="At a glance view of agency operations"
      />

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "40px",
          marginBottom: "64px",
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

      {/* Bottlenecks Section */}
      <div style={{ marginBottom: "64px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1A1A1A", margin: "0 0 32px", letterSpacing: "-0.01em" }}>
          Bottlenecks
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px" }}>
          {/* Editors Over Capacity */}
          <div style={{ padding: "28px", background: "#F7F7F5", borderRadius: "8px", border: "1px solid #E3E3E0" }}>
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
          <div style={{ padding: "28px", background: "#F7F7F5", borderRadius: "8px", border: "1px solid #E3E3E0" }}>
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
          <div style={{ padding: "28px", background: "#F7F7F5", borderRadius: "8px", border: "1px solid #E3E3E0" }}>
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

      {/* Videos Per Editor Chart */}
      <div style={{ padding: "40px", background: "#F7F7F5", borderRadius: "8px", border: "1px solid #E3E3E0" }}>
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
