"use client";

import React from "react";

type NavItem = { id: string; label: string; group?: string };

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", group: "overview" },
  { id: "sales", label: "Sales", group: "pipeline" },
  { id: "onboarding", label: "Onboarding", group: "pipeline" },
  { id: "production", label: "Production", group: "operations" },
  { id: "approvals", label: "Approvals", group: "operations" },
  { id: "publishing", label: "Publishing", group: "operations" },
  { id: "editors", label: "Editors", group: "team" },
  { id: "ads", label: "Ads", group: "team" },
  { id: "knowledge", label: "Knowledge Base", group: "resources" },
];

export function Sidebar({
  currentPage, onNavigate, userName, approvalCount, onSignOut,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  userName: string;
  approvalCount?: number;
  onSignOut: () => void;
}) {
  return (
    <div style={{
      width: 220, background: "var(--bg-sub)", borderRight: "1px solid var(--border)",
      padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0,
      height: "100vh", position: "sticky", top: 0,
    }}>
      <div style={{ padding: "4px 10px", marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Agency OS</div>
        <div style={{ fontSize: 12, color: "var(--text-ter)", marginTop: 2 }}>{userName}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6,
              border: "none",
              background: currentPage === item.id ? "var(--bg-hover)" : "transparent",
              color: currentPage === item.id ? "var(--text)" : "var(--text-sec)",
              cursor: "pointer", fontSize: 13,
              fontWeight: currentPage === item.id ? 600 : 400,
              transition: "background 0.1s",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span>{item.label}</span>
            {item.id === "approvals" && approvalCount !== undefined && approvalCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, background: "var(--text)", color: "#FFF",
                borderRadius: 10, padding: "1px 7px", minWidth: 18, textAlign: "center",
              }}>
                {approvalCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onSignOut}
        style={{
          width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6,
          border: "none", background: "transparent", color: "var(--text-ter)",
          cursor: "pointer", fontSize: 12, marginTop: 8,
        }}
      >
        Sign out
      </button>
    </div>
  );
}
