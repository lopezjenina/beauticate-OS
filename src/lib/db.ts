import { supabase } from "./supabase";
import {
  Client,
  Video,
  Note,
  Lead,
  OnboardingClient,
  AdCampaign,
  KBDoc,
} from "./types";
import { AppUser } from "./auth";
import { ActivityEntry } from "./activityLog";

/* ─── Key-case helpers ─── */

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[camelToSnake(key)] = obj[key];
  }
  return result;
}

export function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[snakeToCamel(key)] = obj[key];
  }
  return result;
}

/* ─── Service Package type (used by Packages board) ─── */

export type ServicePackage = {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  active: boolean;
};

/* ═══════════════════════════════════════════════════════
   CLIENTS
   ═══════════════════════════════════════════════════════ */

export async function fetchClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase.from("clients").select("*");
    if (error) { console.error("fetchClients error:", error); return []; }
    return (data || []).map((row) => toCamelCase(row as Record<string, unknown>) as unknown as Client);
  } catch (err) { console.error("fetchClients exception:", err); return []; }
}

export async function upsertClient(client: Client): Promise<void> {
  try {
    const row = toSnakeCase(client as unknown as Record<string, unknown>);
    const { error } = await supabase.from("clients").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertClient error:", error);
  } catch (err) { console.error("upsertClient exception:", err); }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) console.error("deleteClient error:", error);
  } catch (err) { console.error("deleteClient exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   VIDEOS
   ═══════════════════════════════════════════════════════ */

function videoFromRow(row: Record<string, unknown>): Video {
  const camel = toCamelCase(row) as Record<string, unknown>;
  // notes is stored as JSONB — parse if it arrives as a string
  if (typeof camel.notes === "string") {
    try { camel.notes = JSON.parse(camel.notes as string); } catch { camel.notes = []; }
  }
  if (!Array.isArray(camel.notes)) camel.notes = [];
  return camel as unknown as Video;
}

function videoToRow(video: Video): Record<string, unknown> {
  const row = toSnakeCase(video as unknown as Record<string, unknown>);
  // notes array -> JSONB
  if (row.notes !== undefined) {
    row.notes = JSON.stringify(row.notes);
  }
  return row;
}

export async function fetchVideos(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from("videos").select("*");
    if (error) { console.error("fetchVideos error:", error); return []; }
    return (data || []).map((row) => videoFromRow(row as Record<string, unknown>));
  } catch (err) { console.error("fetchVideos exception:", err); return []; }
}

export async function upsertVideo(video: Video): Promise<void> {
  try {
    const row = videoToRow(video);
    const { error } = await supabase.from("videos").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertVideo error:", error);
  } catch (err) { console.error("upsertVideo exception:", err); }
}

export async function deleteVideo(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) console.error("deleteVideo error:", error);
  } catch (err) { console.error("deleteVideo exception:", err); }
}

export async function updateVideoField(id: string, field: string, value: unknown): Promise<void> {
  try {
    const snakeField = camelToSnake(field);
    const dbValue = field === "notes" ? JSON.stringify(value) : value;
    const { error } = await supabase.from("videos").update({ [snakeField]: dbValue }).eq("id", id);
    if (error) console.error("updateVideoField error:", error);
  } catch (err) { console.error("updateVideoField exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   LEADS
   ═══════════════════════════════════════════════════════ */

export async function fetchLeads(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase.from("leads").select("*");
    if (error) { console.error("fetchLeads error:", error); return []; }
    return (data || []).map((row) => toCamelCase(row as Record<string, unknown>) as unknown as Lead);
  } catch (err) { console.error("fetchLeads exception:", err); return []; }
}

export async function upsertLead(lead: Lead): Promise<void> {
  try {
    const row = toSnakeCase(lead as unknown as Record<string, unknown>);
    const { error } = await supabase.from("leads").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertLead error:", error);
  } catch (err) { console.error("upsertLead exception:", err); }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) console.error("deleteLead error:", error);
  } catch (err) { console.error("deleteLead exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   ONBOARDING
   ═══════════════════════════════════════════════════════ */

function onboardingFromRow(row: Record<string, unknown>): OnboardingClient {
  const camel = toCamelCase(row) as Record<string, unknown>;
  // The DB stores steps as individual boolean columns; reassemble into nested object
  camel.steps = {
    contractSigned: !!row.contract_signed,
    invoicePaid: !!row.invoice_paid,
    strategyCallDone: !!row.strategy_call_done,
    shootScheduled: !!row.shoot_scheduled,
    editorAssigned: !!row.editor_assigned,
    socialManagerAssigned: !!row.social_manager_assigned,
  };
  // Remove the flat columns that were converted
  delete camel.contractSigned;
  delete camel.invoicePaid;
  delete camel.strategyCallDone;
  delete camel.shootScheduled;
  delete camel.editorAssigned;
  delete camel.socialManagerAssigned;
  return camel as unknown as OnboardingClient;
}

function onboardingToRow(client: OnboardingClient): Record<string, unknown> {
  const { steps, ...rest } = client;
  const row = toSnakeCase(rest as unknown as Record<string, unknown>);
  // Flatten steps into individual columns
  row.contract_signed = steps.contractSigned;
  row.invoice_paid = steps.invoicePaid;
  row.strategy_call_done = steps.strategyCallDone;
  row.shoot_scheduled = steps.shootScheduled;
  row.editor_assigned = steps.editorAssigned;
  row.social_manager_assigned = steps.socialManagerAssigned;
  return row;
}

export async function fetchOnboarding(): Promise<OnboardingClient[]> {
  try {
    const { data, error } = await supabase.from("onboarding").select("*");
    if (error) { console.error("fetchOnboarding error:", error); return []; }
    return (data || []).map((row) => onboardingFromRow(row as Record<string, unknown>));
  } catch (err) { console.error("fetchOnboarding exception:", err); return []; }
}

export async function upsertOnboarding(client: OnboardingClient): Promise<void> {
  try {
    const row = onboardingToRow(client);
    const { error } = await supabase.from("onboarding").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertOnboarding error:", error);
  } catch (err) { console.error("upsertOnboarding exception:", err); }
}

export async function deleteOnboarding(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("onboarding").delete().eq("id", id);
    if (error) console.error("deleteOnboarding error:", error);
  } catch (err) { console.error("deleteOnboarding exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   ADS
   ═══════════════════════════════════════════════════════ */

export async function fetchAds(): Promise<AdCampaign[]> {
  try {
    const { data, error } = await supabase.from("ads").select("*");
    if (error) { console.error("fetchAds error:", error); return []; }
    return (data || []).map((row) => toCamelCase(row as Record<string, unknown>) as unknown as AdCampaign);
  } catch (err) { console.error("fetchAds exception:", err); return []; }
}

export async function upsertAd(ad: AdCampaign): Promise<void> {
  try {
    const row = toSnakeCase(ad as unknown as Record<string, unknown>);
    const { error } = await supabase.from("ads").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertAd error:", error);
  } catch (err) { console.error("upsertAd exception:", err); }
}

export async function deleteAd(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) console.error("deleteAd error:", error);
  } catch (err) { console.error("deleteAd exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   KNOWLEDGE BASE
   ═══════════════════════════════════════════════════════ */

export async function fetchKBDocs(): Promise<KBDoc[]> {
  try {
    const { data, error } = await supabase.from("kb_docs").select("*");
    if (error) { console.error("fetchKBDocs error:", error); return []; }
    return (data || []).map((row) => toCamelCase(row as Record<string, unknown>) as unknown as KBDoc);
  } catch (err) { console.error("fetchKBDocs exception:", err); return []; }
}

export async function upsertKBDoc(doc: KBDoc): Promise<void> {
  try {
    const row = toSnakeCase(doc as unknown as Record<string, unknown>);
    const { error } = await supabase.from("kb_docs").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertKBDoc error:", error);
  } catch (err) { console.error("upsertKBDoc exception:", err); }
}

export async function deleteKBDoc(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("kb_docs").delete().eq("id", id);
    if (error) console.error("deleteKBDoc error:", error);
  } catch (err) { console.error("deleteKBDoc exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   USERS
   ═══════════════════════════════════════════════════════ */

function userFromRow(row: Record<string, unknown>): AppUser {
  const camel = toCamelCase(row) as Record<string, unknown>;
  // permissions is stored as JSONB — parse if string
  if (typeof camel.permissions === "string") {
    try { camel.permissions = JSON.parse(camel.permissions as string); } catch { camel.permissions = {}; }
  }
  if (!camel.permissions || typeof camel.permissions !== "object") camel.permissions = {};
  return camel as unknown as AppUser;
}

function userToRow(user: AppUser): Record<string, unknown> {
  const row = toSnakeCase(user as unknown as Record<string, unknown>);
  // permissions object -> JSONB
  if (row.permissions !== undefined && typeof row.permissions !== "string") {
    row.permissions = JSON.stringify(row.permissions);
  }
  return row;
}

export async function fetchUsers(): Promise<AppUser[]> {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) { console.error("fetchUsers error:", error); return []; }
    return (data || []).map((row) => userFromRow(row as Record<string, unknown>));
  } catch (err) { console.error("fetchUsers exception:", err); return []; }
}

export async function upsertUser(user: AppUser): Promise<void> {
  try {
    const row = userToRow(user);
    const { error } = await supabase.from("users").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertUser error:", error);
  } catch (err) { console.error("upsertUser exception:", err); }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) console.error("deleteUser error:", error);
  } catch (err) { console.error("deleteUser exception:", err); }
}

export async function authenticateUser(username: string, password: string): Promise<AppUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
    if (error || !data) { return null; }
    return userFromRow(data as Record<string, unknown>);
  } catch (err) { console.error("authenticateUser exception:", err); return null; }
}

/* ═══════════════════════════════════════════════════════
   ACTIVITY LOG
   ═══════════════════════════════════════════════════════ */

export async function fetchActivityLog(): Promise<ActivityEntry[]> {
  try {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);
    if (error) { console.error("fetchActivityLog error:", error); return []; }
    return (data || []).map((row) => toCamelCase(row as Record<string, unknown>) as unknown as ActivityEntry);
  } catch (err) { console.error("fetchActivityLog exception:", err); return []; }
}

export async function logActivityToDb(entry: Omit<ActivityEntry, "id" | "timestamp">): Promise<void> {
  try {
    const row = toSnakeCase(entry as unknown as Record<string, unknown>);
    row.id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    row.timestamp = new Date().toISOString();
    const { error } = await supabase.from("activity_log").insert(row);
    if (error) console.error("logActivityToDb error:", error);
  } catch (err) { console.error("logActivityToDb exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   PACKAGES
   ═══════════════════════════════════════════════════════ */

function packageFromRow(row: Record<string, unknown>): ServicePackage {
  const camel = toCamelCase(row) as Record<string, unknown>;
  // features is stored as JSONB — parse if string
  if (typeof camel.features === "string") {
    try { camel.features = JSON.parse(camel.features as string); } catch { camel.features = []; }
  }
  if (!Array.isArray(camel.features)) camel.features = [];
  return camel as unknown as ServicePackage;
}

function packageToRow(pkg: ServicePackage): Record<string, unknown> {
  const row = toSnakeCase(pkg as unknown as Record<string, unknown>);
  // features array -> JSONB
  if (row.features !== undefined && typeof row.features !== "string") {
    row.features = JSON.stringify(row.features);
  }
  return row;
}

export async function fetchPackages(): Promise<ServicePackage[]> {
  try {
    const { data, error } = await supabase.from("packages").select("*");
    if (error) { console.error("fetchPackages error:", error); return []; }
    return (data || []).map((row) => packageFromRow(row as Record<string, unknown>));
  } catch (err) { console.error("fetchPackages exception:", err); return []; }
}

export async function upsertPackage(pkg: ServicePackage): Promise<void> {
  try {
    const row = packageToRow(pkg);
    const { error } = await supabase.from("packages").upsert(row, { onConflict: "id" });
    if (error) console.error("upsertPackage error:", error);
  } catch (err) { console.error("upsertPackage exception:", err); }
}

export async function deletePackage(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) console.error("deletePackage error:", error);
  } catch (err) { console.error("deletePackage exception:", err); }
}
