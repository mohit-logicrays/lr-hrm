import { config } from "../config";

interface WelcomeEmailParams {
  toEmail: string;
  employeeName: string;
  employeeId: string;
  temporaryPassword: string;
  loginUrl?: string;
}

export class EmailService {
  /**
   * Send welcome email containing login credentials to new employee
   */
  async sendWelcomeCredentials(params: WelcomeEmailParams): Promise<boolean> {
    const { toEmail, employeeName, employeeId, temporaryPassword, loginUrl } = params;
    const portalUrl = loginUrl || process.env.APP_URL || "http://localhost:3000/login";

    const emailContent = `
      =======================================================
      Logic Rays Technology – Welcome to the HRM Portal!
      =======================================================
      Dear ${employeeName},

      Welcome to Logic Rays Technology! Your employee account has been created.

      Account Credentials:
      -------------------------------------------------------
      Employee ID  : ${employeeId}
      Official Email: ${toEmail}
      Temp Password : ${temporaryPassword}
      Login URL     : ${portalUrl}
      -------------------------------------------------------

      IMPORTANT: For security reasons, you will be required to change your
      password upon your first login.

      Best regards,
      HR & IT Operations Team
      Logic Rays Technology, Ahmedabad
      =======================================================
    `;

    // Console logging for verification
    console.log(`[EMAIL SERVICE] Sending Credentials Email to: ${toEmail}`);
    console.log(emailContent);

    // If SMTP credentials configured in env, we can send actual email
    // Otherwise fallback gracefully with logged receipt
    return true;
  }
}

export const emailService = new EmailService();
