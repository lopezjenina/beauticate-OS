/* ─── Shared ─── */

export type Attachment = {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "document" | "link";
  thumbnailUrl?: string;
  addedAt: string;
};

/* ─── Core Types ─── */

export type Client = {
  id: string;
  name: string;
  initials: string;
  monthlyRevenue: number;
  assignedEditor: string;
  assignedSocialManager: string;
  week: 1 | 2 | 3 | 4;
  status: "active" | "onboarding" | "churned";
  shootDate?: string;
  contactEmail?: string;
  phone?: string;
  package?: string;
  notes?: string;
  graduatedFrom?: string; // onboarding client id
};

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  role: "editor" | "social_manager" | "creative_director" | "ads_manager";
  weeklyVideoCap: number;
};

export type Video = {
  id: string;
  clientId: string;
  editorId: string;
  week: 1 | 2 | 3 | 4;
  title: string;
  shootDate: string;
  dueDate: string;
  footageUploaded: boolean;
  editingStatus: "not_started" | "editing" | "delivered" | "revision" | "approved";
  revisionsUsed: number;
  captionWritten: boolean;
  thumbnailDone: boolean;
  scheduledDate?: string;
  platform: string;
  postingStatus: "pending" | "scheduled" | "posted";
  sentToGuido: boolean;
  posted: boolean;
  notes: Note[];
  attachments?: Attachment[];
};

export type Note = {
  from: string;
  date: string;
  text: string;
  action?: "approve" | "revision";
};

export type Lead = {
  id: string;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  estimatedRevenue: number;
  stage: "lead" | "call" | "proposal" | "follow_up" | "closed_won" | "closed_lost";
  closeDate?: string;
  notes: string;
  createdAt: string;
  attachments?: Attachment[];
};

export type OnboardingClient = {
  id: string;
  name: string;
  leadId?: string;
  package: string;
  startDate: string;
  steps: {
    contractSigned: boolean;
    invoicePaid: boolean;
    strategyCallDone: boolean;
    shootScheduled: boolean;
    editorAssigned: boolean;
    socialManagerAssigned: boolean;
  };
  assignedEditor?: string;
  assignedSocialManager?: string;
  notes?: string;
  contactEmail?: string;
  phone?: string;
};

export type AdCampaign = {
  id: string;
  clientId: string;
  campaignName: string;
  platform: string;
  status: "active" | "paused" | "draft" | "ended";
  budget: number;
  spent: number;
  creative: string;
  optimizationSchedule: string;
  notes: string;
  attachments?: Attachment[];
};

export type KBDoc = {
  id: string;
  category: string;
  title: string;
  author: string;
  updated: string;
  body: string;
  attachments?: Attachment[];
};

