-- Agency OS - Supabase Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Drop existing tables (order matters due to foreign keys) ───
drop table if exists attachments cascade;
drop table if exists video_notes cascade;
drop table if exists activity_log cascade;
drop table if exists ad_campaigns cascade;
drop table if exists onboarding_clients cascade;
drop table if exists videos cascade;
drop table if exists leads cascade;
drop table if exists kb_docs cascade;
drop table if exists packages cascade;
drop table if exists clients cascade;
drop table if exists users cascade;
drop table if exists team_members cascade;

-- ─── Team Members ───
create table team_members (
  id text primary key,
  name text not null,
  initials text not null,
  role text not null check (role in ('editor', 'videographer', 'social_manager', 'creative_director', 'admin')),
  weekly_video_cap integer not null default 0,
  created_at timestamptz default now()
);

-- ─── Users (App Auth) ───
create table users (
  id text primary key,
  username text not null unique,
  email text not null default '',
  password text not null,
  role text not null check (role in ('superadmin', 'admin', 'editor', 'videographer', 'social_manager', 'member')),
  permissions jsonb not null default '{}',
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
  contact_email text,
  phone text,
  package text,
  notes text,
  graduated_from text,
  contact_person text,
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

-- ─── Attachments (shared across entities) ───
create table attachments (
  id text primary key default concat('att-', uuid_generate_v4()::text),
  name text not null,
  url text not null,
  type text not null check (type in ('image', 'video', 'document', 'link')),
  thumbnail_url text,
  added_at text not null,
  -- Polymorphic reference: one of these will be set
  video_id text references videos(id) on delete cascade,
  lead_id text,  -- forward reference, set after leads table
  ad_campaign_id text,  -- forward reference, set after ad_campaigns table
  kb_doc_id text,  -- forward reference, set after kb_docs table
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
  notes text,
  contact_email text,
  phone text,
  contact_person text,
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

-- ─── Activity Log ───
create table activity_log (
  id text primary key default concat('log-', uuid_generate_v4()::text),
  timestamp timestamptz not null default now(),
  "user" text not null,
  action text not null check (action in ('created', 'updated', 'deleted', 'moved', 'approved', 'rejected')),
  entity text not null check (entity in ('lead', 'client', 'video', 'campaign', 'document', 'user', 'onboarding')),
  entity_name text not null,
  details text,
  created_at timestamptz default now()
);

-- ─── Add foreign keys for attachments (deferred references) ───
alter table attachments
  add constraint fk_attachments_lead foreign key (lead_id) references leads(id) on delete cascade;
alter table attachments
  add constraint fk_attachments_ad_campaign foreign key (ad_campaign_id) references ad_campaigns(id) on delete cascade;
alter table attachments
  add constraint fk_attachments_kb_doc foreign key (kb_doc_id) references kb_docs(id) on delete cascade;

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
create index idx_attachments_video on attachments(video_id);
create index idx_attachments_lead on attachments(lead_id);
create index idx_attachments_ad_campaign on attachments(ad_campaign_id);
create index idx_attachments_kb_doc on attachments(kb_doc_id);
create index idx_activity_log_entity on activity_log(entity);
create index idx_activity_log_user on activity_log("user");
create index idx_activity_log_timestamp on activity_log(timestamp);
create index idx_users_username on users(username);
create index idx_packages_is_active on packages(is_active);

-- ─── Row Level Security (RLS) ───
-- Enable RLS on all tables (configure policies after setting up auth)
alter table team_members enable row level security;
alter table users enable row level security;
alter table clients enable row level security;
alter table videos enable row level security;
alter table video_notes enable row level security;
alter table leads enable row level security;
alter table onboarding_clients enable row level security;
alter table ad_campaigns enable row level security;
alter table kb_docs enable row level security;
alter table packages enable row level security;
alter table activity_log enable row level security;
alter table attachments enable row level security;

-- Basic policy: authenticated users can read/write all data
-- (Tighten these based on roles once auth is fully configured)
create policy "Authenticated users full access" on team_members
  for all using (true) with check (true);

create policy "Authenticated users full access" on users
  for all using (true) with check (true);

create policy "Authenticated users full access" on clients
  for all using (true) with check (true);

create policy "Authenticated users full access" on videos
  for all using (true) with check (true);

create policy "Authenticated users full access" on video_notes
  for all using (true) with check (true);

create policy "Authenticated users full access" on leads
  for all using (true) with check (true);

create policy "Authenticated users full access" on onboarding_clients
  for all using (true) with check (true);

create policy "Authenticated users full access" on ad_campaigns
  for all using (true) with check (true);

create policy "Authenticated users full access" on kb_docs
  for all using (true) with check (true);

create policy "Authenticated users full access" on packages
  for all using (true) with check (true);

create policy "Authenticated users full access" on activity_log
  for all using (true) with check (true);

create policy "Authenticated users full access" on attachments
  for all using (true) with check (true);

-- ─── Seed: Team Members ───
insert into team_members (id, name, initials, role, weekly_video_cap) values
  ('e1', 'Alex', 'AL', 'editor', 22),
  ('e2', 'Araceli', 'AR', 'editor', 22),
  ('e3', 'Leonardo', 'LE', 'editor', 22),
  ('e4', 'Rodrigo', 'RO', 'editor', 20),
  ('e5', 'Sergio', 'SE', 'videographer', 20),
  ('e6', 'Javier', 'JA', 'editor', 22),
  ('e7', 'Santi', 'SA', 'editor', 22),
  ('sm1', 'Guido', 'GU', 'social_manager', 0),
  ('cd1', 'Jenina', 'JE', 'creative_director', 0),
  ('a1', 'Angel', 'AN', 'admin', 0),
  ('a2', 'Santiago', 'ST', 'admin', 0);

-- ─── Seed: Users ───
-- NOTE: Passwords stored as plaintext for now. Will be migrated to Supabase Auth later.
insert into users (id, username, email, password, role, permissions) values
  ('u1', 'Jenina', 'jeninalopezz@gmail.com', 'vv-jenina', 'superadmin',
    '{"dashboard":true,"calendar":true,"sales":true,"onboarding":true,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":true,"packages":true,"knowledge":true,"clients":true,"activity":true}'::jsonb),
  ('u2', 'Angel', 'angelguerrero1999@gmail.com', 'vv-angel', 'admin',
    '{"dashboard":true,"calendar":true,"sales":true,"onboarding":true,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":true,"packages":true,"knowledge":true,"clients":true,"activity":true}'::jsonb),
  ('u3', 'Santiago', 'viralvisionmk@gmail.com', 'vv-santiago', 'admin',
    '{"dashboard":true,"calendar":true,"sales":true,"onboarding":true,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":true,"packages":true,"knowledge":true,"clients":true,"activity":true}'::jsonb),
  ('u4', 'Guido', 'guidostorchdesign@gmail.com', 'vv-guido', 'social_manager',
    '{"dashboard":true,"calendar":true,"sales":true,"onboarding":true,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":true,"packages":true,"knowledge":true,"clients":true,"activity":true}'::jsonb),
  ('u5', 'Alex', 'alex10soccer2@gmail.com', 'vv-alex', 'editor',
    '{"dashboard":false,"calendar":false,"sales":false,"onboarding":false,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":false,"packages":false,"knowledge":true,"clients":false,"activity":true}'::jsonb),
  ('u6', 'Araceli', 'ariech0608@gmail.com', 'vv-araceli', 'editor',
    '{"dashboard":false,"calendar":false,"sales":false,"onboarding":false,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":false,"packages":false,"knowledge":true,"clients":false,"activity":true}'::jsonb),
  ('u7', 'Sergio', 'storres1524@gmail.com', 'vv-sergio', 'videographer',
    '{"dashboard":false,"calendar":false,"sales":false,"onboarding":false,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":false,"packages":false,"knowledge":true,"clients":false,"activity":true}'::jsonb),
  ('u8', 'Rodrigo', 'jrbp.contato@gmail.com', 'vv-rodrigo', 'editor',
    '{"dashboard":false,"calendar":false,"sales":false,"onboarding":false,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":false,"packages":false,"knowledge":true,"clients":false,"activity":true}'::jsonb),
  ('u9', 'Javier', '', 'vv-javier', 'editor',
    '{"dashboard":false,"calendar":false,"sales":false,"onboarding":false,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":false,"packages":false,"knowledge":true,"clients":false,"activity":true}'::jsonb),
  ('u10', 'Leonardo', '', 'vv-leonardo', 'editor',
    '{"dashboard":false,"calendar":false,"sales":false,"onboarding":false,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":false,"packages":false,"knowledge":true,"clients":false,"activity":true}'::jsonb),
  ('u11', 'Santi', '', 'vv-santi', 'editor',
    '{"dashboard":false,"calendar":false,"sales":false,"onboarding":false,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":false,"packages":false,"knowledge":true,"clients":false,"activity":true}'::jsonb);

-- ─── Seed: Clients ───
insert into clients (id, name, initials, monthly_revenue, assigned_editor, assigned_social_manager, week, status) values
  -- Araceli's clients
  ('c1', 'Castaways', 'CA', 0, 'e2', 'sm1', 1, 'active'),
  ('c2', 'Juniors Kenya', 'JK', 0, 'e2', 'sm1', 1, 'active'),
  ('c3', 'Hicksville', 'HI', 0, 'e2', 'sm1', 2, 'active'),
  ('c4', 'Pizza Star', 'PS', 0, 'e2', 'sm1', 2, 'active'),
  ('c5', 'Viva Birria', 'VB', 0, 'e2', 'sm1', 3, 'active'),
  -- Sergio's clients
  ('c6', 'Casa Birria', 'CB', 0, 'e5', 'sm1', 1, 'active'),
  ('c7', 'Silk City', 'SC', 0, 'e5', 'sm1', 1, 'active'),
  ('c8', 'Kelly''s Pub', 'KP', 0, 'e5', 'sm1', 2, 'active'),
  ('c9', 'Luminere', 'LU', 0, 'e5', 'sm1', 2, 'active'),
  ('c10', 'Bartending School', 'BS', 0, 'e5', 'sm1', 3, 'active'),
  ('c11', 'Roosevelt Projects', 'RP', 0, 'e5', 'sm1', 3, 'active'),
  -- Rodrigo's clients
  ('c12', 'Supra', 'SU', 0, 'e4', 'sm1', 1, 'active'),
  ('c13', 'Taco Express', 'TE', 0, 'e4', 'sm1', 2, 'active'),
  ('c14', 'Nanus', 'NA', 0, 'e4', 'sm1', 2, 'active'),
  ('c15', 'American Grill', 'AG', 0, 'e4', 'sm1', 3, 'active'),
  ('c16', 'Slappin', 'SL', 0, 'e4', 'sm1', 3, 'active'),
  ('c17', 'Lenny''s', 'LE', 0, 'e4', 'sm1', 4, 'active'),
  -- Alex's clients
  ('c18', 'BAM', 'BA', 0, 'e1', 'sm1', 1, 'active'),
  ('c19', 'Lyfestyle', 'LY', 0, 'e1', 'sm1', 2, 'active'),
  ('c20', 'Asadero', 'AS', 0, 'e1', 'sm1', 3, 'active'),
  ('c21', 'Kinya Linden', 'KL', 0, 'e1', 'sm1', 4, 'active'),
  -- Javier's client
  ('c22', 'Sculpt Fitness', 'SF', 0, 'e6', 'sm1', 1, 'active'),
  -- Leonardo's client
  ('c23', 'Black Moon', 'BM', 0, 'e3', 'sm1', 1, 'active');

-- ─── Seed: Packages ───
insert into packages (id, name, description, price, billing_cycle, features, is_active) values
  ('pkg-starter', 'Starter', 'Perfect for businesses just getting started with video marketing', 1500, 'monthly',
    '["4 videos per month", "1 shoot day per month", "Basic editing", "1 platform", "Email support"]'::jsonb, true),
  ('pkg-growth', 'Growth', 'For growing businesses ready to scale their content', 2500, 'monthly',
    '["8 videos per month", "2 shoot days per month", "Advanced editing", "2 platforms", "Caption writing", "Priority support"]'::jsonb, true),
  ('pkg-pro', 'Pro', 'Full-service video marketing for established businesses', 4000, 'monthly',
    '["16 videos per month", "4 shoot days per month", "Premium editing", "3 platforms", "Caption writing", "Thumbnail design", "Publishing management", "Dedicated editor"]'::jsonb, true),
  ('pkg-enterprise', 'Enterprise', 'Custom solution for high-volume clients', 7500, 'monthly',
    '["Unlimited videos", "Weekly shoots", "Premium editing", "All platforms", "Full social management", "Ad campaign management", "Dedicated team", "Priority scheduling"]'::jsonb, true);

-- ─── Seed: Knowledge Base Documents ───
insert into kb_docs (id, category, title, author, updated, body) values
  ('kb1', 'Content Pipeline', '5-stage pipeline overview', 'Jenina', '2026-03-28',
    E'Every piece of content follows five stages:\n\n1. Shoot -- Footage is captured on the scheduled shoot date.\n2. Edit -- Assigned editor produces the final cut.\n3. Internal Approval -- Creative Director or owner signs off.\n4. Sent to Guido -- Approved content enters the publishing queue.\n5. Posted -- Content goes live on the scheduled platform.\n\nNo stage can be skipped. Content must be approved before it reaches publishing. Publishing must be scheduled at least 7 days ahead of the post date.'),

  ('kb2', 'Editing', 'Editor weekly capacity rules', 'Jenina', '2026-03-28',
    E'Weekly target: 86 videos across all editors.\n\nIndividual caps:\n- Alex: 22 videos/week\n- Araceli: 22 videos/week\n- Sergio: 20 videos/week\n- Rodrigo: 20 videos/week\n- Javier: 22 videos/week\n- Leonardo: 22 videos/week\n- Santi: 22 videos/week\n\nIf an editor hits their cap, no additional videos can be assigned until the following week.\n\nRevision policy: 1 revision round included per video. A second revision triggers a warning and must be approved by the Creative Director.'),

  ('kb3', 'Publishing', 'Guido publishing rules', 'Jenina', '2026-03-28',
    E'Content must always be scheduled 7 days ahead of the post date. No same-day posting from fresh edits.\n\nBefore scheduling, every video must have:\n- Caption written and reviewed\n- Thumbnail created\n- Platform selected\n- Scheduled date confirmed\n\nGuido should be scheduling content every day. If the queue runs dry, escalate immediately.'),

  ('kb4', 'Content Pipeline', 'Shoot scheduling rules', 'Jenina', '2026-03-28',
    E'Max 6 client shoots per week. No exceptions.\n\nShoots are locked 60 days in advance. Canceled shoots cannot be replaced in the same week.\n\nEach client has a permanent week assignment (Week 1 through Week 4). Shoot dates follow the client week.'),

  ('kb5', 'Client Management', 'New client onboarding checklist', 'Jenina', '2026-03-25',
    E'A new client cannot enter production until all six steps are complete:\n\n1. Contract signed\n2. Invoice paid\n3. Strategy call completed\n4. Shoot date scheduled\n5. Editor assigned\n6. Social manager assigned\n\nNo exceptions. The system enforces this gate. If a step is missing, the Move to Production button stays locked.'),

  ('kb6', 'Paid Advertising', 'Ads management process', 'Jenina', '2026-03-22',
    E'Every client running ads must have a visible record in the Ads board showing:\n- Campaign name and platform\n- Status (active, paused, draft, ended)\n- Budget and spend\n- Creative being used\n- Optimization schedule\n\nOptimization reviews happen on the schedule set for each campaign. No campaign should run more than 2 weeks without a review.'),

  ('kb7', 'Social Media', 'Caption writing framework', 'Jenina', '2026-03-20',
    E'The Hook-Story-CTA Formula\n\nStep 1: The Hook (First Line)\nThis is the only line people see before tapping more. Make it count.\n- Ask a provocative question\n- Lead with a bold stat or claim\n- Start mid-story\n\nStep 2: The Story (Body)\nExpand on the hook with 3 to 5 lines of value. Use short paragraphs and line breaks.\n\nStep 3: The CTA (Last Line)\nTell them exactly what to do: save, share, comment, click link in bio.\n\nPlatform notes:\n- Instagram: 2,200 char max. Front-load value.\n- TikTok: Keep it under 150 chars. Punchy.\n- LinkedIn: Professional tone. Can go longer.\n- Facebook: 1 to 2 sentences. Direct and clear.'),

  ('kb-sop-editor', 'SOPs', 'SOP: Editor', 'Jenina', '2026-03-31',
    E'STANDARD OPERATING PROCEDURE -- EDITOR\n\nRole: Produce final video edits on time and within revision limits.\n\nDaily Workflow:\n1. Log in to Agency OS and go to Production.\n2. Check your assigned videos for the current week.\n3. For each video in your queue:\n   a. Confirm footage is uploaded (checkbox must be checked).\n   b. If footage is missing, flag it immediately -- do not wait.\n   c. Begin editing and set status to \"Editing\".\n4. When the edit is complete, set status to \"Delivered\".\n5. The video will automatically appear in Approvals for review.\n6. If a revision is requested, you will see the video back in your queue with status \"Revision\" and notes from the reviewer.\n7. Apply the requested changes and set status back to \"Delivered\".\n\nRevision Policy:\n- 1 revision round is included per video.\n- A second revision triggers a warning. The Creative Director must approve it.\n- If you disagree with a revision request, message the reviewer directly -- do not ignore it.\n\nCapacity:\n- Your weekly cap is shown on the Editors page.\n- Do not accept work beyond your cap. If you are overloaded, notify the Creative Director.\n- Check the Editors page to see your current load vs. capacity.\n\nQuality Standards:\n- Every video must match the client''s brand guidelines.\n- Audio must be clean -- no background noise unless intentional.\n- Color grading must be consistent across all videos for the same client.\n- Captions/subtitles must be accurate if included.\n- Export at the correct resolution for the target platform.\n\nWhat NOT to Do:\n- Do not change a video''s status to \"Approved\" -- only reviewers can do that.\n- Do not skip the \"Delivered\" step.\n- Do not work on videos assigned to other editors without approval.\n- Do not access Sales, Ads, Clients, or Onboarding pages -- these are admin-only.'),

  ('kb-sop-social', 'SOPs', 'SOP: Social Media Manager', 'Jenina', '2026-03-31',
    E'STANDARD OPERATING PROCEDURE -- SOCIAL MEDIA MANAGER (GUIDO)\n\nRole: Schedule and publish all approved content across platforms.\n\nDaily Workflow:\n1. Log in to Agency OS and go to Publishing.\n2. Review all videos in the publishing queue (approved + sent to Guido).\n3. For each video:\n   a. Confirm caption is written -- toggle \"Caption\" to Done.\n   b. Confirm thumbnail is created -- toggle \"Thumbnail\" to Done.\n   c. Select all target platforms (Instagram, TikTok, Facebook, YouTube).\n   d. Set the scheduled date -- must be at least 7 days from today.\n   e. Change posting status to \"Scheduled\".\n4. On the scheduled date, publish the content on each platform.\n5. After publishing, change posting status to \"Posted\".\n\nCaption Writing:\n- Follow the Hook-Story-CTA framework (see Knowledge Base).\n- Instagram: up to 2,200 chars, front-load value.\n- TikTok: keep under 150 chars, punchy.\n- Facebook: 1-2 sentences, direct.\n- YouTube: include keywords for SEO in title and description.\n\nScheduling Rules:\n- Content must be scheduled at least 7 days ahead. No same-day posting.\n- Schedule content every day. If the queue runs dry, escalate to the Creative Director immediately.\n- Check the Calendar page for an overview of upcoming publish dates.\n\nPlatform-Specific Notes:\n- Instagram: Post Reels and carousels. Stories for BTS content.\n- TikTok: Prioritize trending audio. First 3 seconds must hook.\n- Facebook: Cross-post from Instagram when appropriate.\n- YouTube: Shorts for repurposed content. Long-form for tutorials/testimonials.\n\nWhat NOT to Do:\n- Do not publish content that hasn''t been approved in the Approvals page.\n- Do not skip the caption or thumbnail step.\n- Do not schedule content for the same day it was approved.\n- Do not change video editing statuses -- that''s the editor''s job.'),

  ('kb-sop-videographer', 'SOPs', 'SOP: Videographer', 'Jenina', '2026-03-31',
    E'STANDARD OPERATING PROCEDURE -- VIDEOGRAPHER (SERGIO)\n\nRole: Capture footage on shoot days and upload to the production pipeline. Also edits assigned videos.\n\nShoot Day Workflow:\n1. Check the Calendar and Production pages for scheduled shoots.\n2. Confirm equipment is ready the day before:\n   - Camera, lenses, batteries charged\n   - Audio equipment (lav mic, shotgun mic)\n   - Lighting kit if indoor shoot\n   - Memory cards formatted\n3. Arrive at the client location on time. No exceptions.\n4. Capture all required footage per the shoot brief:\n   - B-roll of the business (interior, exterior, product, process)\n   - Talking head / testimonial if planned\n   - Action shots for Reels/TikTok\n   - Multiple angles for flexibility in editing\n5. After the shoot, upload all footage the same day.\n6. In Production, check the \"Footage Uploaded\" checkbox for each video.\n\nEditing (Dual Role):\n- Sergio also edits videos for assigned clients.\n- Follow the Editor SOP for all editing tasks.\n- Editing takes priority over re-shoots. Complete current edits before scheduling new shoots.\n\nShoot Scheduling Rules:\n- Max 6 client shoots per week across the agency.\n- Shoots are locked 60 days in advance.\n- Canceled shoots cannot be replaced in the same week.\n- Each client''s shoot follows their permanent week assignment (Week 1-4).\n\nFootage Standards:\n- Shoot in 4K when possible (minimum 1080p).\n- Record audio separately when using a lav mic.\n- White balance must be set correctly for each location.\n- Capture at least 30 seconds of clean B-roll per setup.\n- Label all files clearly: ClientName_Date_ClipNumber.\n\nWhat NOT to Do:\n- Do not leave footage on memory cards overnight -- upload the same day.\n- Do not skip the \"Footage Uploaded\" checkbox. Editors are waiting on it.\n- Do not schedule shoots without confirming with the Creative Director.\n- Do not delete raw footage until the video has been approved and posted.'),

  ('kb-sop-admin', 'SOPs', 'SOP: Admin (Santiago / Angel)', 'Jenina', '2026-03-31',
    E'STANDARD OPERATING PROCEDURE -- ADMIN\n\nRole: Oversee all agency operations, manage clients and sales pipeline, make strategic decisions.\n\nDaily Check-In:\n1. Log in and review the Dashboard for key metrics:\n   - Active clients, MRR, videos this week, ad spend\n   - Pipeline health and conversion rate\n   - Bottleneck alerts (editors over capacity, content not scheduled ahead, stuck clients)\n2. Check Notifications for items needing attention.\n3. Review the Activity Log for recent changes across the workspace.\n\nSales Pipeline:\n1. Go to Sales to manage leads.\n2. Create new leads with all required info (contact, company, email, phone, source, estimated revenue).\n3. Move leads through stages: Lead > Call > Proposal > Follow Up > Closed Won / Closed Lost.\n4. When moving to \"Closed Won\":\n   - A confirmation popup will appear.\n   - An onboarding entry is auto-created.\n   - A celebration notification confirms the deal.\n5. Track conversion rates and pipeline value on the Dashboard.\n\nOnboarding:\n1. Go to Onboarding to manage new clients.\n2. Complete all 6 checklist steps:\n   - Contract signed\n   - Invoice paid\n   - Strategy call done\n   - Shoot scheduled\n   - Editor assigned (select from dropdown)\n   - Social manager assigned (select from dropdown)\n3. Set the package and fill in contact details.\n4. Once all steps are complete, select a week (1-4) and click \"Move to Production\".\n5. The client will appear in the Clients page and Production page.\n\nClient Management:\n1. Go to Clients to view all active clients.\n2. Edit package, revenue, week assignment, or status inline.\n3. Monitor for churned clients and update status.\n\nAds Management:\n1. Go to Ads to create and manage campaigns.\n2. Track budget, spend, and ROAS for each campaign.\n3. Review and optimize on the schedule set for each campaign.\n4. Pause underperforming campaigns. Scale winners.\n\nUser Management (Jenina only):\n1. Go to Users to add, edit, or remove team members.\n2. Set roles and board-level permissions.\n3. Only admins (Jenina, Angel, Santiago) can delete entries across the app.\n\nWeekly Review:\n- Review editor workload on the Editors page.\n- Click \"Suggest Rebalance\" if any editor is over capacity.\n- Check that all approved videos are scheduled in Publishing.\n- Export reports from Dashboard as needed (CSV).\n\nWhat NOT to Do:\n- Do not delete entries unless absolutely necessary -- deletions are logged.\n- Do not reassign editors without checking their current capacity.\n- Do not skip the onboarding checklist -- all 6 steps are enforced.\n- Do not change video editing statuses directly -- let editors and reviewers handle the pipeline.');
