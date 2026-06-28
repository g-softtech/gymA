import { AdminNotificationType } from "@prisma/client";

export const NotificationIdempotency = {
  /**
   * Generates a unique idempotency key to prevent duplicate notifications.
   */
  generate(type: AdminNotificationType, tenantId?: string, payload?: any): string {
    if (tenantId) {
      return `${tenantId}_${type}`;
    }
    // Fallback: simple hash of payload
    const stringified = JSON.stringify(payload || {});
    let hash = 0;
    for (let i = 0; i < stringified.length; i++) {
      const char = stringified.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; 
    }
    return `GLOBAL_${type}_${hash}`;
  }
};
