import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TEAM_EMAILS } from '@/lib/constants';
import { NextResponse } from 'next/server';

type CookieEntry = { name: string; value: string; options: CookieOptions };

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();

    // Collect cookies that Supabase wants to set so we can attach them to the redirect
    const cookiesToSet: CookieEntry[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(incoming: CookieEntry[]) {
            // Store for manual attachment to redirect response
            cookiesToSet.push(...incoming);
            // Also set on cookieStore (for any server-side reads within this request)
            incoming.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options as any); } catch { /* ignore */ }
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        const email = data.user.email || '';
        const meta = data.user.user_metadata || {};
        const teamInfo = TEAM_EMAILS[email.toLowerCase()];

        const name = meta.name || teamInfo?.name || meta.full_name || email.split('@')[0];
        const role = meta.role || teamInfo?.role || 'viewer';

        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name,
          avatar: name.slice(0, 2).toUpperCase(),
          role,
          is_active: true,
          last_login: new Date().toISOString(),
        });
      } else {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      // Build redirect and explicitly attach session cookies
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);
      cookiesToSet.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options);
      });
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
