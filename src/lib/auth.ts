/* ─── Auth & Permissions ─── */

export type AppUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  role: "superadmin" | "admin" | "editor" | "videographer" | "social_manager" | "member";
  permissions: Record<string, boolean>;
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

export const ADMIN_NAMES = ["angel", "jenina", "santiago"];

/*
 * TODO: Move auth to Supabase Auth (server-side). These credentials are
 * client-side only and visible in the JS bundle. Do NOT reuse real
 * passwords here. Emails are stored for future Resend integration.
 */
export const INIT_USERS: AppUser[] = [
  { id: "u1", username: "Jenina", email: "jeninalopezz@gmail.com", password: "vv-jenina", role: "superadmin", permissions: allPerms() },
  { id: "u2", username: "Angel", email: "angelguerrero1999@gmail.com", password: "vv-angel", role: "admin", permissions: allPerms() },
  { id: "u3", username: "Santiago", email: "viralvisionmk@gmail.com", password: "vv-santiago", role: "admin", permissions: allPerms() },
  { id: "u4", username: "Guido", email: "guidostorchdesign@gmail.com", password: "vv-guido", role: "social_manager", permissions: allPerms() },
  { id: "u5", username: "Alex", email: "alex10soccer2@gmail.com", password: "vv-alex", role: "editor", permissions: editorPerms() },
  { id: "u6", username: "Araceli", email: "ariech0608@gmail.com", password: "vv-araceli", role: "editor", permissions: editorPerms() },
  { id: "u7", username: "Sergio", email: "storres1524@gmail.com", password: "vv-sergio", role: "videographer", permissions: editorPerms() },
  { id: "u8", username: "Rodrigo", email: "jrbp.contato@gmail.com", password: "vv-rodrigo", role: "editor", permissions: editorPerms() },
  { id: "u9", username: "Javier", email: "", password: "vv-javier", role: "editor", permissions: editorPerms() },
  { id: "u10", username: "Leonardo", email: "", password: "vv-leonardo", role: "editor", permissions: editorPerms() },
  { id: "u11", username: "Santi", email: "", password: "vv-santi", role: "editor", permissions: editorPerms() },
];

export function isAdmin(userName: string): boolean {
  return ADMIN_NAMES.includes(userName.toLowerCase());
}

export function isSuperAdmin(userName: string): boolean {
  return userName.toLowerCase() === "jenina";
}
