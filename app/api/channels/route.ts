import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

async function getCallerRole(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role || null;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const callerRole = await getCallerRole(supabase);
  if (callerRole !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json();
  const { name, slug, description, allowed_roles } = body;
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });

  const { data, error } = await supabase.from('channels').insert({ name, slug, description, allowed_roles }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channel: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabase();
  const callerRole = await getCallerRole(supabase);
  if (callerRole !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase.from('channels').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channel: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const callerRole = await getCallerRole(supabase);
  if (callerRole !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data: ch } = await supabase.from('channels').select('is_default').eq('id', id).single();
  if (ch?.is_default) return NextResponse.json({ error: 'Cannot delete default channel' }, { status: 400 });

  const { error } = await supabase.from('channels').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
