import { supabase } from "./supabase";

/* ─── Types ─── */

export type AppUser = {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "editor" | "videographer" | "social_manager" | "member";
  permissions: Record<string, boolean>;
  weeklyVideoCap?: number;
};

// All board pages that can have per-user permission toggles
export const ALL_PAGES = [
  "dashboard",
  "calendar",
  "sales",
  "onboarding",
  "clients",
  "production",
  "approvals",
  "publishing",
  "editors",
  "ads",
  "packages",
  "knowledge",
  "activity",
] as const;

/* ─── Magic Link Sign-In ─── */

export async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // PKCE flow: Supabase emails a ?code= link → /auth/callback exchanges it for a session cookie
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error: error?.message ?? null };
}

/* ─── Sign Out ─── */

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/* ─── Get Current Authenticated User (with profile) ─── */

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return await getOrCreateProfile(user.id, user.email ?? "");
  } catch {
    return null;
  }
}

/* ─── Auth State Listener ─── */

export function onAuthStateChange(
  callback: (user: AppUser | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    // INITIAL_SESSION: fires on page load. If no session, user is logged out.
    if (event === "INITIAL_SESSION") {
      if (!session?.user) {
        callback(null);
      } else {
        getOrCreateProfile(session.user.id, session.user.email ?? "").then(appUser => callback(appUser));
      }
      return;
    }

    // SIGNED_IN: fires when magic link hash is processed or user signs in
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
      if (!session?.user) {
        callback(null);
        return;
      }
      getOrCreateProfile(session.user.id, session.user.email ?? "").then(appUser => callback(appUser));
      return;
    }

    if (event === "SIGNED_OUT") {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

/* ─── Role guards ─── */

export function isAdmin(username: string, users: AppUser[]): boolean {
  const u = users.find((u) => u.username === username);
  return u ? ["admin", "superadmin"].includes(u.role) : false;
}

export function isSuperAdmin(username: string, users: AppUser[]): boolean {
  const u = users.find((u) => u.username === username);
  return u?.role === "superadmin";
}

/* ─── Internal: get profile or auto-create it on first magic link login ─── */

async function getOrCreateProfile(userId: string, email: string): Promise<AppUser | null> {
  // Try to fetch existing profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!error && profile) {
    return profileFromRow(profile);
  }

  // If error is NOT "row not found" (PGRST116), the profile likely exists but
  // RLS blocked the read — DO NOT overwrite it with a default role.
  if (error && error.code !== "PGRST116") {
    console.error("Profile fetch blocked (possible RLS issue):", error.message);
    // Return a minimal stand-in so auth doesn't hard-fail, but don't upsert.
    return {
      id: userId,
      email,
      username: email.split("@")[0],
      role: "member",
      permissions: Object.fromEntries(ALL_PAGES.map((p) => [p, true])),
    };
  }

  // Profile truly doesn't exist yet (trigger may not have fired) — INSERT only.
  // Use ignoreDuplicates: true so we NEVER overwrite an existing row's role.
  const defaultUsername = email.split("@")[0];
  const defaultPermissions = Object.fromEntries(ALL_PAGES.map((p) => [p, true]));

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      username: defaultUsername,
      role: "member",
      permissions: defaultPermissions,
    });

  if (insertError && insertError.code !== "23505") {
    // 23505 = unique violation (row already exists — safe to ignore)
    console.error("Failed to create profile:", insertError);
  }

  // Re-fetch the profile (whether we just inserted or it already existed)
  const { data: finalProfile, error: refetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (refetchError || !finalProfile) {
    console.error("Could not fetch profile after insert:", refetchError);
    return {
      id: userId,
      email,
      username: defaultUsername,
      role: "member",
      permissions: defaultPermissions,
    };
  }

  return profileFromRow(finalProfile);
}

/* ─── Internal helper ─── */

function profileFromRow(row: Record<string, unknown>): AppUser {
  let permissions = row.permissions;
  if (typeof permissions === "string") {
    try { permissions = JSON.parse(permissions); } catch { permissions = {}; }
  }
  if (!permissions || typeof permissions !== "object") {
    permissions = Object.fromEntries(ALL_PAGES.map((p) => [p, true]));
  }

  return {
    id: row.id as string,
    username: (row.username as string) || (row.email as string)?.split("@")[0] || "Unknown",
    email: row.email as string,
    role: (row.role as AppUser["role"]) || "member",
    permissions: permissions as Record<string, boolean>,
    weeklyVideoCap: row.weekly_video_cap as number | undefined,
  };
}
