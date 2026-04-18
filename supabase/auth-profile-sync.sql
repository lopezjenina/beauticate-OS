-- ============================================================
-- Beauticate OS: Auth Profile Sync Trigger
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Ensure `profiles` has a `role` column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

-- 2. Ensure `profiles` has a `permissions` column (JSONB)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 3. Ensure `profiles` has a `username` column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- 4. Create/replace the function that fires on new auth.users rows
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_permissions JSONB := '{"dashboard":true,"calendar":true,"sales":true,"onboarding":true,"clients":true,"production":true,"approvals":true,"publishing":true,"editors":true,"ads":true,"packages":true,"knowledge":true,"activity":true}'::jsonb;
BEGIN
  INSERT INTO public.profiles (id, email, username, role, permissions)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', 'member'),
    default_permissions
  )
  ON CONFLICT (id) DO NOTHING; -- Don't overwrite if the profile already exists
  RETURN NEW;
END;
$$;

-- 5. Attach the trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Verify: SELECT * FROM public.profiles LIMIT 5;
-- ============================================================
