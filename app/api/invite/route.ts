import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Verify the caller is an authenticated admin
    const serverSupabase = await createServerSupabase();
    const { data: { session } } = await serverSupabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerProfile } = await serverSupabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { email, name, role } = await request.json() as { email: string; name: string; role: string };

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'email, name, and role are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const origin = new URL(request.url).origin;

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { name, role },
      redirectTo: `${origin}/auth/callback`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
