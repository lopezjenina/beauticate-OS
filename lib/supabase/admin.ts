import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || key === 'your-service-role-key-here') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local from Supabase Dashboard → Project Settings → API.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
