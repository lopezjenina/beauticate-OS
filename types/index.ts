export type UserRole = 'admin' | 'editor' | 'social' | 'viewer';
export type SalesStage = 'lead' | 'call' | 'proposal' | 'follow_up' | 'closed_won' | 'closed_lost';
export type PublishStatus = 'pending_caption' | 'approved' | 'scheduled' | 'posted';
export type AdStatus = 'draft' | 'active' | 'paused' | 'completed';
export type ClientStatus = 'on_track' | 'behind' | 'complete';
export type LogType = 'success' | 'info' | 'warning' | 'error';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  deal_value: number;
  stage: SalesStage;
  source: string;
  notes: string;
  assigned_to: string | null;
  deal_date: string;
  created_at: string;
  updated_at: string;
  // Joined
  assigned_profile?: Profile;
}

export interface OnboardingItem {
  id: string;
  client_name: string;
  contract_signed: boolean;
  invoice_paid: boolean;
  strategy_called: boolean;
  shoot_scheduled: boolean;
  editor_assigned: string;
  social_assigned: string;
  shoot_date: string | null;
  videographer: string;
  package_type: string;
  notes: string;
  status: 'in_progress' | 'complete';
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  editor: string;
  videographer: string;
  week_num: number;
  videos_target: number;
  videos_complete: number;
  shoot_date: string | null;
  next_shoot: string | null;
  status: ClientStatus;
  package_type: string;
  notes: string;
  stage_shoot: number;
  stage_edit: number;
  stage_approval: number;
  stage_sent_guido: number;
  stage_posted: number;
  created_at: string;
}

export interface PublishItem {
  id: string;
  client_name: string;
  title: string;
  caption: string;
  scheduled_date: string | null;
  platform: string;
  status: PublishStatus;
  week_num: number;
  created_at: string;
}

export interface AdCampaign {
  id: string;
  client_name: string;
  campaign_name: string;
  status: AdStatus;
  budget: number;
  spent: number;
  creative: string;
  platform: string;
  next_optimization: string | null;
  start_date: string | null;
  notes: string;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  detail: string;
  board: string;
  log_type: LogType;
  user_name: string;
  user_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
}

export interface RoleConfig {
  label: string;
  color: string;
  boards: string[];
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}
