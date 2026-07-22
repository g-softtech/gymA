import { IEmailProvider } from "../types";
import { env } from "../../../lib/env";
import { Resend } from "resend";
import { logger } from "../../../lib/logger";

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend | null = null;

  constructor() {
    const key = env.RESEND_API_KEY;
    if (key) {
      this.resend = new Resend(key);
    }
  }

  async sendEmail(to: string[], subject: string, html: string, text: string, replyTo?: string): Promise<void> {
    if (!this.resend) {
      logger.warn("Resend API key missing. Mocking email delivery.");
      logger.debug(`[MOCK EMAIL] To: ${to.join(', ')} | Subject: ${subject}`);
      return;
    }

    const payload: any = {
      from: process.env.EMAIL_FROM_ADDRESS || "CortexFit Admin <info@thecortexsystems.com>",
      to,
      subject,
      html,
      text
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const { error } = await this.resend.emails.send(payload);

    if (error) {
      throw new Error(error.message);
    }
  }
}
