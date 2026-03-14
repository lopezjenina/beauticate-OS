import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';

async function getCallerRole(serverSupabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { session } } = await serverSupabase.auth.getSession();
  if (!session?.user) return null;
  const { data } = await serverSupabase.from('profiles').select('role').eq('id', session.user.id).single();
  return data?.role ?? null;
}

export async function GET() {
  try {
    const serverSupabase = await createServerSupabase();
    if (await getCallerRole(serverSupabase) !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const pending = data.users
      .filter(u => u.invited_at && !u.email_confirmed_at)
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || '',
        role: u.user_metadata?.role || 'viewer',
        invited_at: u.invited_at,
      }));

    return NextResponse.json({ pending });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const serverSupabase = await createServerSupabase();
    if (await getCallerRole(serverSupabase) !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json() as { userId: string };
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
