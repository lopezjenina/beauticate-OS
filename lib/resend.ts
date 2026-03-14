import { Resend } from 'resend';

export function createResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set in environment variables.');
  return new Resend(key);
}

export const FROM = process.env.RESEND_FROM || 'Viral Vision <notifications@viralvision.com>';

// ─── Email templates ────────────────────────────────────────────────────────

function base(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #0B0B0F; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #E8E6E1; }
    .wrap { max-width: 580px; margin: 40px auto; background: #131318; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; }
    .header { background: #1A1A21; padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .logo { font-size: 14px; font-weight: 800; color: #7F77DD; letter-spacing: 0.04em; }
    .logo span { font-size: 10px; color: #7A7A82; font-weight: 600; letter-spacing: 0.12em; margin-left: 6px; vertical-align: middle; }
    .body { padding: 28px 32px; }
    h2 { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #E8E6E1; }
    .sub { color: #7A7A82; font-size: 13px; margin: 0 0 24px; }
    .card { background: #1A1A21; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; }
    .card-label { font-size: 10px; font-weight: 700; color: #7A7A82; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .card-value { font-size: 22px; font-weight: 700; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .alert { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-left: 3px solid #f87171; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .footer { padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #7A7A82; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">VIRAL VISION <span>OPERATING SYSTEM</span></div>
  </div>
  <div class="body">
    <h2>${title}</h2>
    ${body}
  </div>
  <div class="footer">This is an automated notification from Viral Vision OS. Do not reply to this email.</div>
</div>
</body>
</html>`;
}

export function weeklyReportHtml(data: {
  revenue: string; pipeline: string; activeClients: number;
  videosComplete: number; videosTarget: number; contentPending: number;
  activeAds: number; adSpend: string;
}) {
  const body = `
    <p class="sub">Weekly performance summary — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      <div class="card"><div class="card-label">Revenue (Closed)</div><div class="card-value" style="color:#639922">${data.revenue}</div></div>
      <div class="card"><div class="card-label">Pipeline</div><div class="card-value" style="color:#D4537E">${data.pipeline}</div></div>
      <div class="card"><div class="card-label">Active Clients</div><div class="card-value" style="color:#7F77DD">${data.activeClients}</div></div>
      <div class="card"><div class="card-label">Videos This Week</div><div class="card-value" style="color:#378ADD">${data.videosComplete}/${data.videosTarget}</div></div>
      <div class="card"><div class="card-label">Content Pending</div><div class="card-value" style="color:${data.contentPending > 3 ? '#f87171' : '#4ade80'}">${data.contentPending}</div></div>
      <div class="card"><div class="card-label">Active Ads / Spend</div><div class="card-value" style="color:#EF9F27">${data.activeAds} · ${data.adSpend}</div></div>
    </div>
  `;
  return base('Weekly Report', body);
}

export function budgetAlertHtml(data: {
  campaignName: string; clientName: string;
  budget: string; spent: string; overage: string;
}) {
  const body = `
    <div class="alert">
      <strong style="color:#f87171">⚠ Budget exceeded</strong>
      <p style="margin:6px 0 0;font-size:13px;color:#E8E6E1;">The campaign <strong>${data.campaignName}</strong> for <strong>${data.clientName}</strong> has exceeded its budget.</p>
    </div>
    <div class="card">
      <div class="row"><span style="color:#7A7A82">Budget</span><span style="font-weight:600">${data.budget}</span></div>
      <div class="row"><span style="color:#7A7A82">Spent</span><span style="font-weight:600;color:#f87171">${data.spent}</span></div>
      <div class="row"><span style="color:#7A7A82">Overage</span><span style="font-weight:700;color:#f87171">+${data.overage}</span></div>
    </div>
    <p style="font-size:13px;color:#7A7A82;margin-top:16px;">Log in to Viral Vision OS to pause or adjust the campaign.</p>
  `;
  return base('Budget Alert', body);
}

export function onboardingAlertHtml(data: { clientName: string; package: string; editor: string; addedBy: string }) {
  const body = `
    <p class="sub">A new client has been added to onboarding.</p>
    <div class="card">
      <div class="row"><span style="color:#7A7A82">Client</span><span style="font-weight:700">${data.clientName}</span></div>
      <div class="row"><span style="color:#7A7A82">Package</span><span>${data.package}</span></div>
      <div class="row"><span style="color:#7A7A82">Editor</span><span>${data.editor}</span></div>
      <div class="row"><span style="color:#7A7A82">Added by</span><span>${data.addedBy}</span></div>
    </div>
    <p style="font-size:13px;color:#7A7A82;margin-top:16px;">Log in to complete the onboarding checklist.</p>
  `;
  return base('New Onboarding Client', body);
}
