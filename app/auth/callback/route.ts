import { createServerSupabase } from '@/lib/supabase/server';
import { TEAM_EMAILS } from '@/lib/constants';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists, create if not
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        const email = data.user.email || '';
        const teamInfo = TEAM_EMAILS[email.toLowerCase()];

        await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          name: teamInfo?.name || data.user.user_metadata?.full_name || email.split('@')[0],
          avatar: (teamInfo?.name || email.split('@')[0]).slice(0, 2).toUpperCase(),
          role: teamInfo?.role || 'viewer',
          is_active: true,
          last_login: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
