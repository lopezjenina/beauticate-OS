/* ─── Auth & Permissions ─── */

import { supabase } from "./supabase";

export type AppUser = {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "editor" | "videographer" | "social_manager" | "member";
  permissions: Record<string, boolean>;
  weeklyVideoCap?: number;
};

export const ALL_PAGES = [
  "dashboard", "calendar", "sales", "onboarding", "production",
  "approvals", "publishing", "editors", "ads", "packages", "knowledge", "clients", "activity",
] as const;

const allPerms = (): Record<string, boolean> =>
  Object.fromEntries(ALL_PAGES.map((p) => [p, true]));

const editorPerms = (): Record<string, boolean> => ({
  ...Object.fromEntries(ALL_PAGES.map((p) => [p, false])),
  production: true,
  approvals: true,
  publishing: true,
  editors: true,
  knowledge: true,
  activity: true,
});

export const ADMIN_NAMES = ["jenina"];

/* ─── Supabase Auth helpers ─── */

function profileToAppUser(profile: Record<string, unknown>): AppUser {
  let perms = profile.permissions;
  if (typeof perms === "string") {
    try { perms = JSON.parse(perms as string); } catch { perms = {}; }
  }
  if (!perms || typeof perms !== "object") perms = allPerms();

  return {
    id: profile.id as string,
    username: (profile.full_name || profile.username || profile.email || "User") as string,
    email: (profile.email || "") as string,
    role: (profile.role || "member") as AppUser["role"],
    permissions: perms as Record<string, boolean>,
    weeklyVideoCap: (profile.weekly_video_cap as number) || 22,
  };
}

/**
 * Sign in with email + password via Supabase Auth.
 * Returns the AppUser profile on success, or an error message on failure.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AppUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  // Fetch the user's profile from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return {
      user: null,
      error: "Profile not found. Please contact your administrator.",
    };
  }

  return { user: profileToAppUser(profile as Record<string, unknown>), error: null };
}

/**
 * Sign out the current user via Supabase Auth.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get the current authenticated user's profile.
 * Returns null if no session exists.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile) return null;
  return profileToAppUser(profile as Record<string, unknown>);
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (user: AppUser | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      callback(null);
      return;
    }

    // Fetch profile for the authenticated user
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      callback(profileToAppUser(profile as Record<string, unknown>));
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

/* ─── Role helpers (unchanged) ─── */

export function isAdmin(userName: string, users: AppUser[] = []): boolean {
  const user = users.find(u => u.username.toLowerCase() === userName.toLowerCase());
  if (user) return user.role === "admin" || user.role === "superadmin";
  return ADMIN_NAMES.includes(userName.toLowerCase());
}

export function isSuperAdmin(userName: string, users: AppUser[] = []): boolean {
  const user = users.find(u => u.username.toLowerCase() === userName.toLowerCase());
  if (user) return user.role === "superadmin";
  return userName.toLowerCase() === "jenina";
}
