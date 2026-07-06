import { AnySubscriptionEvent } from "../events";
import { notificationService } from "@/lib/notifications/notificationService";

/**
 * Transforms Subscription Domain Events into Notification Intents, shielding the
 * billing logic from notification complexities.
 */
export async function handleSubscriptionNotifications(event: AnySubscriptionEvent) {
  // We only care about specific events that warrant a user notification.
  switch (event.type) {
    case "SubscriptionRenewed":
    case "SubscriptionActivated":
      await notificationService.dispatch({
        tenantId: event.tenantId,
        userId: event.payload.memberId, 
        type: event.type,
        title: event.type === "SubscriptionRenewed" ? "Subscription Renewed 🎉" : "Subscription Activated 🎉",
        message: `Your membership has been ${event.type === "SubscriptionRenewed" ? "renewed" : "activated"}. Thank you!`,
        priority: "normal",
        metadata: {
          subscriptionId: event.payload.subscriptionId,
          planId: "planId" in event.payload ? event.payload.planId : undefined,
        },
      });
      break;

    case "SubscriptionExpired":
      await notificationService.dispatch({
        tenantId: event.tenantId,
        userId: event.payload.memberId, 
        type: event.type,
        title: "Subscription Expired ⚠️",
        message: `Your membership has expired. Please renew to maintain access to your benefits.`,
        priority: "high",
        metadata: {
          subscriptionId: event.payload.subscriptionId,
        },
      });
      break;

    case "SubscriptionCancelled":
      await notificationService.dispatch({
        tenantId: event.tenantId,
        userId: event.payload.memberId, 
        type: event.type,
        title: "Subscription Cancelled",
        message: `Your membership has been cancelled. If this was a mistake, please contact support.`,
        priority: "normal",
        metadata: {
          subscriptionId: event.payload.subscriptionId,
        },
      });
      break;

    case "SubscriptionExpiring":
      await notificationService.dispatch({
        tenantId: event.tenantId,
        userId: event.payload.memberId, 
        type: event.type,
        title: "Subscription Expiring Soon ⏳",
        message: `Your membership expires in ${event.payload.daysLeft} day(s). Please renew soon to avoid service interruption.`,
        priority: "normal",
        metadata: {
          subscriptionId: event.payload.subscriptionId,
          daysLeft: event.payload.daysLeft,
        },
      });
      break;

    default:
      // Other events like SubscriptionSuspended might not need direct member notifications yet
      // or will be added later.
      break;
  }
}
