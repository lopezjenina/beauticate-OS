'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Badge, FilterPills } from '@/components/ui';
import { getActivityLog, ActivityEntry } from '@/lib/activityLog';

export default function ActivityPage() {
  const [log, setLog] = useState<ActivityEntry[]>(() => getActivityLog());
  const [filterEntity, setFilterEntity] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setLog(getActivityLog()), 2000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filterEntity ? log.filter(e => e.entity === filterEntity) : log;

  const entityFilters = [
    { label: "All", value: null },
    { label: "Leads", value: "lead" },
    { label: "Videos", value: "video" },
    { label: "Campaigns", value: "campaign" },
    { label: "Documents", value: "document" },
    { label: "Users", value: "user" },
    { label: "Onboarding", value: "onboarding" },
  ];

  const getActionColor = (action: string) => {
    switch(action) {
      case "created": return "success";
      case "updated": return "active";
      case "deleted": return "danger";
      case "moved": return "warning";
      case "approved": return "success";
      case "rejected": return "danger";
      default: return "default";
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader title="Activity Log" subtitle="Track all changes across the workspace" />

      <FilterPills options={entityFilters} value={filterEntity} onChange={setFilterEntity} />

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9B9B9B", fontSize: 14 }}>
          No activity recorded yet. Actions will appear here as you use the app.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filtered.map((entry) => (
            <div key={entry.id} style={{
              display: "flex", alignItems: "center", gap: 16, padding: "12px 0",
              borderBottom: "1px solid #EBEBEA",
            }}>
              <div style={{ width: 70, fontSize: 11, color: "#9B9B9B", flexShrink: 0 }}>
                {formatTime(entry.timestamp)}
              </div>
              <Badge variant={getActionColor(entry.action)}>
                {entry.action}
              </Badge>
              <div style={{ flex: 1, fontSize: 13, color: "#1A1A1A" }}>
                <span style={{ fontWeight: 500 }}>{entry.user}</span>
                {" "}{entry.action}{" "}
                <span style={{ color: "#6B6B6B" }}>{entry.entity}</span>
                {" "}<span style={{ fontWeight: 500 }}>"{entry.entityName}"</span>
                {entry.details && (
                  <span style={{ color: "#9B9B9B", marginLeft: 4 }}>— {entry.details}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
