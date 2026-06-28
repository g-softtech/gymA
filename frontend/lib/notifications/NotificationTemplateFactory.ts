import { AdminNotificationType } from "@prisma/client";
import { AdminNotificationPayloadMap, EmailTemplateResult } from "./types";
import { buildNewTenantSignupTemplate } from "./templates/newTenantSignup";

export const NotificationTemplateFactory = {
  get<T extends AdminNotificationType>(
    type: T, 
    payload: AdminNotificationPayloadMap[T]
  ): EmailTemplateResult {
    // Registry of all templates
    const registry: {
      [K in AdminNotificationType]: (p: AdminNotificationPayloadMap[K]) => EmailTemplateResult;
    } = {
      [AdminNotificationType.NEW_TENANT_SIGNUP]: buildNewTenantSignupTemplate,
    };

    const builder = registry[type];
    if (!builder) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    // TS needs a slight assertion here because the registry type signature is generic,
    // but we know at runtime `builder` corresponds exactly to `T`.
    return (builder as any)(payload);
  }
};
