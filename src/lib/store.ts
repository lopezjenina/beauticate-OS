import { Client, TeamMember, Video, Lead, OnboardingClient, AdCampaign, KBDoc } from "./types";

/* ─── Team ─── */
export const TEAM: TeamMember[] = [
  { id: "e1", name: "Alex Vargas", initials: "AV", role: "editor", weeklyVideoCap: 22 },
  { id: "e2", name: "Araceli Duran", initials: "AD", role: "editor", weeklyVideoCap: 22 },
  { id: "e3", name: "Leonardo Reyes", initials: "LR", role: "editor", weeklyVideoCap: 22 },
  { id: "e4", name: "Rodrigo Mendez", initials: "RM", role: "editor", weeklyVideoCap: 20 },
  { id: "sm1", name: "Guido Ferrara", initials: "GF", role: "social_manager", weeklyVideoCap: 0 },
  { id: "cd1", name: "Jenina Lopez", initials: "JL", role: "creative_director", weeklyVideoCap: 0 },
  { id: "am1", name: "Tanya Santos", initials: "TS", role: "ads_manager", weeklyVideoCap: 0 },
];

export const EDITORS = TEAM.filter((t) => t.role === "editor");
export const WEEKLY_TARGET = 86;

/* ─── Clients ─── */
export const INIT_CLIENTS: Client[] = [
  { id: "c1", name: "Sunrise Bakery", initials: "SB", monthlyRevenue: 2500, assignedEditor: "e1", assignedSocialManager: "sm1", week: 1, status: "active", shootDate: "2026-04-01" },
  { id: "c2", name: "Peak Fitness", initials: "PF", monthlyRevenue: 3500, assignedEditor: "e1", assignedSocialManager: "sm1", week: 1, status: "active", shootDate: "2026-04-02" },
  { id: "c3", name: "Luxe Realty", initials: "LX", monthlyRevenue: 4000, assignedEditor: "e2", assignedSocialManager: "sm1", week: 1, status: "active", shootDate: "2026-04-03" },
  { id: "c4", name: "TechNova", initials: "TN", monthlyRevenue: 3000, assignedEditor: "e2", assignedSocialManager: "sm1", week: 2, status: "active", shootDate: "2026-04-07" },
  { id: "c5", name: "Vibe Yoga Studio", initials: "VY", monthlyRevenue: 2000, assignedEditor: "e3", assignedSocialManager: "sm1", week: 2, status: "active", shootDate: "2026-04-08" },
  { id: "c6", name: "Coastal Eats", initials: "CE", monthlyRevenue: 2800, assignedEditor: "e3", assignedSocialManager: "sm1", week: 2, status: "active", shootDate: "2026-04-09" },
  { id: "c7", name: "Urban Threads", initials: "UT", monthlyRevenue: 3200, assignedEditor: "e4", assignedSocialManager: "sm1", week: 3, status: "active", shootDate: "2026-04-14" },
  { id: "c8", name: "NovaTech SaaS", initials: "NS", monthlyRevenue: 5000, assignedEditor: "e4", assignedSocialManager: "sm1", week: 3, status: "active", shootDate: "2026-04-15" },
  { id: "c9", name: "Fresh Dental", initials: "FD", monthlyRevenue: 2200, assignedEditor: "e1", assignedSocialManager: "sm1", week: 3, status: "active", shootDate: "2026-04-16" },
  { id: "c10", name: "Bloom Florist", initials: "BF", monthlyRevenue: 1800, assignedEditor: "e2", assignedSocialManager: "sm1", week: 4, status: "active", shootDate: "2026-04-21" },
  { id: "c11", name: "Metro Auto", initials: "MA", monthlyRevenue: 4500, assignedEditor: "e3", assignedSocialManager: "sm1", week: 4, status: "active", shootDate: "2026-04-22" },
  { id: "c12", name: "Bella Spa", initials: "BS", monthlyRevenue: 2600, assignedEditor: "e4", assignedSocialManager: "sm1", week: 4, status: "active", shootDate: "2026-04-23" },
];

/* ─── Videos (5-stage pipeline) ─── */
function genVideos(): Video[] {
  const vids: Video[] = [];
  let id = 1;
  const platforms = ["Instagram", "TikTok", "Facebook", "YouTube"];
  const titles = ["Brand intro reel", "Product showcase", "Customer testimonial", "Behind the scenes", "Tutorial clip", "Day in the life", "Before/after", "Trending audio edit"];

  for (const client of INIT_CLIENTS) {
    const count = 3 + Math.floor(Math.random() * 5); // 3-7 videos per client
    for (let i = 0; i < count; i++) {
      const weekOffset = (client.week - 1) * 7;
      const shootDay = weekOffset + 1;
      const dueDay = weekOffset + 5;
      const schedDay = weekOffset + 8;

      // Distribute statuses across the pipeline
      let editingStatus: Video["editingStatus"];
      let postingStatus: Video["postingStatus"] = "pending";
      let sentToGuido = false;
      let posted = false;
      let footageUploaded = true;
      let captionWritten = false;
      let thumbnailDone = false;

      if (client.week === 1) {
        // Week 1: mostly done
        const roll = Math.random();
        if (roll < 0.3) { editingStatus = "approved"; sentToGuido = true; postingStatus = "posted"; posted = true; captionWritten = true; thumbnailDone = true; }
        else if (roll < 0.6) { editingStatus = "approved"; sentToGuido = true; postingStatus = "scheduled"; captionWritten = true; thumbnailDone = true; }
        else { editingStatus = "approved"; sentToGuido = false; captionWritten = true; thumbnailDone = true; }
      } else if (client.week === 2) {
        // Week 2: in editing / approval
        const roll = Math.random();
        if (roll < 0.3) { editingStatus = "delivered"; }
        else if (roll < 0.5) { editingStatus = "approved"; sentToGuido = true; captionWritten = true; thumbnailDone = Math.random() > 0.3; }
        else if (roll < 0.7) { editingStatus = "editing"; }
        else { editingStatus = "revision"; }
      } else if (client.week === 3) {
        // Week 3: early editing
        const roll = Math.random();
        if (roll < 0.4) { editingStatus = "editing"; }
        else if (roll < 0.6) { editingStatus = "not_started"; footageUploaded = Math.random() > 0.5; }
        else { editingStatus = "delivered"; }
      } else {
        // Week 4: mostly not started
        editingStatus = Math.random() > 0.7 ? "editing" : "not_started";
        footageUploaded = Math.random() > 0.6;
      }

      vids.push({
        id: `v${id++}`,
        clientId: client.id,
        editorId: client.assignedEditor,
        week: client.week,
        title: titles[i % titles.length],
        shootDate: `2026-04-${String(shootDay).padStart(2, "0")}`,
        dueDate: `2026-04-${String(dueDay).padStart(2, "0")}`,
        footageUploaded,
        editingStatus,
        revisionsUsed: editingStatus === "revision" ? 1 : 0,
        captionWritten,
        thumbnailDone,
        scheduledDate: postingStatus !== "pending" ? `2026-04-${String(schedDay + i).padStart(2, "0")}` : undefined,
        platform: platforms[i % platforms.length],
        postingStatus,
        sentToGuido,
        posted,
        notes: [],
      });
    }
  }
  return vids;
}

export const INIT_VIDEOS = genVideos();

/* ─── Sales Leads ─── */
export const INIT_LEADS: Lead[] = [
  { id: "l1", contactName: "Diana Ruiz", company: "Halo Skincare", email: "diana@haloskincare.com", phone: "201-555-0101", source: "Instagram DM", estimatedRevenue: 3000, stage: "proposal", closeDate: "2026-04-10", notes: "Interested in full social management. Sent proposal March 27.", createdAt: "2026-03-20" },
  { id: "l2", contactName: "Marcus Cole", company: "Iron Athletics", email: "marcus@ironathletics.com", phone: "973-555-0202", source: "Referral", estimatedRevenue: 4000, stage: "call", closeDate: "", notes: "Referred by Peak Fitness owner. Discovery call scheduled April 2.", createdAt: "2026-03-25" },
  { id: "l3", contactName: "Priya Sharma", company: "Zen Garden Restaurant", email: "priya@zengarden.com", phone: "212-555-0303", source: "Website", estimatedRevenue: 2500, stage: "lead", closeDate: "", notes: "Filled out contact form. Wants help with TikTok and Reels.", createdAt: "2026-03-28" },
  { id: "l4", contactName: "James Park", company: "Apex Roofing", email: "james@apexroofing.com", phone: "908-555-0404", source: "Cold outreach", estimatedRevenue: 3500, stage: "follow_up", closeDate: "2026-04-05", notes: "Had call. Interested but wants to see case study first.", createdAt: "2026-03-15" },
  { id: "l5", contactName: "Sofia Reyes", company: "Lush Lashes Studio", email: "sofia@lushlashes.com", phone: "201-555-0505", source: "Instagram DM", estimatedRevenue: 2000, stage: "closed_won", closeDate: "2026-03-26", notes: "Signed Growth package. Starting onboarding.", createdAt: "2026-03-10" },
  { id: "l6", contactName: "Tyler Brooks", company: "Brooks Landscaping", email: "tyler@brooksland.com", phone: "732-555-0606", source: "Referral", estimatedRevenue: 2800, stage: "closed_lost", closeDate: "2026-03-22", notes: "Went with a cheaper local option. Follow up in 3 months.", createdAt: "2026-03-05" },
];

/* ─── Onboarding ─── */
export const INIT_ONBOARDING: OnboardingClient[] = [
  { id: "ob1", name: "Lush Lashes Studio", leadId: "l5", package: "Growth", startDate: "2026-03-26", steps: { contractSigned: true, invoicePaid: true, strategyCallDone: true, shootScheduled: false, editorAssigned: false, socialManagerAssigned: false }, assignedEditor: undefined, assignedSocialManager: undefined },
  { id: "ob2", name: "Halo Skincare", package: "Premium", startDate: "2026-03-20", steps: { contractSigned: true, invoicePaid: false, strategyCallDone: false, shootScheduled: false, editorAssigned: false, socialManagerAssigned: false }, assignedEditor: undefined, assignedSocialManager: undefined },
];

/* ─── Ads ─── */
export const INIT_ADS: AdCampaign[] = [
  { id: "ad1", clientId: "c2", campaignName: "Spring Promo - Memberships", platform: "Meta", status: "active", budget: 1500, spent: 680, creative: "Reel ad + carousel", optimizationSchedule: "Every Tuesday", notes: "Strong CTR on carousel. Scale carousel spend." },
  { id: "ad2", clientId: "c3", campaignName: "Luxury Listings Q2", platform: "Meta", status: "active", budget: 2500, spent: 1100, creative: "Property tour videos", optimizationSchedule: "Every Wednesday", notes: "CPL dropping. Retarget website visitors." },
  { id: "ad3", clientId: "c8", campaignName: "SaaS Free Trial", platform: "Google", status: "active", budget: 3000, spent: 1450, creative: "Search + Display", optimizationSchedule: "Every Monday", notes: "Pause display. Focus budget on search." },
  { id: "ad4", clientId: "c4", campaignName: "Brand Awareness", platform: "Meta", status: "paused", budget: 1000, spent: 400, creative: "Testimonial reel", optimizationSchedule: "Bi-weekly", notes: "Paused pending new creative from editor." },
  { id: "ad5", clientId: "c11", campaignName: "Service Specials", platform: "Google", status: "draft", budget: 2000, spent: 0, creative: "Not yet assigned", optimizationSchedule: "TBD", notes: "Waiting for client to approve budget." },
];

/* ─── Knowledge Base ─── */
export const KB_CATEGORIES = ["Content Pipeline", "Editing", "Publishing", "Client Management", "Paid Advertising", "Social Media"];

export const KB_DOCS: KBDoc[] = [
  { id: "kb1", category: "Content Pipeline", title: "5-stage pipeline overview", author: "Jenina L.", updated: "2026-03-28", body: "Every piece of content follows five stages:\n\n1. Shoot -- Footage is captured on the scheduled shoot date.\n2. Edit -- Assigned editor produces the final cut.\n3. Internal Approval -- Creative Director or owner signs off.\n4. Sent to Guido -- Approved content enters the publishing queue.\n5. Posted -- Content goes live on the scheduled platform.\n\nNo stage can be skipped. Content must be approved before it reaches publishing. Publishing must be scheduled at least 7 days ahead of the post date." },
  { id: "kb2", category: "Editing", title: "Editor weekly capacity rules", author: "Jenina L.", updated: "2026-03-28", body: "Weekly target: 86 videos across all editors.\n\nIndividual caps:\n- Alex: 22 videos/week\n- Araceli: 22 videos/week\n- Leonardo: 22 videos/week\n- Rodrigo: 20 videos/week\n\nIf an editor hits their cap, no additional videos can be assigned until the following week.\n\nRevision policy: 1 revision round included per video. A second revision triggers a warning and must be approved by the Creative Director." },
  { id: "kb3", category: "Publishing", title: "Guido publishing rules", author: "Jenina L.", updated: "2026-03-28", body: "Content must always be scheduled 7 days ahead of the post date. No same-day posting from fresh edits.\n\nBefore scheduling, every video must have:\n- Caption written and reviewed\n- Thumbnail created\n- Platform selected\n- Scheduled date confirmed\n\nGuido should be scheduling content every day. If the queue runs dry, escalate immediately." },
  { id: "kb4", category: "Content Pipeline", title: "Shoot scheduling rules", author: "Jenina L.", updated: "2026-03-28", body: "Max 6 client shoots per week. No exceptions.\n\nShoots are locked 60 days in advance. Canceled shoots cannot be replaced in the same week.\n\nEach client has a permanent week assignment (Week 1 through Week 4). Shoot dates follow the client week." },
  { id: "kb5", category: "Client Management", title: "New client onboarding checklist", author: "Jenina L.", updated: "2026-03-25", body: "A new client cannot enter production until all six steps are complete:\n\n1. Contract signed\n2. Invoice paid\n3. Strategy call completed\n4. Shoot date scheduled\n5. Editor assigned\n6. Social manager assigned\n\nNo exceptions. The system enforces this gate. If a step is missing, the Move to Production button stays locked." },
  { id: "kb6", category: "Paid Advertising", title: "Ads management process", author: "Tanya S.", updated: "2026-03-22", body: "Every client running ads must have a visible record in the Ads board showing:\n- Campaign name and platform\n- Status (active, paused, draft, ended)\n- Budget and spend\n- Creative being used\n- Optimization schedule\n\nOptimization reviews happen on the schedule set for each campaign. No campaign should run more than 2 weeks without a review." },
  { id: "kb7", category: "Social Media", title: "Caption writing framework", author: "Marco R.", updated: "2026-03-20", body: "The Hook-Story-CTA Formula\n\nStep 1: The Hook (First Line)\nThis is the only line people see before tapping more. Make it count.\n- Ask a provocative question\n- Lead with a bold stat or claim\n- Start mid-story\n\nStep 2: The Story (Body)\nExpand on the hook with 3 to 5 lines of value. Use short paragraphs and line breaks.\n\nStep 3: The CTA (Last Line)\nTell them exactly what to do: save, share, comment, click link in bio.\n\nPlatform notes:\n- Instagram: 2,200 char max. Front-load value.\n- TikTok: Keep it under 150 chars. Punchy.\n- LinkedIn: Professional tone. Can go longer.\n- Facebook: 1 to 2 sentences. Direct and clear." },
];
