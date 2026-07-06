import { prisma } from "./prisma";
import { BackgroundTaskRunner } from "./backgroundTaskRunner";
import crypto from "crypto";

export enum AuditEventType {
  USER_LOGIN = "USER_LOGIN",
  USER_FAILED_LOGIN = "USER_FAILED_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  TENANT_SETTINGS_UPDATED = "TENANT_SETTINGS_UPDATED",
  MEMBER_PROMOTED = "MEMBER_PROMOTED",
  BILLING_PLAN_CHANGED = "BILLING_PLAN_CHANGED",
  PAYMENT_INITIATED = "PAYMENT_INITIATED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
}

export const auditLogger = {
  log: (
    eventType: AuditEventType,
    tenantId: string | null | undefined,
    payload: Record<string, any>,
    actorId?: string
  ) => {
    if (!tenantId) {
      tenantId = "SYSTEM_LEVEL"; // Fallback for pre-tenant actions like failed logins
    }

    const correlationId = crypto.randomUUID();

    BackgroundTaskRunner.execute("AuditLog", correlationId, async () => {
      await prisma.auditLog.create({
        data: {
          tenantId,
          eventType,
          actorId,
          correlationId,
          payload,
        },
      });
    });
  },
};
