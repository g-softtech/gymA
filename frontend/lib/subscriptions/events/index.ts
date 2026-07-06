export * from "./events";
export { subscriptionDomainBus } from "./bus";
import { registerAuditHandlers } from "./handlers/auditHandler";
import { registerCacheHandlers } from "./handlers/cacheInvalidationHandler";
import { handleSubscriptionNotifications } from "./handlers/notificationHandler";

// Execute registrations exactly once
registerAuditHandlers();
registerCacheHandlers();

// Register notification handlers
import { subscriptionDomainBus } from "./bus";
subscriptionDomainBus.subscribe("SubscriptionRenewed", handleSubscriptionNotifications);
subscriptionDomainBus.subscribe("SubscriptionActivated", handleSubscriptionNotifications);
subscriptionDomainBus.subscribe("SubscriptionExpired", handleSubscriptionNotifications);
subscriptionDomainBus.subscribe("SubscriptionCancelled", handleSubscriptionNotifications);
