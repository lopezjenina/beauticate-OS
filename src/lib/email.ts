import { Resend } from 'resend';

// Lazy-initialize to avoid throwing during build/prerendering when
// the RESEND_API_KEY env var is only available at runtime on the server.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not configured.');
    _resend = new Resend(key);
  }
  return _resend;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Support @ Beauticate <support@beauticate.space>',
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email exception:', err);
    return { success: false, error: err };
  }
}
