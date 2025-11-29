import { Resend } from 'resend';

interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
}

interface EmailService {
  sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean>;
}

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

class ResendEmailService implements EmailService {
  async sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean> {
    try {
      const { client, fromEmail } = await getUncachableResendClient();
      
      const expiryDate = params.expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const { data, error } = await client.emails.send({
        from: fromEmail || 'Toddl <onboarding@resend.dev>',
        to: params.to,
        subject: `${params.inviterName} invited you to join Toddl`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #7c3aed; font-family: 'Fredoka', sans-serif; font-size: 28px; margin: 0;">Toddl</h1>
              <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Developmental Milestone Tracking</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">You're invited to join the family!</h2>
              <p style="margin: 0 0 16px 0;">
                <strong>${params.inviterName}</strong> has invited you to join Toddl as a co-parent. 
                You'll be able to track your child's developmental milestones together.
              </p>
              
              <a href="${params.inviteUrl}" style="display: inline-block; background-color: #7c3aed; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0;">
                Accept Invitation
              </a>
              
              <p style="color: #6b7280; font-size: 14px; margin: 16px 0 0 0;">
                This invitation expires on <strong>${expiryDate}</strong>.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                &copy; ${new Date().getFullYear()} Toddl. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        console.error('[EmailService] Failed to send invitation email:', error);
        return false;
      }

      console.log('[EmailService] Invitation email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending invitation email:', error);
      return false;
    }
  }
}

export const emailService: EmailService = new ResendEmailService();
