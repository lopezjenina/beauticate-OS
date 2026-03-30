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
  "approvals", "publishing", "editors", "ads", "knowledge", "clients", "activity",
] as const;

const allPerms = (): Record<string, boolean> =>
  Object.fromEntries(ALL_PAGES.map((p) => [p, true]));

export const ADMIN_NAMES = ["angel", "jenina", "santiago"];

export const INIT_USERS: AppUser[] = [
  { id: "u1", username: "Jenina", email: "jenina@viralvision.com", password: "password", role: "superadmin", permissions: allPerms() },
  { id: "u2", username: "Angel", email: "angel@viralvision.com", password: "password", role: "admin", permissions: allPerms() },
  { id: "u3", username: "Santiago", email: "santiago@viralvision.com", password: "password", role: "admin", permissions: allPerms() },
  { id: "u4", username: "Guido", email: "guido@viralvision.com", password: "password", role: "social_manager", permissions: allPerms() },
  { id: "u5", username: "Alex", email: "alex@viralvision.com", password: "password", role: "editor", permissions: { ...allPerms(), sales: false, ads: false } },
  { id: "u6", username: "Araceli", email: "araceli@viralvision.com", password: "password", role: "editor", permissions: { ...allPerms(), sales: false, ads: false } },
  { id: "u7", username: "Sergio", email: "sergio@viralvision.com", password: "password", role: "videographer", permissions: { ...allPerms(), sales: false, ads: false } },
  { id: "u8", username: "Rodrigo", email: "rodrigo@viralvision.com", password: "password", role: "editor", permissions: { ...allPerms(), sales: false, ads: false } },
  { id: "u9", username: "Javier", email: "javier@viralvision.com", password: "password", role: "editor", permissions: { ...allPerms(), sales: false, ads: false } },
  { id: "u10", username: "Leonardo", email: "leonardo@viralvision.com", password: "password", role: "editor", permissions: { ...allPerms(), sales: false, ads: false } },
  { id: "u11", username: "Santi", email: "santi@viralvision.com", password: "password", role: "editor", permissions: { ...allPerms(), sales: false, ads: false } },
];

export function isAdmin(userName: string): boolean {
  return ADMIN_NAMES.includes(userName.toLowerCase());
}

export function isSuperAdmin(userName: string): boolean {
  return userName.toLowerCase() === "jenina";
}
