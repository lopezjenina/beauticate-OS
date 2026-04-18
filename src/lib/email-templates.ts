/**
 * Transactional Email Templates for Beauticate OS
 * Used with Resend (src/lib/email.ts)
 */

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #ffffff;
  color: #111827;
`;

const BUTTON_STYLE = `
  display: inline-block;
  background-color: #000000;
  color: #ffffff !important;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  margin-top: 16px;
`;

const FOOTER_STYLE = `
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
  color: #9ca3af;
`;

/**
 * Template for video approval notifications
 */
export const videoApprovalTemplate = (clientName: string, videoTitle: string, approvalUrl: string) => `
<div style="${BASE_STYLE}">
  <div style="font-size: 12px; font-weight: 700; color: #6366f1; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px;">
    Production Update
  </div>
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.025em;">
    Review Ready: ${videoTitle}
  </h1>
  <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin-bottom: 24px;">
    Hi ${clientName},<br><br>
    Our team has finished editing <strong>${videoTitle}</strong>. It's now ready for your review. 
    You can view the draft and provide feedback or approve it for final delivery using the link below.
  </p>
  <a href="${approvalUrl}" style="${BUTTON_STYLE}">View & Action Video</a>
  <div style="${FOOTER_STYLE}">
    &copy; 2026 BEAUTICATE. OS. All rights reserved.
  </div>
</div>
`;

/**
 * Template for new project/client assignments
 */
export const assignmentTemplate = (staffName: string, clientName: string, dashboardUrl: string) => `
<div style="${BASE_STYLE}">
  <div style="font-size: 12px; font-weight: 700; color: #10b981; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px;">
    New Assignment
  </div>
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.025em;">
    Client Onboarding Assigned
  </h1>
  <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin-bottom: 24px;">
    Hi ${staffName},<br><br>
    You have been assigned to lead the onboarding and production for <strong>${clientName}</strong>. 
    Please head to the dashboard to review their requirements and start the project.
  </p>
  <a href="${dashboardUrl}" style="${BUTTON_STYLE}">Open Dashboard</a>
  <div style="${FOOTER_STYLE}">
    &copy; 2026 BEAUTICATE. OS. This is an automated notification.
  </div>
</div>
`;

/**
 * Template for onboarding completion
 */
export const welcomeTemplate = (clientName: string, dashboardUrl: string) => `
<div style="${BASE_STYLE}">
  <div style="font-size: 20px; font-weight: 400; letter-spacing: 0.15em; color: #111827; margin-bottom: 32px; font-family: 'Outfit', sans-serif;">
    BEAUTICATE.
  </div>
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.025em;">
    Welcome to the Agency, ${clientName}
  </h1>
  <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin-bottom: 24px;">
    We're thrilled to have you on board. Your production environment is now set up and ready to go. 
    Click below to access your client portal, where you can track video progress, upload assets, and communicate with your team.
  </p>
  <a href="${dashboardUrl}" style="${BUTTON_STYLE}">Enter Client Portal</a>
  <div style="${FOOTER_STYLE}">
    Best regards,<br>
    The BEAUTICATE. Team
  </div>
</div>
`;
