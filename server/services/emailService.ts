interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
}

interface EmailService {
  sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean>;
}

class StubEmailService implements EmailService {
  async sendInvitationEmail(params: SendInvitationEmailParams): Promise<boolean> {
    console.log("=== INVITATION EMAIL (STUB) ===");
    console.log(`To: ${params.to}`);
    console.log(`From: ${params.inviterName}`);
    console.log(`Invite URL: ${params.inviteUrl}`);
    console.log(`Expires: ${params.expiresAt.toISOString()}`);
    console.log("================================");
    return true;
  }
}

export const emailService: EmailService = new StubEmailService();
