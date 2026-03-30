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

export const INIT_USERS: AppUser[] = [
  { id: "u1", username: "Jenina", email: "jeninalopezz@gmail.com", password: "Vv2026!jen", role: "superadmin", permissions: allPerms() },
  { id: "u2", username: "Angel", email: "angelguerrero1999@gmail.com", password: "Vv2026!ang", role: "admin", permissions: allPerms() },
  { id: "u3", username: "Santiago", email: "viralvisionmk@gmail.com", password: "Vv2026!san", role: "admin", permissions: allPerms() },
  { id: "u4", username: "Guido", email: "guidostorchdesign@gmail.com", password: "Vv2026!gui", role: "social_manager", permissions: allPerms() },
  { id: "u5", username: "Alex", email: "alex10soccer2@gmail.com", password: "Vv2026!ale", role: "editor", permissions: editorPerms() },
  { id: "u6", username: "Araceli", email: "ariech0608@gmail.com", password: "Vv2026!ara", role: "editor", permissions: editorPerms() },
  { id: "u7", username: "Sergio", email: "storres1524@gmail.com", password: "Vv2026!ser", role: "videographer", permissions: editorPerms() },
  { id: "u8", username: "Rodrigo", email: "jrbp.contato@gmail.com", password: "Vv2026!rod", role: "editor", permissions: editorPerms() },
  { id: "u9", username: "Javier", email: "", password: "Vv2026!jav", role: "editor", permissions: editorPerms() },
  { id: "u10", username: "Leonardo", email: "", password: "Vv2026!leo", role: "editor", permissions: editorPerms() },
  { id: "u11", username: "Santi", email: "", password: "Vv2026!sat", role: "editor", permissions: editorPerms() },
];

export function isAdmin(userName: string): boolean {
  return ADMIN_NAMES.includes(userName.toLowerCase());
}

export function isSuperAdmin(userName: string): boolean {
  return userName.toLowerCase() === "jenina";
}
