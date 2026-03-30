export type ActivityEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: "created" | "updated" | "deleted" | "moved" | "approved" | "rejected";
  entity: "lead" | "client" | "video" | "campaign" | "document" | "user" | "onboarding";
  entityName: string;
  details?: string;
};

// In-memory log (will persist during session)
let activityLog: ActivityEntry[] = [];

export function logActivity(entry: Omit<ActivityEntry, "id" | "timestamp">) {
  activityLog = [{
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  }, ...activityLog].slice(0, 200); // Keep last 200 entries
}

export function getActivityLog(): ActivityEntry[] {
  return activityLog;
}

export function clearActivityLog() {
  activityLog = [];
}
