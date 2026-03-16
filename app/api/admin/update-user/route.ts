import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';

async function requireAdmin() {
  const serverSupabase = await createServerSupabase();
  const { data: { session } } = await serverSupabase.auth.getSession();
  if (!session?.user) return null;
  const { data } = await serverSupabase.from('profiles').select('role').eq('id', session.user.id).single();
  return data?.role === 'admin' ? serverSupabase : null;
}

export async function PATCH(request: Request) {
  try {
    const caller = await requireAdmin();
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId, name, email, password } = await request.json() as {
      userId: string;
      name?: string;
      email?: string;
      password?: string;
    };

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const adminClient = createAdminClient();
    const updates: Record<string, any> = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    // Update auth user (email/password) if provided
    if (Object.keys(updates).length > 0) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, updates);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update profile name if provided
    if (name) {
      const { error } = await adminClient.from('profiles').update({ name }).eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
