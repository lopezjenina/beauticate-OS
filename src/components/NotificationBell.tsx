'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Video, Lead } from '@/lib/types';

interface NotificationBellProps {
  videos: Video[];
  leads: Lead[];
}

export type Notification = {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
};

export function NotificationBell({ videos, leads }: NotificationBellProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];

    // Videos awaiting approval
    const awaitingApproval = videos.filter(v => v.editingStatus === "delivered").length;
    if (awaitingApproval > 0) {
      notifs.push({ id: "n1", type: "warning", message: `${awaitingApproval} video${awaitingApproval > 1 ? "s" : ""} awaiting approval` });
    }

    // Videos in revision
    const inRevision = videos.filter(v => v.editingStatus === "revision").length;
    if (inRevision > 0) {
      notifs.push({ id: "n2", type: "warning", message: `${inRevision} video${inRevision > 1 ? "s" : ""} need revision` });
    }

    // Overdue videos (due date passed, not approved/posted)
    const today = new Date().toISOString().split("T")[0];
    const overdue = videos.filter(v => v.dueDate < today && v.editingStatus !== "approved" && !v.posted).length;
    if (overdue > 0) {
      notifs.push({ id: "n3", type: "warning", message: `${overdue} overdue video${overdue > 1 ? "s" : ""}` });
    }

    // Videos not started with footage not uploaded
    const noFootage = videos.filter(v => v.editingStatus === "not_started" && !v.footageUploaded).length;
    if (noFootage > 0) {
      notifs.push({ id: "n4", type: "info", message: `${noFootage} video${noFootage > 1 ? "s" : ""} missing footage` });
    }

    // New leads in pipeline
    const newLeads = leads.filter(l => l.stage === "lead").length;
    if (newLeads > 0) {
      notifs.push({ id: "n5", type: "info", message: `${newLeads} new lead${newLeads > 1 ? "s" : ""} to follow up` });
    }

    // Approved but not scheduled
    const notScheduled = videos.filter(v => v.editingStatus === "approved" && v.sentToGuido && !v.scheduledDate).length;
    if (notScheduled > 0) {
      notifs.push({ id: "n6", type: "info", message: `${notScheduled} approved video${notScheduled > 1 ? "s" : ""} not yet scheduled` });
    }

    return notifs;
  }, [videos, leads]);

  const typeColors: Record<string, string> = {
    warning: "#CB7F2C",
    info: "#2383E2",
    success: "#4DAB9A",
  };

  const typeBg: Record<string, string> = {
    warning: "#FDF3E7",
    info: "#E8F0FE",
    success: "#EAF5F2",
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6,
          border: "none", background: showDropdown ? "var(--bg-hover)" : "transparent",
          color: "var(--text-sec)", cursor: "pointer", fontSize: 13,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontFamily: "inherit",
        }}
      >
        <span>Notifications</span>
        {notifications.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, background: "#EB5757", color: "#FFF",
            borderRadius: 10, padding: "1px 7px", minWidth: 18, textAlign: "center",
          }}>
            {notifications.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: "absolute", left: "100%", top: 0, marginLeft: 8,
          width: 320, background: "#FFF", border: "1px solid #E3E3E0",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 100, maxHeight: 400, overflow: "auto",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E3E3E0", fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Notifications ({notifications.length})</span>
            <button onClick={() => { setShowDropdown(false); }} style={{ border: "none", background: "transparent", color: "var(--accent)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Dismiss all</button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9B9B9B" }}>
              All caught up!
            </div>
          ) : (
            notifications.map(n => (
              <button key={n.id} style={{
                padding: "10px 16px", borderBottom: "1px solid #EBEBEA",
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", border: "none", background: "transparent",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F7F5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: typeColors[n.type],
                }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{n.message}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
