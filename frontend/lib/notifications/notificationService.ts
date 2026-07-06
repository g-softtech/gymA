import { NotificationIntent } from "./types";
import { prisma } from "@/lib/prisma";

export class NotificationService {
  /**
   * Dispatches a notification intent to the appropriate channels.
   * For Phase 1 of this abstraction, it strictly saves it as an In-App Notification.
   * Future iterations will expand this to fan-out to Email, SMS, and Push providers
   * based on the tenant's preferences and notification priority.
   */
  async dispatch(intent: NotificationIntent): Promise<void> {
    console.log(`[NotificationService] Dispatching ${intent.priority} priority ${intent.type} notification for user ${intent.userId}`);

    try {
      // 1. Core Implementation: In-App Database Notification
      await prisma.notification.create({
        data: {
          tenantId: intent.tenantId,
          userId: intent.userId,
          type: "PAYMENT", // We are casting all billing intents to 'PAYMENT' type on the prisma model for now to satisfy Prisma ENUM
          title: intent.title,
          message: intent.message,
          // Currently Prisma schema does not support 'priority' or 'metadata' on notifications. 
          // Those can be added in a future migration if needed.
        },
      });

      // 2. Future expansion: Queue for Email delivery
      // if (intent.priority === 'critical' || intent.priority === 'high') {
      //   await emailQueue.push(...)
      // }
      
    } catch (err) {
      console.error(`[NotificationService] Failed to dispatch notification intent`, err);
      // We do not throw here. Notification dispatch failures are logged and we continue
      // because they should never rollback the successful billing event that triggered them.
    }
  }
}

export const notificationService = new NotificationService();
