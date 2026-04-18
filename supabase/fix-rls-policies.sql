-- ═══════════════════════════════════════════════════════
-- Supabase Auth: RLS Policy Migration
-- ═══════════════════════════════════════════════════════
--
-- This migration replaces the old RLS policies with proper
-- authenticated-only policies that work with Supabase Auth.
--
-- The app now uses supabase.auth.signInWithPassword() so
-- auth.role() correctly returns 'authenticated' after login.
--
-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)
-- ═══════════════════════════════════════════════════════

-- ─── Drop ALL existing policies (covers any naming variant) ───
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ─── Create proper authenticated policies with USING + WITH CHECK ───

CREATE POLICY "Authenticated full access to profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to clients"
  ON clients FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to videos"
  ON videos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to leads"
  ON leads FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to onboarding"
  ON onboarding FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to ads"
  ON ads FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to kb_docs"
  ON kb_docs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to packages"
  ON packages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to activity_log"
  ON activity_log FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to attachments"
  ON attachments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
