"use client";

import React, { useState } from "react";
import { isSuperAdmin } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import type { Video, Lead, Client, AdCampaign } from "@/lib/types";

type NavItem = { id: string; label: string; group?: string };

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", group: "overview" },
  { id: "calendar", label: "Calendar", group: "overview" },
  { id: "sales", label: "Sales", group: "pipeline" },
  { id: "onboarding", label: "Onboarding", group: "pipeline" },
  { id: "clients", label: "Clients", group: "pipeline" },
  { id: "production", label: "Production", group: "operations" },
  { id: "approvals", label: "Approvals", group: "operations" },
  { id: "publishing", label: "Publishing", group: "operations" },
  { id: "editors", label: "Editors", group: "team" },
  { id: "ads", label: "Ads", group: "team" },
  { id: "packages", label: "Packages", group: "resources" },
  { id: "knowledge", label: "Knowledge Base", group: "resources" },
  { id: "activity", label: "Activity Log", group: "resources" },
];

const ICONS: Record<string, string> = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  sales: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  onboarding: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  clients: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  production: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  approvals: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  publishing: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
  editors: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  ads: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z",
  packages: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  knowledge: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  activity: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  notifications: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
};

function NavIcon({ path }: { path: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({
  currentPage, onNavigate, userName, userRole, approvalCount, onSignOut,
  videos = [], leads = [], clients = [], ads = [], permissions, users = [],
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  userName: string;
  userRole?: string;
  approvalCount?: number;
  onSignOut: () => void;
  videos?: Video[];
  leads?: Lead[];
  clients?: Client[];
  ads?: AdCampaign[];
  permissions?: Record<string, boolean>;
  users?: any[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  const hasEditors = users.some(u => u.role === "editor" || u.role === "videographer");
  
  const filteredNav = permissions
    ? NAV.filter(item => permissions[item.id] !== false)
    : NAV;

  const finalNav = hasEditors 
    ? filteredNav 
    : filteredNav.filter(item => item.id !== "editors");

  const navItems = isSuperAdmin(userName, users)
    ? [...finalNav, { id: "users", label: "Users", group: "admin" }]
    : finalNav;

  return (
    <div 
      className="glass"
      style={{
        width: collapsed ? 88 : 280,
        borderRight: "1px solid var(--border)",
        padding: collapsed ? "24px 12px" : "32px 20px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      {/* Branding */}
      <div style={{ padding: collapsed ? "4px 0" : "4px 10px", marginBottom: 32, textAlign: collapsed ? "center" : "left", display: "flex", alignItems: "center", gap: 12 }}>
        {collapsed ? (
          <div style={{
            fontSize: 14, fontWeight: 700, width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent), #818CF8)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
          }}>
            {getInitials(userName)}
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 14, fontWeight: 700, width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, var(--accent), #5AC8FA)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 8px 16px rgba(0, 122, 255, 0.2)"
            }}>
              {getInitials(userName)}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>Beauticate</div>
              <div style={{ fontSize: 13, color: "var(--text-ter)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                {userName}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Global Search */}
      {!collapsed && (
        <div style={{ padding: "0 4px", marginBottom: 20 }}>
          <GlobalSearch clients={clients} videos={videos} leads={leads} ads={ads} onNavigate={onNavigate} />
        </div>
      )}

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
            style={{
              width: "100%",
              textAlign: "left",
              padding: collapsed ? "12px 0" : "10px 14px",
              borderRadius: 10,
              border: "none",
              background: currentPage === item.id ? "var(--bg-glass)" : "transparent",
              color: currentPage === item.id ? "var(--accent)" : "var(--text-sec)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: currentPage === item.id ? 600 : 500,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              justifyContent: collapsed ? "center" : "flex-start",
              alignItems: "center",
              gap: 12,
              boxShadow: currentPage === item.id ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
              border: currentPage === item.id ? "1px solid var(--border-light)" : "1px solid transparent",
            }}
          >
            {ICONS[item.id] && <NavIcon path={ICONS[item.id]} />}
            {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
            {!collapsed && item.id === "approvals" && approvalCount !== undefined && approvalCount > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600, background: "var(--accent)", color: "#FFF",
                borderRadius: 12, padding: "2px 8px", minWidth: 24, textAlign: "center",
              }}>
                {approvalCount}
              </span>
            )}
            {collapsed && item.id === "approvals" && approvalCount !== undefined && approvalCount > 0 && (
              <span style={{
                position: "absolute", top: 2, right: 2,
                fontSize: 9, fontWeight: 700, background: "var(--text)", color: "#FFF",
                borderRadius: 10, padding: "0 4px", minWidth: 14, textAlign: "center",
                lineHeight: "14px",
              }}>
                {approvalCount}
              </span>
            )}
          </button>
        ))}

        {/* Notification Bell */}
        {!collapsed && (
          <NotificationBell videos={videos} leads={leads} onNavigate={onNavigate} />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: "100%", textAlign: "center", padding: "8px 10px", borderRadius: 6,
          border: "none", background: "transparent", color: "var(--text-ter)",
          cursor: "pointer", fontSize: 14, marginTop: 4,
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "\u00BB" : "\u00AB"}
      </button>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        title={collapsed ? "Sign out" : undefined}
        style={{
          width: "100%",
          textAlign: collapsed ? "center" : "left",
          padding: "8px 10px",
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "var(--text-ter)",
          cursor: "pointer",
          fontSize: 12,
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: collapsed ? 0 : 6, flexShrink: 0 }}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        {!collapsed && "Sign out"}
      </button>
    </div>
  );
}
