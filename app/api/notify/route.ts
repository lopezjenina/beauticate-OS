import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createResend, FROM, assignmentNotificationHtml } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, to, data } = body as {
    type: 'assignment';
    to: string;         // recipient email
    data: { recipientName: string; clientName: string; role: string; assignedBy: string; link: string };
  };

  if (!type || !to || !data) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  try {
    const resend = createResend();
    let html = '';
    let subject = '';

    if (type === 'assignment') {
      html = assignmentNotificationHtml(data);
      subject = `You've been assigned: ${data.clientName}`;
    } else {
      return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
