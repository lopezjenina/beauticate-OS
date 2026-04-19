-- Fix activity_log table schema to match application code
-- The code uses a "user" string (name) which doesn't exist in the current schema (user_id uuid)

ALTER TABLE public.activity_log 
  ADD COLUMN IF NOT EXISTS "user" TEXT;

-- Optional: If we want to keep user_id as well
-- ALTER TABLE public.activity_log ALTER COLUMN user_id DROP NOT NULL;

-- Enable RLS (already enabled but just in case)
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Ensure authenticated users can insert logs
DROP POLICY IF EXISTS "Authenticated full access to activity_log" ON public.activity_log;
CREATE POLICY "Authenticated full access to activity_log" ON public.activity_log
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
