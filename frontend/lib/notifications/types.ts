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
  sendEmail(to: string[], subject: string, html: string, text: string, replyTo?: string): Promise<void>;
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

export type NotificationPriority = "critical" | "high" | "normal" | "low";

export interface NotificationIntent {
  tenantId: string;
  userId: string;
  
  /** General category/type of the notification, useful for analytics and templates */
  type: string;
  
  title: string;
  message: string;
  
  /** Indicates the urgency of delivery */
  priority: NotificationPriority;
  
  /** Optional extensible data (e.g., link URLs, IDs) */
  metadata?: Record<string, unknown>;
}
