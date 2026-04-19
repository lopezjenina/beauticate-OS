-- Beauticate OS - Supabase Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)

-- ─── Extensions ───
create extension if not exists "uuid-ossp";

-- ─── Cleanup ───
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop table if exists attachments cascade;
drop table if exists video_notes cascade;
drop table if exists activity_log cascade;
drop table if exists ads cascade;
drop table if exists onboarding cascade;
drop table if exists videos cascade;
drop table if exists leads cascade;
drop table if exists kb_docs cascade;
drop table if exists packages cascade;
drop table if exists clients cascade;
drop table if exists profiles cascade;
drop table if exists users cascade;
drop table if exists team_members cascade;

-- ─── Profiles (Linked to Supabase Auth) ───
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('superadmin', 'admin', 'editor', 'videographer', 'social_manager', 'member')),
  permissions jsonb not null default '{}',
  initials text,
  weekly_video_cap integer not null default 22,
  is_active boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- ─── Clients ───
create table clients (
  id text primary key default concat('c-', uuid_generate_v4()::text),
  name text not null,
  initials text not null,
  monthly_revenue numeric not null default 0,
  assigned_editor_id uuid references profiles(id),
  assigned_social_manager_id uuid references profiles(id),
  week integer not null check (week between 1 and 4),
  status text not null default 'onboarding' check (status in ('active', 'onboarding', 'churned')),
  shoot_date text,
  contact_email text,
  phone text,
  package text,
  notes text,
  graduated_from text,
  contact_person text,
  created_at timestamptz default now()
);

alter table clients enable row level security;

-- ─── Videos ───
create table videos (
  id text primary key default concat('v-', uuid_generate_v4()::text),
  client_id text not null references clients(id) on delete cascade,
  editor_id uuid references profiles(id),
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
  notes jsonb default '[]',
  created_at timestamptz default now()
);

alter table videos enable row level security;

-- ─── Leads ───
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

alter table leads enable row level security;

-- ─── Onboarding ───
create table onboarding (
  id text primary key default concat('ob-', uuid_generate_v4()::text),
  name text not null,
  lead_id text references leads(id),
  package text not null default 'Growth',
  start_date text not null,
  -- Flat steps for compatibility with db.ts logic
  contract_signed boolean default false,
  invoice_paid boolean default false,
  strategy_call_done boolean default false,
  shoot_scheduled boolean default false,
  editor_assigned boolean default false,
  social_manager_assigned boolean default false,
  assigned_editor_id uuid references profiles(id),
  assigned_social_manager_id uuid references profiles(id),
  notes text,
  contact_email text,
  phone text,
  contact_person text,
  created_at timestamptz default now()
);

alter table onboarding enable row level security;

-- ─── Ads ───
create table ads (
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

alter table ads enable row level security;

-- ─── Knowledge Base ───
create table kb_docs (
  id text primary key default concat('kb-', uuid_generate_v4()::text),
  category text not null,
  title text not null,
  author_id uuid references profiles(id),
  updated text not null,
  body text not null,
  created_at timestamptz default now()
);

alter table kb_docs enable row level security;

-- ─── Packages ───
create table packages (
  id text primary key default concat('pkg-', uuid_generate_v4()::text),
  name text not null unique,
  description text,
  price numeric not null default 0,
  billing_cycle text not null default 'monthly',
  features jsonb default '[]',
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table packages enable row level security;

-- ─── Activity Log ───
create table activity_log (
  id text primary key default concat('log-', uuid_generate_v4()::text),
  timestamp timestamptz not null default now(),
  user_id uuid references profiles(id),
  action text not null check (action in ('created', 'updated', 'deleted', 'moved', 'approved', 'rejected')),
  entity text not null check (entity in ('lead', 'client', 'video', 'campaign', 'document', 'user', 'onboarding')),
  entity_name text not null,
  details text,
  created_at timestamptz default now()
);

alter table activity_log enable row level security;

-- ─── Attachments ───
create table attachments (
  id text primary key default concat('att-', uuid_generate_v4()::text),
  name text not null,
  url text not null constraint url_format check (url ~* '^https?://'),
  type text not null check (type in ('image', 'video', 'document', 'link')),
  thumbnail_url text,
  added_at text not null,
  video_id text references videos(id) on delete cascade,
  lead_id text references leads(id) on delete cascade,
  ad_id text references ads(id) on delete cascade,
  kb_doc_id text references kb_docs(id) on delete cascade,
  created_at timestamptz default now()
);

alter table attachments enable row level security;

-- ─── Indexes ───
create index idx_clients_status on clients(status);
create index idx_videos_client on videos(client_id);
create index idx_profiles_role on profiles(role);
create index idx_activity_log_timestamp on activity_log(timestamp);

-- ─── Functions ───
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Policies ───
-- All operations require an authenticated Supabase Auth session.
-- The anon key alone cannot read or write any table.
create policy "Authenticated full access to profiles" on profiles for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to clients" on clients for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to videos" on videos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to leads" on leads for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to onboarding" on onboarding for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to ads" on ads for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to kb_docs" on kb_docs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to packages" on packages for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to activity_log" on activity_log for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated full access to attachments" on attachments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

