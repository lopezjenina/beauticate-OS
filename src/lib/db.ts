import { supabase } from "./supabase";
import {
  Client,
  Video,
  Note,
  Lead,
  OnboardingClient,
  AdCampaign,
  KBDoc,
  Attachment,
} from "./types";
import { AppUser } from "./auth";
import { ActivityEntry } from "./activityLog";
import { sendEmail } from "./email";
import { videoApprovalTemplate, assignmentTemplate, welcomeTemplate } from "./email-templates";

export const dbError = (msg: string, err: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(msg, err);
  }
};

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
    if (error) { dbError("fetchClients error:", error); return []; }
    return (data || []).map((row) => toCamelCase(row as Record<string, unknown>) as unknown as Client);
  } catch (err) { dbError("fetchClients exception:", err); return []; }
}

export async function upsertClient(client: Client): Promise<void> {
  try {
    const row = toSnakeCase(client as unknown as Record<string, unknown>);
    const { error } = await supabase.from("clients").upsert(row, { onConflict: "id" });
    if (error) dbError("upsertClient error:", error);
  } catch (err) { dbError("upsertClient exception:", err); }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) dbError("deleteClient error:", error);
  } catch (err) { dbError("deleteClient exception:", err); }
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

  // Handle nested attachments
  if (row.attachments) {
    (camel as any).attachments = (row.attachments as any[]).map(a => toCamelCase(a) as unknown as Attachment);
  }

  return camel as unknown as Video;
}

function videoToRow(video: Video): Record<string, unknown> {
  const { attachments, ...videoData } = video;
  const row = toSnakeCase(videoData as unknown as Record<string, unknown>);
  // notes array -> JSONB
  if (row.notes !== undefined) {
    row.notes = JSON.stringify(row.notes);
  }
  return row;
}

export async function fetchVideos(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from("videos").select("*, attachments(*)");
    if (error) { dbError("fetchVideos error:", error); return []; }
    return (data || []).map((row) => videoFromRow(row as Record<string, unknown>));
  } catch (err) { dbError("fetchVideos exception:", err); return []; }
}

export async function upsertVideo(video: Video, prevStatus?: string): Promise<void> {
  try {
    const row = videoToRow(video);
    const { error } = await supabase.from("videos").upsert(row, { onConflict: "id" });
    if (error) {
      dbError("upsertVideo error:", error);
    } else {
      if (video.attachments && video.attachments.length > 0) {
        await saveAttachments(video.attachments, { videoId: video.id });
      }
      // Notify client when video is delivered for review
      if (video.editingStatus === "delivered" && prevStatus !== "delivered") {
        // Fetch client email from clients table
        const { data: clientRow } = await supabase
          .from("clients")
          .select("contact_email, name")
          .eq("id", video.clientId)
          .single();
        if (clientRow?.contact_email) {
          sendEmail({
            to: clientRow.contact_email,
            subject: `Your video is ready for review: ${video.title}`,
            html: videoApprovalTemplate(
              clientRow.name,
              video.title,
              "https://beauticate.space"
            ),
          }).catch((e) => dbError("Video approval email failed:", e));
        }
      }
    }
  } catch (err) { dbError("upsertVideo exception:", err); }
}

export async function deleteVideo(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) dbError("deleteVideo error:", error);
  } catch (err) { dbError("deleteVideo exception:", err); }
}

export async function updateVideoField(id: string, field: string, value: unknown): Promise<void> {
  try {
    const snakeField = camelToSnake(field);
    const dbValue = field === "notes" ? JSON.stringify(value) : value;
    const { error } = await supabase.from("videos").update({ [snakeField]: dbValue }).eq("id", id);
    if (error) dbError("updateVideoField error:", error);
  } catch (err) { dbError("updateVideoField exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   LEADS
   ═══════════════════════════════════════════════════════ */

export async function fetchLeads(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase.from("leads").select("*, attachments(*)");
    if (error) { dbError("fetchLeads error:", error); return []; }
    return (data || []).map((row) => {
      const camel = toCamelCase(row as Record<string, unknown>) as unknown as Lead;
      if (row.attachments) {
        camel.attachments = (row.attachments as any[]).map(a => toCamelCase(a) as unknown as Attachment);
      }
      return camel;
    });
  } catch (err) { dbError("fetchLeads exception:", err); return []; }
}

export async function upsertLead(lead: Lead, isNew = false): Promise<void> {
  try {
    const { attachments, ...leadData } = lead;
    const row = toSnakeCase(leadData as unknown as Record<string, unknown>);
    const { error } = await supabase.from("leads").upsert(row, { onConflict: "id" });
    if (error) {
      dbError("upsertLead error object:", JSON.stringify(error, null, 2));
    } else {
      if (attachments && attachments.length > 0) {
        await saveAttachments(attachments, { leadId: lead.id });
      }
      // Notify the team when a new lead is captured
      if (isNew && lead.email) {
        sendEmail({
          to: "support@beauticate.space",
          subject: `New Lead: ${lead.contactName} — ${lead.company}`,
          html: assignmentTemplate(
            "Beauticate Team",
            `${lead.contactName} (${lead.company})`,
            "https://beauticate.space"
          )
        }).catch((e) => dbError("Lead notification email failed:", e));
      }
    }
  } catch (err) {
    dbError("upsertLead exception:", err);
  }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) dbError("deleteLead error:", error);
  } catch (err) { dbError("deleteLead exception:", err); }
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
    if (error) { dbError("fetchOnboarding error:", error); return []; }
    return (data || []).map((row) => onboardingFromRow(row as Record<string, unknown>));
  } catch (err) { dbError("fetchOnboarding exception:", err); return []; }
}

export async function upsertOnboarding(client: OnboardingClient): Promise<void> {
  try {
    const row = onboardingToRow(client);
    const { error } = await supabase.from("onboarding").upsert(row, { onConflict: "id" });
    if (error) {
      dbError("upsertOnboarding error:", error);
    } else {
      // Send welcome email when ALL onboarding steps are complete
      const allDone = Object.values(client.steps).every(Boolean);
      if (allDone && client.contactEmail) {
        sendEmail({
          to: client.contactEmail,
          subject: `Welcome to Beauticate, ${client.name}!`,
          html: welcomeTemplate(client.contactPerson || client.name, "https://beauticate.space"),
        }).catch((e) => dbError("Welcome email failed:", e));
      }
    }
  } catch (err) { dbError("upsertOnboarding exception:", err); }
}

export async function deleteOnboarding(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("onboarding").delete().eq("id", id);
    if (error) dbError("deleteOnboarding error:", error);
  } catch (err) { dbError("deleteOnboarding exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   ADS
   ═══════════════════════════════════════════════════════ */

export async function fetchAds(): Promise<AdCampaign[]> {
  try {
    const { data, error } = await supabase.from("ads").select("*, attachments(*)");
    if (error) { dbError("fetchAds error:", error); return []; }
    return (data || []).map((row) => {
      const camel = toCamelCase(row as Record<string, unknown>) as unknown as AdCampaign;
      if (row.attachments) {
        camel.attachments = (row.attachments as any[]).map(a => toCamelCase(a) as unknown as Attachment);
      }
      return camel;
    });
  } catch (err) { dbError("fetchAds exception:", err); return []; }
}

export async function upsertAd(ad: AdCampaign): Promise<void> {
  try {
    const { attachments, ...adData } = ad;
    const row = toSnakeCase(adData as unknown as Record<string, unknown>);
    const { error } = await supabase.from("ads").upsert(row, { onConflict: "id" });
    if (error) {
      dbError("upsertAd error:", error);
    } else if (attachments && attachments.length > 0) {
      await saveAttachments(attachments, { adId: ad.id });
    }
  } catch (err) { dbError("upsertAd exception:", err); }
}

export async function deleteAd(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) dbError("deleteAd error:", error);
  } catch (err) { dbError("deleteAd exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   KNOWLEDGE BASE
   ═══════════════════════════════════════════════════════ */

export async function fetchKBDocs(): Promise<KBDoc[]> {
  try {
    const { data, error } = await supabase.from("kb_docs").select("*, attachments(*)");
    if (error) { dbError("fetchKBDocs error:", error); return []; }
    return (data || []).map((row) => {
      const camel = toCamelCase(row as Record<string, unknown>) as unknown as KBDoc;
      if (row.attachments) {
        camel.attachments = (row.attachments as any[]).map(a => toCamelCase(a) as unknown as Attachment);
      }
      return camel;
    });
  } catch (err) { dbError("fetchKBDocs exception:", err); return []; }
}

export async function upsertKBDoc(doc: KBDoc): Promise<void> {
  try {
    const { attachments, ...docData } = doc;
    const row = toSnakeCase(docData as unknown as Record<string, unknown>);
    const { error } = await supabase.from("kb_docs").upsert(row, { onConflict: "id" });
    if (error) {
      dbError("upsertKBDoc error:", error);
    } else if (attachments && attachments.length > 0) {
      await saveAttachments(attachments, { kbDocId: doc.id });
    }
  } catch (err) { dbError("upsertKBDoc exception:", err); }
}

export async function deleteKBDoc(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("kb_docs").delete().eq("id", id);
    if (error) dbError("deleteKBDoc error:", error);
  } catch (err) { dbError("deleteKBDoc exception:", err); }
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
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) { dbError("fetchUsers error:", error); return []; }
    return (data || []).map((row) => userFromRow(row as Record<string, unknown>));
  } catch (err) { dbError("fetchUsers exception:", err); return []; }
}

export async function upsertUser(user: AppUser): Promise<void> {
  try {
    const row = userToRow(user);
    const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
    if (error) dbError("upsertUser error:", error);
  } catch (err) { dbError("upsertUser exception:", err); }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/admin/create-user?userId=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
       dbError("deleteUser error:", await response.text());
    }
  } catch (err) { dbError("deleteUser exception:", err); }
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
    if (error) { dbError("fetchActivityLog error:", error); return []; }
    return (data || []).map((row) => toCamelCase(row as Record<string, unknown>) as unknown as ActivityEntry);
  } catch (err) { dbError("fetchActivityLog exception:", err); return []; }
}

export async function logActivityToDb(entry: Omit<ActivityEntry, "id" | "timestamp">): Promise<void> {
  try {
    const row = toSnakeCase(entry as unknown as Record<string, unknown>);
    row.id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    row.timestamp = new Date().toISOString();
    const { error } = await supabase.from("activity_log").insert(row);
    if (error) dbError("logActivityToDb error:", error);
  } catch (err) { dbError("logActivityToDb exception:", err); }
}

/* ═══════════════════════════════════════════════════════
   ATTACHMENTS
   ═══════════════════════════════════════════════════════ */

export async function saveAttachments(
  attachments: Attachment[],
  ids: { videoId?: string; leadId?: string; adId?: string; kbDocId?: string }
): Promise<void> {
  try {
    const rows = attachments.map((att) => {
      const row = toSnakeCase(att as unknown as Record<string, unknown>);
      // Add the foreign keys (already snake_cased by toSnakeCase if they were in CamelCase,
      // but here they are already in the keys of 'ids')
      if (ids.videoId) row.video_id = ids.videoId;
      if (ids.leadId) row.lead_id = ids.leadId;
      if (ids.adId) row.ad_id = ids.adId;
      if (ids.kbDocId) row.kb_doc_id = ids.kbDocId;
      return row;
    });
    const { error } = await supabase.from("attachments").upsert(rows, { onConflict: "id" });
    if (error) dbError("saveAttachments error:", error);
  } catch (err) { dbError("saveAttachments exception:", err); }
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
    if (error) { dbError("fetchPackages error:", error); return []; }
    return (data || []).map((row) => packageFromRow(row as Record<string, unknown>));
  } catch (err) { dbError("fetchPackages exception:", err); return []; }
}

export async function upsertPackage(pkg: ServicePackage): Promise<void> {
  try {
    const row = packageToRow(pkg);
    const { error } = await supabase.from("packages").upsert(row, { onConflict: "id" });
    if (error) dbError("upsertPackage error:", error);
  } catch (err) { dbError("upsertPackage exception:", err); }
}

export async function deletePackage(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) dbError("deletePackage error:", error);
  } catch (err) { dbError("deletePackage exception:", err); }
}
