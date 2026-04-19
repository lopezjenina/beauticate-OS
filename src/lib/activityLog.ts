import { logActivityToDb } from "./db";

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
  const newEntry = {
    ...entry,
    id: `log-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
  };
  activityLog = [newEntry, ...activityLog].slice(0, 200); // Keep last 200 entries
  
  // Persist to DB in the background
  logActivityToDb(entry).catch((err) => console.error("Failed to log activity:", err));
}

export function getActivityLog(): ActivityEntry[] {
  return activityLog;
}

export function clearActivityLog() {
  activityLog = [];
}
