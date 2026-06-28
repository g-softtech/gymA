import { AdminNotificationType, AdminNotificationStatus } from "@prisma/client";
import { AdminNotificationPayloadMap, IAdminNotificationService, IEmailProvider } from "./types";
import { NotificationRepository } from "./NotificationRepository";
import { NotificationTemplateFactory } from "./NotificationTemplateFactory";
import { NotificationIdempotency } from "./NotificationIdempotency";
import { ResendEmailProvider } from "./providers/ResendEmailProvider";
import { env } from "../../lib/env";
import { logger } from "../../lib/logger";
import crypto from "crypto";

export class AdminNotificationService implements IAdminNotificationService {
  private emailProvider: IEmailProvider;

  constructor(emailProvider?: IEmailProvider) {
    this.emailProvider = emailProvider || new ResendEmailProvider();
  }

  async sendNotification<T extends AdminNotificationType>(
    type: T,
    payload: AdminNotificationPayloadMap[T],
    tenantId?: string,
    correlationId?: string
  ): Promise<void> {
    // 1. Generate Correlation ID if missing (as requested)
    const cid = correlationId || crypto.randomUUID();
    const logCtx = { correlationId: cid, type, tenantId };
    
    // 2. Resolve Idempotency Key
    const idempotencyKey = NotificationIdempotency.generate(type, tenantId, payload);
    let logId = "";

    // 3. Persist QUEUED state
    try {
      const logRecord = await NotificationRepository.createLog(
        idempotencyKey,
        type,
        env.SUPERADMIN_EMAILS,
        payload,
        tenantId
      );
      logId = logRecord.id;
      logger.info(`Notification queued for dispatch.`, logCtx);
    } catch (error: any) {
      if (error?.code === "P2002") {
        logger.info(`Duplicate notification prevented (Idempotency Key: ${idempotencyKey})`, logCtx);
        return; // Idempotent success
      }
      logger.error("Failed to queue notification in database.", error, logCtx);
      return;
    }

    try {
      // 4. Update to SENDING
      await NotificationRepository.updateStatus(logId, AdminNotificationStatus.SENDING);
      
      // 5. Generate Content via Factory
      const { subject, html, text } = NotificationTemplateFactory.get(type, payload);
      
      const recipients = env.SUPERADMIN_EMAILS;
      if (recipients.length === 0) {
        logger.warn("No superadmin emails configured. Skipping dispatch.", logCtx);
        await NotificationRepository.updateStatus(logId, AdminNotificationStatus.FAILED, "No recipients configured");
        return;
      }

      // 6. Dispatch via Provider
      await this.emailProvider.sendEmail(recipients, subject, html, text);
      
      // 7. Update to SENT
      await NotificationRepository.updateStatus(logId, AdminNotificationStatus.SENT);
      logger.info("Notification sent successfully.", logCtx);
      
    } catch (error: any) {
      logger.error("Failed to dispatch notification.", error, logCtx);
      await NotificationRepository.updateStatus(
        logId, 
        AdminNotificationStatus.FAILED, 
        error?.message || "Unknown error"
      ).catch(e => logger.error("Failed to update status to FAILED", e, logCtx));
    }
  }
}

// Export a singleton instance for default usage
export const adminNotificationService = new AdminNotificationService();
