import { prisma } from "../../lib/prisma";
import { AdminNotificationType, AdminNotificationStatus } from "@prisma/client";

export const NotificationRepository = {
  async createLog(
    idempotencyKey: string,
    type: AdminNotificationType,
    recipients: string[],
    payload: any,
    tenantId?: string
  ) {
    return prisma.adminNotificationLog.create({
      data: {
        idempotencyKey,
        type,
        status: AdminNotificationStatus.QUEUED,
        recipients: recipients.join(","),
        payload,
        tenantId
      }
    });
  },

  async updateStatus(id: string, status: AdminNotificationStatus, error?: string) {
    return prisma.adminNotificationLog.update({
      where: { id },
      data: { status, error }
    });
  }
};
