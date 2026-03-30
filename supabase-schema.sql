-- Agency OS - Supabase Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Team Members ───
create table team_members (
  id text primary key,
  name text not null,
  initials text not null,
  role text not null check (role in ('editor', 'social_manager', 'creative_director', 'ads_manager')),
  weekly_video_cap integer not null default 0,
  created_at timestamptz default now()
);

-- ─── Clients ───
create table clients (
  id text primary key default concat('c-', uuid_generate_v4()::text),
  name text not null,
  initials text not null,
  monthly_revenue numeric not null default 0,
  assigned_editor text references team_members(id),
  assigned_social_manager text references team_members(id),
  week integer not null check (week between 1 and 4),
  status text not null default 'active' check (status in ('active', 'onboarding', 'churned')),
  shoot_date text,
  created_at timestamptz default now()
);

-- ─── Videos (Central Pipeline Model) ───
create table videos (
  id text primary key default concat('v-', uuid_generate_v4()::text),
  client_id text not null references clients(id) on delete cascade,
  editor_id text references team_members(id),
  week integer not null check (week between 1 and 4),
  title text not null,
  shoot_date text not null,
  due_date text not null,
  footage_uploaded boolean default false,
  editing_status text not null default 'not_started'
    check (editing_status in ('not_started', 'editing', 'delivered', 'revision', 'approved')),
  revisions_used integer default 0,
  caption_written boolean default false,
  thumbnail_done boolean default false,
  scheduled_date text,
  platform text not null default 'TikTok',
  posting_status text not null default 'pending'
    check (posting_status in ('pending', 'scheduled', 'posted')),
  sent_to_guido boolean default false,
  posted boolean default false,
  created_at timestamptz default now()
);

-- ─── Video Notes ───
create table video_notes (
  id uuid primary key default uuid_generate_v4(),
  video_id text not null references videos(id) on delete cascade,
  from_user text not null,
  date text not null,
  text text not null,
  action text check (action in ('approve', 'revision')),
  created_at timestamptz default now()
);

-- ─── Leads (Sales Pipeline) ───
create table leads (
  id text primary key default concat('l-', uuid_generate_v4()::text),
  contact_name text not null,
  company text not null,
  email text,
  phone text,
  source text not null default 'referral',
  estimated_revenue numeric default 0,
  stage text not null default 'lead'
    check (stage in ('lead', 'call', 'proposal', 'follow_up', 'closed_won', 'closed_lost')),
  close_date text,
  notes text,
  created_at timestamptz default now()
);

-- ─── Onboarding Clients ───
create table onboarding_clients (
  id text primary key default concat('ob-', uuid_generate_v4()::text),
  name text not null,
  lead_id text references leads(id),
  package text not null default 'Growth',
  start_date text not null,
  contract_signed boolean default false,
  invoice_paid boolean default false,
  strategy_call_done boolean default false,
  shoot_scheduled boolean default false,
  editor_assigned boolean default false,
  social_manager_assigned boolean default false,
  assigned_editor text references team_members(id),
  assigned_social_manager text references team_members(id),
  created_at timestamptz default now()
);

-- ─── Ad Campaigns ───
create table ad_campaigns (
  id text primary key default concat('ad-', uuid_generate_v4()::text),
  client_id text not null references clients(id) on delete cascade,
  campaign_name text not null,
  platform text not null default 'Meta',
  status text not null default 'draft'
    check (status in ('active', 'paused', 'draft', 'ended')),
  budget numeric default 0,
  spent numeric default 0,
  creative text,
  optimization_schedule text,
  notes text,
  created_at timestamptz default now()
);

-- ─── Knowledge Base Documents ───
create table kb_docs (
  id text primary key default concat('kb-', uuid_generate_v4()::text),
  category text not null,
  title text not null,
  author text not null,
  updated text not null,
  body text not null,
  created_at timestamptz default now()
);

-- ─── Indexes for Performance ───
create index idx_videos_client on videos(client_id);
create index idx_videos_editor on videos(editor_id);
create index idx_videos_week on videos(week);
create index idx_videos_editing_status on videos(editing_status);
create index idx_videos_posting_status on videos(posting_status);
create index idx_video_notes_video on video_notes(video_id);
create index idx_leads_stage on leads(stage);
create index idx_clients_status on clients(status);
create index idx_clients_week on clients(week);
create index idx_ad_campaigns_client on ad_campaigns(client_id);
create index idx_ad_campaigns_status on ad_campaigns(status);

-- ─── Row Level Security (RLS) ───
-- Enable RLS on all tables (configure policies after setting up auth)
alter table team_members enable row level security;
alter table clients enable row level security;
alter table videos enable row level security;
alter table video_notes enable row level security;
alter table leads enable row level security;
alter table onboarding_clients enable row level security;
alter table ad_campaigns enable row level security;
alter table kb_docs enable row level security;

-- Basic policy: authenticated users can read/write all data
-- (Tighten these based on roles once auth is fully configured)
create policy "Authenticated users full access" on team_members
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on clients
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on videos
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on video_notes
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on leads
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on onboarding_clients
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on ad_campaigns
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on kb_docs
  for all using (auth.role() = 'authenticated');

-- ─── Seed: Team Members ───
insert into team_members (id, name, initials, role, weekly_video_cap) values
  ('alex', 'Alex', 'AX', 'editor', 22),
  ('araceli', 'Araceli', 'AR', 'editor', 22),
  ('leonardo', 'Leonardo', 'LE', 'editor', 22),
  ('rodrigo', 'Rodrigo', 'RO', 'editor', 20),
  ('guido', 'Guido', 'GU', 'creative_director', 0),
  ('jenina', 'Jenina', 'JE', 'social_manager', 0),
  ('tanya', 'Tanya', 'TA', 'social_manager', 0);
