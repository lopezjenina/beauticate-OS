-- ============================================
-- VIRAL VISION OS - Database Schema
-- ============================================
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- This creates all tables, policies, triggers, and seed data

-- ============ ENUMS ============
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'social', 'viewer');
CREATE TYPE sales_stage AS ENUM ('lead', 'call', 'proposal', 'follow_up', 'closed_won', 'closed_lost');
CREATE TYPE publish_status AS ENUM ('pending_caption', 'approved', 'scheduled', 'posted');
CREATE TYPE ad_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE client_status AS ENUM ('on_track', 'behind', 'complete');
CREATE TYPE onboarding_status AS ENUM ('in_progress', 'complete');
CREATE TYPE log_type AS ENUM ('success', 'info', 'warning', 'error');

-- ============ PROFILES (extends Supabase auth.users) ============
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ SALES PIPELINE ============
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  deal_value NUMERIC DEFAULT 0,
  stage sales_stage NOT NULL DEFAULT 'lead',
  source TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  assigned_to UUID REFERENCES profiles(id),
  deal_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ ONBOARDING ============
CREATE TABLE onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  contract_signed BOOLEAN DEFAULT false,
  invoice_paid BOOLEAN DEFAULT false,
  strategy_called BOOLEAN DEFAULT false,
  shoot_scheduled BOOLEAN DEFAULT false,
  editor_assigned TEXT DEFAULT '',
  social_assigned TEXT DEFAULT '',
  shoot_date DATE,
  videographer TEXT DEFAULT '',
  package_type TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status onboarding_status DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ CLIENTS (Production) ============
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  editor TEXT NOT NULL DEFAULT '',
  videographer TEXT DEFAULT '',
  week_num INTEGER NOT NULL DEFAULT 1 CHECK (week_num BETWEEN 1 AND 4),
  videos_target INTEGER NOT NULL DEFAULT 6,
  videos_complete INTEGER NOT NULL DEFAULT 0,
  shoot_date DATE,
  next_shoot DATE,
  status client_status DEFAULT 'on_track',
  package_type TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  -- Content pipeline stage counts
  stage_shoot INTEGER DEFAULT 0,
  stage_edit INTEGER DEFAULT 0,
  stage_approval INTEGER DEFAULT 0,
  stage_sent_guido INTEGER DEFAULT 0,
  stage_posted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ PUBLISHING ============
CREATE TABLE publishing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT DEFAULT '',
  scheduled_date DATE,
  platform TEXT DEFAULT 'Instagram Reels',
  status publish_status DEFAULT 'pending_caption',
  week_num INTEGER NOT NULL DEFAULT 1 CHECK (week_num BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ ADS ============
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  status ad_status DEFAULT 'draft',
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  creative TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  next_optimization DATE,
  start_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ ACTIVITY LOG ============
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  board TEXT DEFAULT '',
  log_type log_type DEFAULT 'info',
  user_name TEXT DEFAULT 'System',
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ INDEXES ============
CREATE INDEX idx_sales_stage ON sales(stage);
CREATE INDEX idx_clients_week ON clients(week_num);
CREATE INDEX idx_clients_editor ON clients(editor);
CREATE INDEX idx_publishing_week ON publishing(week_num);
CREATE INDEX idx_publishing_status ON publishing(status);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_board ON activity_log(board);

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sales_updated BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_onboarding_updated BEFORE UPDATE ON onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_publishing_updated BEFORE UPDATE ON publishing FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_ads_updated BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ AUTO-CREATE ONBOARDING WHEN DEAL CLOSES ============
CREATE OR REPLACE FUNCTION auto_create_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS NULL OR OLD.stage != 'closed_won') THEN
    INSERT INTO onboarding (client_name, notes)
    VALUES (NEW.company_name, 'Auto-created from closed deal')
    ON CONFLICT DO NOTHING;

    INSERT INTO activity_log (action, detail, board, log_type, user_name)
    VALUES (
      'Auto-created onboarding',
      NEW.company_name || ' moved to onboarding',
      'onboarding',
      'info',
      'System'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sales_close_onboarding
  AFTER UPDATE OF stage ON sales
  FOR EACH ROW EXECUTE FUNCTION auto_create_onboarding();

-- Also trigger on insert (for new deals created directly as closed_won)
CREATE TRIGGER tr_sales_insert_onboarding
  AFTER INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.stage = 'closed_won')
  EXECUTE FUNCTION auto_create_onboarding();

-- ============ AUTO-CREATE CLIENT WHEN ONBOARDING COMPLETES ============
CREATE OR REPLACE FUNCTION auto_create_client()
RETURNS TRIGGER AS $$
DECLARE
  all_gates BOOLEAN;
  target_videos INTEGER;
BEGIN
  all_gates := NEW.contract_signed
    AND NEW.invoice_paid
    AND NEW.strategy_called
    AND NEW.shoot_scheduled
    AND NEW.editor_assigned != ''
    AND NEW.social_assigned != '';

  IF all_gates AND (OLD.status IS NULL OR OLD.status != 'complete') THEN
    NEW.status := 'complete';

    -- Parse video count from package type
    target_videos := COALESCE(
      NULLIF(regexp_replace(NEW.package_type, '[^0-9]', '', 'g'), '')::INTEGER,
      6
    );

    INSERT INTO clients (name, editor, videographer, week_num, videos_target, package_type, shoot_date, notes)
    VALUES (
      NEW.client_name,
      NEW.editor_assigned,
      NEW.videographer,
      1,
      target_videos,
      NEW.package_type,
      NEW.shoot_date,
      'Auto-created from onboarding completion'
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO activity_log (action, detail, board, log_type, user_name)
    VALUES (
      'Onboarding complete → Production',
      NEW.client_name || ' passed all gates',
      'production',
      'success',
      'System'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_onboarding_complete
  BEFORE UPDATE ON onboarding
  FOR EACH ROW EXECUTE FUNCTION auto_create_client();

-- ============ AUTO-UPDATE CLIENT STATUS ============
CREATE OR REPLACE FUNCTION auto_update_client_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.videos_complete >= NEW.videos_target THEN
    NEW.status := 'complete';
  ELSIF NEW.videos_complete < (NEW.videos_target * 0.5) THEN
    NEW.status := 'behind';
  ELSE
    NEW.status := 'on_track';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_client_status
  BEFORE UPDATE OF videos_complete ON clients
  FOR EACH ROW EXECUTE FUNCTION auto_update_client_status();

-- ============ ROW LEVEL SECURITY ============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles readable by authenticated" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sales: admins full access, others read
CREATE POLICY "Sales readable by authenticated" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sales" ON sales FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Onboarding: admins full access
CREATE POLICY "Onboarding readable by authenticated" ON onboarding FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage onboarding" ON onboarding FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Clients: admins full, editors can update their assigned clients
CREATE POLICY "Clients readable by authenticated" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage clients" ON clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Editors update own clients" ON clients FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor' AND name = clients.editor
  ));

-- Publishing: admins full, editors and social can update
CREATE POLICY "Publishing readable by authenticated" ON publishing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage publishing" ON publishing FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Editors and social update publishing" ON publishing FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'social')));

-- Ads: admins full access
CREATE POLICY "Ads readable by authenticated" ON ads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ads" ON ads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Activity log: everyone can read and insert
CREATE POLICY "Log readable by authenticated" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert log" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============ SEED DATA ============

-- NOTE: Profiles are created automatically when users sign up via Supabase Auth.
-- After first login, run the UPDATE statements below to set roles.
-- For now, seed the operational data:

INSERT INTO sales (company_name, contact_name, email, phone, deal_value, stage, source, notes, deal_date) VALUES
  ('Reyes Dental Clinic', 'Dr. Reyes', 'reyes@dental.ph', '0917-123-4567', 45000, 'lead', 'Referral', 'Referred by existing client', '2026-03-10'),
  ('FitZone Gym', 'Marco Santos', 'marco@fitzone.ph', '0918-234-5678', 60000, 'call', 'Facebook Ad', 'Call Thursday 2pm', '2026-03-08'),
  ('Luxe Salon PH', 'Ana Cruz', 'ana@luxesalon.ph', '', 35000, 'proposal', 'Instagram DM', '12-video package', '2026-03-05'),
  ('CloudKitchen MNL', 'Jake Lim', 'jake@ck.ph', '', 80000, 'follow_up', 'Cold Outreach', 'Budget pending', '2026-03-01'),
  ('Peak Auto Detailing', 'Paolo Diaz', 'paolo@peak.ph', '', 55000, 'closed_won', 'Referral', '3-month contract', '2026-02-28'),
  ('TechBrew Cafe', 'Sam Tan', 'sam@techbrew.ph', '', 40000, 'closed_lost', 'Website', 'Budget tight', '2026-02-25');

INSERT INTO onboarding (client_name, contract_signed, invoice_paid, strategy_called, shoot_scheduled, editor_assigned, social_assigned, shoot_date, videographer, package_type, status, notes) VALUES
  ('Peak Auto Detailing', true, true, true, false, '', '', NULL, '', '12 Videos/Month', 'in_progress', 'Waiting for location scout'),
  ('BrightSmile Dental', true, true, true, true, 'Sergio', 'Guido', '2026-03-20', 'Videographer 1', '8 Videos/Month', 'complete', 'Ready for production');

INSERT INTO clients (name, editor, videographer, week_num, videos_target, videos_complete, shoot_date, status, package_type, stage_shoot, stage_edit, stage_approval, stage_sent_guido, stage_posted) VALUES
  ('BrightSmile Dental', 'Sergio', 'Videographer 1', 1, 8, 6, '2026-03-16', 'on_track', '8 Videos/Month', 8, 7, 6, 5, 4),
  ('Manila Eats', 'Rodrigo', 'Videographer 2', 1, 6, 6, '2026-03-15', 'complete', '6 Videos/Month', 6, 6, 6, 6, 6),
  ('Urban Fitness PH', 'Alex', 'Videographer 1', 1, 10, 4, '2026-03-17', 'behind', '10 Videos/Month', 10, 6, 4, 2, 1),
  ('Bloom Flowers', 'Sergio', 'Videographer 3', 2, 4, 4, '2026-03-22', 'complete', '4 Videos/Month', 4, 4, 4, 4, 4),
  ('ClearView Optics', 'Araceli', 'Videographer 2', 2, 8, 7, '2026-03-23', 'on_track', '8 Videos/Month', 8, 8, 7, 6, 5),
  ('Kape Culture', 'Rodrigo', 'Videographer 3', 2, 6, 2, '2026-03-24', 'behind', '6 Videos/Month', 6, 3, 2, 1, 0),
  ('PowerLift Gym', 'Alex', 'Videographer 1', 3, 8, 8, '2026-03-28', 'complete', '8 Videos/Month', 8, 8, 8, 8, 7),
  ('Fresh & Clean Laundry', 'Araceli', 'Videographer 2', 3, 4, 3, '2026-03-29', 'on_track', '4 Videos/Month', 4, 4, 3, 2, 1),
  ('NextGen Academy', 'Sergio', 'Videographer 3', 3, 6, 5, '2026-03-30', 'on_track', '6 Videos/Month', 6, 6, 5, 4, 3),
  ('Skin Deep Studio', 'Rodrigo', 'Videographer 1', 4, 8, 1, '2026-04-04', 'behind', '8 Videos/Month', 8, 2, 1, 0, 0),
  ('GreenThumb Garden', 'Alex', 'Videographer 2', 4, 6, 6, '2026-04-05', 'complete', '6 Videos/Month', 6, 6, 6, 6, 6),
  ('AutoCare Express', 'Araceli', 'Videographer 3', 4, 12, 8, '2026-04-06', 'on_track', '12 Videos/Month', 12, 10, 8, 6, 4);

INSERT INTO publishing (client_name, title, caption, scheduled_date, platform, status, week_num) VALUES
  ('BrightSmile Dental', 'Patient Testimonial #4', 'Amazing whitening results!', '2026-03-18', 'Instagram Reels', 'scheduled', 1),
  ('Manila Eats', 'Kitchen BTS', 'Behind the scenes', '2026-03-17', 'TikTok', 'scheduled', 1),
  ('Urban Fitness PH', 'Workout Tutorial', '', NULL, 'YouTube Shorts', 'pending_caption', 1),
  ('Bloom Flowers', 'Spring Collection', 'New arrivals!', '2026-03-15', 'Instagram Reels', 'posted', 1),
  ('ClearView Optics', 'Eye Care Tips', '5 things your eyes wish', '2026-03-24', 'Facebook', 'scheduled', 2),
  ('Kape Culture', 'Latte Art', '', NULL, 'TikTok', 'pending_caption', 2),
  ('PowerLift Gym', 'Transformation Story', '6 months dedication', '2026-03-28', 'Instagram Reels', 'approved', 3),
  ('Fresh & Clean Laundry', 'Before/After Clean', 'The satisfaction is real', '2026-03-30', 'TikTok', 'approved', 3),
  ('Skin Deep Studio', 'Glow Up Routine', '', NULL, 'TikTok', 'pending_caption', 4),
  ('GreenThumb Garden', 'Plant Care 101', 'Keep them alive!', '2026-04-05', 'YouTube Shorts', 'scheduled', 4),
  ('AutoCare Express', 'Detail Process', 'Dirty to showroom', '2026-04-06', 'Instagram Reels', 'scheduled', 4);

INSERT INTO ads (client_name, campaign_name, status, budget, spent, creative, platform, next_optimization, start_date, notes) VALUES
  ('BrightSmile Dental', 'March Whitening Promo', 'active', 15000, 8200, 'Testimonial Video', 'Facebook+IG', '2026-03-16', '2026-03-01', 'Metro Manila 25-45'),
  ('Urban Fitness PH', 'Membership Drive Q1', 'active', 25000, 18500, 'Transformation Reel', 'Instagram', '2026-03-17', '2026-02-15', 'Lookalike performing well'),
  ('Manila Eats', 'Weekend Specials', 'paused', 10000, 6000, 'Food Montage', 'Facebook', '2026-03-18', '2026-03-05', 'Creative fatigue'),
  ('ClearView Optics', 'Eye Check Awareness', 'active', 20000, 4500, 'Educational Short', 'TikTok', '2026-03-15', '2026-03-10', 'CPM lower than expected'),
  ('Kape Culture', 'Grand Opening', 'draft', 30000, 0, 'Store Tour', 'FB+IG+TikTok', '2026-03-20', NULL, 'Awaiting creative approval');

INSERT INTO activity_log (action, detail, board, log_type, user_name, created_at) VALUES
  ('Deal closed', 'Peak Auto Detailing — ₱55,000', 'sales', 'success', 'Angel', '2026-03-14 09:15:00+08'),
  ('Auto-created onboarding', 'Peak Auto Detailing', 'onboarding', 'info', 'System', '2026-03-14 09:15:01+08'),
  ('Content posted', 'Bloom Flowers — Spring Collection', 'publishing', 'success', 'Guido', '2026-03-13 14:30:00+08'),
  ('Onboarding complete', 'BrightSmile Dental → production', 'onboarding', 'success', 'Jenina', '2026-03-13 11:00:00+08');

-- ============ ROLE ASSIGNMENT (run after users sign up) ============
-- UPDATE profiles SET role = 'admin' WHERE email = 'angelguerrero1999@gmail.com';
-- UPDATE profiles SET role = 'admin' WHERE email = 'viralvisionmk@gmail.com';
-- UPDATE profiles SET role = 'admin' WHERE email = 'jeninalopezz@gmail.com';
-- UPDATE profiles SET role = 'editor' WHERE email = 'storres1524@gmail.com';
-- UPDATE profiles SET role = 'editor' WHERE email = 'jrbp.contato@gmail.com';
-- UPDATE profiles SET role = 'editor' WHERE email = 'alex10soccer2@gmail.com';
-- UPDATE profiles SET role = 'editor' WHERE email = 'ariech0608@gmail.com';
-- UPDATE profiles SET role = 'social' WHERE email = 'guidostorchdesign@gmail.com';
