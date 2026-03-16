import { RoleConfig } from '@/types';

export const WEEKLY_TARGET = 86;

export const ROLES: Record<string, RoleConfig> = {
  admin: { label: 'Admin', color: '#7F77DD', boards: ['dashboard', 'sales', 'onboarding', 'production', 'publishing', 'ads', 'activity', 'users', 'chat'], canEdit: true, canDelete: true, canManageUsers: true },
  editor: { label: 'Editor', color: '#378ADD', boards: ['production', 'publishing', 'chat'], canEdit: true, canDelete: false, canManageUsers: false },
  social: { label: 'Social', color: '#1D9E75', boards: ['publishing', 'chat'], canEdit: true, canDelete: false, canManageUsers: false },
  viewer: { label: 'Viewer', color: '#888780', boards: ['dashboard', 'production', 'publishing', 'chat'], canEdit: false, canDelete: false, canManageUsers: false },
};

export const EDITORS = ['Sergio', 'Rodrigo', 'Alex', 'Araceli'];
export const VIDEOGRAPHERS = ['Videographer 1', 'Videographer 2', 'Videographer 3'];
export const PLATFORMS = ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'Facebook', 'LinkedIn', 'Twitter/X'];
export const PACKAGES = ['4 Videos/Month', '6 Videos/Month', '8 Videos/Month', '10 Videos/Month', '12 Videos/Month', 'Custom'];
export const LEAD_SOURCES = ['Referral', 'Facebook Ad', 'Instagram DM', 'Cold Outreach', 'Website', 'LinkedIn', 'TikTok Ad', 'Other'];

export const SALES_STAGES = [
  { key: 'lead', label: 'Lead', color: '#7F77DD' },
  { key: 'call', label: 'Call booked', color: '#378ADD' },
  { key: 'proposal', label: 'Proposal', color: '#1D9E75' },
  { key: 'follow_up', label: 'Follow up', color: '#EF9F27' },
  { key: 'closed_won', label: 'Closed won', color: '#639922' },
  { key: 'closed_lost', label: 'Closed lost', color: '#E24B4A' },
] as const;

export const PUBLISH_STATUSES = [
  { key: 'pending_caption', label: 'Needs caption', color: '#E24B4A' },
  { key: 'approved', label: 'Approved', color: '#EF9F27' },
  { key: 'scheduled', label: 'Scheduled', color: '#378ADD' },
  { key: 'posted', label: 'Posted', color: '#639922' },
] as const;

export const AD_STATUSES = [
  { key: 'draft', label: 'Draft', color: '#888780' },
  { key: 'active', label: 'Active', color: '#639922' },
  { key: 'paused', label: 'Paused', color: '#EF9F27' },
  { key: 'completed', label: 'Completed', color: '#378ADD' },
] as const;

export const CONTENT_STAGES = [
  { key: 'shoot', label: 'Shoot', color: '#7F77DD' },
  { key: 'edit', label: 'Edit', color: '#378ADD' },
  { key: 'approval', label: 'Approval', color: '#EF9F27' },
  { key: 'sent_guido', label: 'To Guido', color: '#1D9E75' },
  { key: 'posted', label: 'Posted', color: '#639922' },
] as const;

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { key: 'sales', label: 'Sales Pipeline', icon: 'DollarSign' },
  { key: 'onboarding', label: 'Onboarding', icon: 'Shield' },
  { key: 'production', label: 'Production', icon: 'Video' },
  { key: 'publishing', label: 'Publishing', icon: 'Upload' },
  { key: 'ads', label: 'Ads', icon: 'Megaphone' },
  { key: 'activity', label: 'Activity Log', icon: 'Clock' },
  { key: 'users', label: 'Team Management', icon: 'Users' },
  { key: 'chat', label: 'Channels', icon: 'MessageSquare' },
] as const;

// Pre-authorized team emails and their roles
export const TEAM_EMAILS: Record<string, { name: string; role: string }> = {
  'angelguerrero1999@gmail.com': { name: 'Angel', role: 'admin' },
  'viralvisionmk@gmail.com': { name: 'Santiago', role: 'admin' },
  'jeninalopezz@gmail.com': { name: 'Jenina', role: 'admin' },
  'hello@jenlopez.site': { name: 'Jenina', role: 'admin' },
  'storres1524@gmail.com': { name: 'Sergio', role: 'editor' },
  'jrbp.contato@gmail.com': { name: 'Rodrigo', role: 'editor' },
  'alex10soccer2@gmail.com': { name: 'Alex', role: 'editor' },
  'ariech0608@gmail.com': { name: 'Araceli', role: 'editor' },
  'guidostorchdesign@gmail.com': { name: 'Guido', role: 'social' },
};
