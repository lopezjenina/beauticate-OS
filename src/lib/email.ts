import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_Mfqh9urB_MiQBDnkvvDhaGFYVgnQvLvEn');

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Beauticate <onboarding@resend.dev>',
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  try {
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
