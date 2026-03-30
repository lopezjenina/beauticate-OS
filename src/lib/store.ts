import { Client, TeamMember, Video, Lead, OnboardingClient, AdCampaign, KBDoc } from "./types";

/* ─── Team ─── */
export const TEAM: TeamMember[] = [
  { id: "e1", name: "Alex", initials: "AL", role: "editor", weeklyVideoCap: 22 },
  { id: "e2", name: "Araceli", initials: "AR", role: "editor", weeklyVideoCap: 22 },
  { id: "e3", name: "Leonardo", initials: "LE", role: "editor", weeklyVideoCap: 22 },
  { id: "e4", name: "Rodrigo", initials: "RO", role: "editor", weeklyVideoCap: 20 },
  { id: "e5", name: "Sergio", initials: "SE", role: "videographer", weeklyVideoCap: 20 },
  { id: "e6", name: "Javier", initials: "JA", role: "editor", weeklyVideoCap: 22 },
  { id: "e7", name: "Santi", initials: "SA", role: "editor", weeklyVideoCap: 22 },
  { id: "sm1", name: "Guido", initials: "GU", role: "social_manager", weeklyVideoCap: 0 },
  { id: "cd1", name: "Jenina", initials: "JE", role: "creative_director", weeklyVideoCap: 0 },
  { id: "a1", name: "Angel", initials: "AN", role: "admin", weeklyVideoCap: 0 },
  { id: "a2", name: "Santiago", initials: "ST", role: "admin", weeklyVideoCap: 0 },
];

export const EDITORS = TEAM.filter((t) => t.role === "editor");
export const WEEKLY_TARGET = 86;

/* ─── Clients (real) ─── */
export const INIT_CLIENTS: Client[] = [
  /* Araceli's clients */
  { id: "c1", name: "Castaways", initials: "CA", monthlyRevenue: 0, assignedEditor: "e2", assignedSocialManager: "sm1", week: 1, status: "active" },
  { id: "c2", name: "Juniors Kenya", initials: "JK", monthlyRevenue: 0, assignedEditor: "e2", assignedSocialManager: "sm1", week: 1, status: "active" },
  { id: "c3", name: "Hicksville", initials: "HI", monthlyRevenue: 0, assignedEditor: "e2", assignedSocialManager: "sm1", week: 2, status: "active" },
  { id: "c4", name: "Pizza Star", initials: "PS", monthlyRevenue: 0, assignedEditor: "e2", assignedSocialManager: "sm1", week: 2, status: "active" },
  { id: "c5", name: "Viva Birria", initials: "VB", monthlyRevenue: 0, assignedEditor: "e2", assignedSocialManager: "sm1", week: 3, status: "active" },
  /* Sergio's clients */
  { id: "c6", name: "Casa Birria", initials: "CB", monthlyRevenue: 0, assignedEditor: "e5", assignedSocialManager: "sm1", week: 1, status: "active" },
  { id: "c7", name: "Silk City", initials: "SC", monthlyRevenue: 0, assignedEditor: "e5", assignedSocialManager: "sm1", week: 1, status: "active" },
  { id: "c8", name: "Kelly's Pub", initials: "KP", monthlyRevenue: 0, assignedEditor: "e5", assignedSocialManager: "sm1", week: 2, status: "active" },
  { id: "c9", name: "Luminere", initials: "LU", monthlyRevenue: 0, assignedEditor: "e5", assignedSocialManager: "sm1", week: 2, status: "active" },
  { id: "c10", name: "Bartending School", initials: "BS", monthlyRevenue: 0, assignedEditor: "e5", assignedSocialManager: "sm1", week: 3, status: "active" },
  { id: "c11", name: "Roosevelt Projects", initials: "RP", monthlyRevenue: 0, assignedEditor: "e5", assignedSocialManager: "sm1", week: 3, status: "active" },
  /* Rodrigo's clients */
  { id: "c12", name: "Supra", initials: "SU", monthlyRevenue: 0, assignedEditor: "e4", assignedSocialManager: "sm1", week: 1, status: "active" },
  { id: "c13", name: "Taco Express", initials: "TE", monthlyRevenue: 0, assignedEditor: "e4", assignedSocialManager: "sm1", week: 2, status: "active" },
  { id: "c14", name: "Nanus", initials: "NA", monthlyRevenue: 0, assignedEditor: "e4", assignedSocialManager: "sm1", week: 2, status: "active" },
  { id: "c15", name: "American Grill", initials: "AG", monthlyRevenue: 0, assignedEditor: "e4", assignedSocialManager: "sm1", week: 3, status: "active" },
  { id: "c16", name: "Slappin", initials: "SL", monthlyRevenue: 0, assignedEditor: "e4", assignedSocialManager: "sm1", week: 3, status: "active" },
  { id: "c17", name: "Lenny's", initials: "LE", monthlyRevenue: 0, assignedEditor: "e4", assignedSocialManager: "sm1", week: 4, status: "active" },
  /* Alex's clients */
  { id: "c18", name: "BAM", initials: "BA", monthlyRevenue: 0, assignedEditor: "e1", assignedSocialManager: "sm1", week: 1, status: "active" },
  { id: "c19", name: "Lyfestyle", initials: "LY", monthlyRevenue: 0, assignedEditor: "e1", assignedSocialManager: "sm1", week: 2, status: "active" },
  { id: "c20", name: "Asadero", initials: "AS", monthlyRevenue: 0, assignedEditor: "e1", assignedSocialManager: "sm1", week: 3, status: "active" },
  { id: "c21", name: "Kinya Linden", initials: "KL", monthlyRevenue: 0, assignedEditor: "e1", assignedSocialManager: "sm1", week: 4, status: "active" },
  /* Javier's client */
  { id: "c22", name: "Sculpt Fitness", initials: "SF", monthlyRevenue: 0, assignedEditor: "e6", assignedSocialManager: "sm1", week: 1, status: "active" },
  /* Leonardo's client */
  { id: "c23", name: "Black Moon", initials: "BM", monthlyRevenue: 0, assignedEditor: "e3", assignedSocialManager: "sm1", week: 1, status: "active" },
];

/* ─── Videos (empty — Santiago will fill in) ─── */
export const INIT_VIDEOS: Video[] = [];

/* ─── Sales Leads (empty — Santiago will fill in) ─── */
export const INIT_LEADS: Lead[] = [];

/* ─── Onboarding (empty) ─── */
export const INIT_ONBOARDING: OnboardingClient[] = [];

/* ─── Ads (empty — Santiago will fill in) ─── */
export const INIT_ADS: AdCampaign[] = [];

/* ─── Knowledge Base ─── */
export const KB_CATEGORIES = ["Content Pipeline", "Editing", "Publishing", "Client Management", "Paid Advertising", "Social Media"];

export const KB_DOCS: KBDoc[] = [
  { id: "kb1", category: "Content Pipeline", title: "5-stage pipeline overview", author: "Jenina", updated: "2026-03-28", body: "Every piece of content follows five stages:\n\n1. Shoot -- Footage is captured on the scheduled shoot date.\n2. Edit -- Assigned editor produces the final cut.\n3. Internal Approval -- Creative Director or owner signs off.\n4. Sent to Guido -- Approved content enters the publishing queue.\n5. Posted -- Content goes live on the scheduled platform.\n\nNo stage can be skipped. Content must be approved before it reaches publishing. Publishing must be scheduled at least 7 days ahead of the post date." },
  { id: "kb2", category: "Editing", title: "Editor weekly capacity rules", author: "Jenina", updated: "2026-03-28", body: "Weekly target: 86 videos across all editors.\n\nIndividual caps:\n- Alex: 22 videos/week\n- Araceli: 22 videos/week\n- Sergio: 20 videos/week\n- Rodrigo: 20 videos/week\n- Javier: 22 videos/week\n- Leonardo: 22 videos/week\n- Santi: 22 videos/week\n\nIf an editor hits their cap, no additional videos can be assigned until the following week.\n\nRevision policy: 1 revision round included per video. A second revision triggers a warning and must be approved by the Creative Director." },
  { id: "kb3", category: "Publishing", title: "Guido publishing rules", author: "Jenina", updated: "2026-03-28", body: "Content must always be scheduled 7 days ahead of the post date. No same-day posting from fresh edits.\n\nBefore scheduling, every video must have:\n- Caption written and reviewed\n- Thumbnail created\n- Platform selected\n- Scheduled date confirmed\n\nGuido should be scheduling content every day. If the queue runs dry, escalate immediately." },
  { id: "kb4", category: "Content Pipeline", title: "Shoot scheduling rules", author: "Jenina", updated: "2026-03-28", body: "Max 6 client shoots per week. No exceptions.\n\nShoots are locked 60 days in advance. Canceled shoots cannot be replaced in the same week.\n\nEach client has a permanent week assignment (Week 1 through Week 4). Shoot dates follow the client week." },
  { id: "kb5", category: "Client Management", title: "New client onboarding checklist", author: "Jenina", updated: "2026-03-25", body: "A new client cannot enter production until all six steps are complete:\n\n1. Contract signed\n2. Invoice paid\n3. Strategy call completed\n4. Shoot date scheduled\n5. Editor assigned\n6. Social manager assigned\n\nNo exceptions. The system enforces this gate. If a step is missing, the Move to Production button stays locked." },
  { id: "kb6", category: "Paid Advertising", title: "Ads management process", author: "Jenina", updated: "2026-03-22", body: "Every client running ads must have a visible record in the Ads board showing:\n- Campaign name and platform\n- Status (active, paused, draft, ended)\n- Budget and spend\n- Creative being used\n- Optimization schedule\n\nOptimization reviews happen on the schedule set for each campaign. No campaign should run more than 2 weeks without a review." },
  { id: "kb7", category: "Social Media", title: "Caption writing framework", author: "Jenina", updated: "2026-03-20", body: "The Hook-Story-CTA Formula\n\nStep 1: The Hook (First Line)\nThis is the only line people see before tapping more. Make it count.\n- Ask a provocative question\n- Lead with a bold stat or claim\n- Start mid-story\n\nStep 2: The Story (Body)\nExpand on the hook with 3 to 5 lines of value. Use short paragraphs and line breaks.\n\nStep 3: The CTA (Last Line)\nTell them exactly what to do: save, share, comment, click link in bio.\n\nPlatform notes:\n- Instagram: 2,200 char max. Front-load value.\n- TikTok: Keep it under 150 chars. Punchy.\n- LinkedIn: Professional tone. Can go longer.\n- Facebook: 1 to 2 sentences. Direct and clear." },
];
