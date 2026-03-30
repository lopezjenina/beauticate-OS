/* ─── Auth & Permissions ─── */

export type AppUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  role: "superadmin" | "admin" | "member";
  permissions: Record<string, boolean>;
};

export const ALL_PAGES = [
  "dashboard", "sales", "onboarding", "production",
  "approvals", "publishing", "editors", "ads", "knowledge",
] as const;

const allPerms = (): Record<string, boolean> =>
  Object.fromEntries(ALL_PAGES.map((p) => [p, true]));

export const ADMIN_NAMES = ["angel", "jenina", "santiago"];

export const INIT_USERS: AppUser[] = [
  { id: "u1", username: "Jenina", email: "jenina@viralvision.com", password: "password", role: "superadmin", permissions: allPerms() },
  { id: "u2", username: "Angel", email: "angel@viralvision.com", password: "password", role: "admin", permissions: allPerms() },
  { id: "u3", username: "Santiago", email: "santiago@viralvision.com", password: "password", role: "admin", permissions: allPerms() },
  { id: "u4", username: "Guido", email: "guido@viralvision.com", password: "password", role: "member", permissions: allPerms() },
  { id: "u5", username: "Alex", email: "alex@viralvision.com", password: "password", role: "member", permissions: { ...allPerms(), sales: false, ads: false } },
];

export function isAdmin(userName: string): boolean {
  return ADMIN_NAMES.includes(userName.toLowerCase());
}

export function isSuperAdmin(userName: string): boolean {
  return userName.toLowerCase() === "jenina";
}
