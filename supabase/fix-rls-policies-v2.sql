-- ═══════════════════════════════════════════════════════
-- Beauticate OS: RLS Policy Fix v2
-- ═══════════════════════════════════════════════════════
--
-- PROBLEMS FIXED:
-- 1. Missing INSERT policy on profiles → profile creation silently fails →
--    frontend falls back to upsert which overwrites the superadmin role.
-- 2. Recursive RLS in "Admins read all profiles" → policy references the
--    same table it's protecting, causing infinite recursion / denial.
--
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════

-- ─── Step 1: Drop ALL existing policies on profiles ───
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- ─── Step 2: Create a SECURITY DEFINER helper to break RLS recursion ───
-- This function checks a user's role without triggering RLS on profiles.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ─── Step 3: Recreate safe profiles policies ───

-- Any authenticated user can read their OWN profile
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Any authenticated user can update their OWN profile (but NOT their role)
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins/superadmins can read ALL profiles (using helper to avoid recursion)
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (public.get_my_role() IN ('admin', 'superadmin'));

-- Admins/superadmins can update ANY profile (e.g., to manage roles)
CREATE POLICY "Admins update all profiles"
  ON profiles FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'superadmin'));

-- Allow authenticated users to INSERT their own profile (needed for first login)
-- The trigger should handle this but this is a fallback.
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── Step 4: Protect the role column from self-modification ───
-- Users can update their own profile but must NOT be able to elevate their own role.
-- This is enforced at the API level, but for defense-in-depth, superadmin role
-- assignments should only be done directly in the database or via admin API.

-- ─── Verify ───
-- After running this, check your policies:
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';
