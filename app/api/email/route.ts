import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createResend, FROM, weeklyReportHtml, budgetAlertHtml, onboardingAlertHtml } from '@/lib/resend';

async function getCallerProfile(serverSupabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { session } } = await serverSupabase.auth.getSession();
  if (!session?.user) return null;
  const { data } = await serverSupabase.from('profiles').select('*').eq('id', session.user.id).single();
  return data ?? null;
}

export async function POST(request: Request) {
  try {
    const serverSupabase = await createServerSupabase();
    const caller = await getCallerProfile(serverSupabase);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, to, data } = body as { type: string; to: string[]; data: any };

    if (!type || !to?.length) {
      return NextResponse.json({ error: 'type and to are required' }, { status: 400 });
    }

    const resend = createResend();
    let subject = '';
    let html = '';

    switch (type) {
      case 'weekly_report':
        subject = `Viral Vision — Weekly Report ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        html = weeklyReportHtml(data);
        break;
      case 'budget_alert':
        subject = `⚠ Budget Alert: ${data.campaignName} exceeded budget`;
        html = budgetAlertHtml(data);
        break;
      case 'onboarding_alert':
        subject = `New client onboarding: ${data.clientName}`;
        html = onboardingAlertHtml(data);
        break;
      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    const result = await resend.emails.send({ from: FROM, to, subject, html });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
