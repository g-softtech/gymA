import { AdminNotificationType, AdminNotificationStatus } from "@prisma/client";

export interface NewTenantSignupPayload {
  gymName: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  timestamp: string;
}

export type AdminNotificationPayloadMap = {
  [AdminNotificationType.NEW_TENANT_SIGNUP]: NewTenantSignupPayload;
};

export interface IAdminNotificationService {
  sendNotification<T extends AdminNotificationType>(
    type: T,
    payload: AdminNotificationPayloadMap[T],
    tenantId?: string,
    correlationId?: string
  ): Promise<void>;
}

export interface IEmailProvider {
  sendEmail(to: string[], subject: string, html: string, text: string): Promise<void>;
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}
