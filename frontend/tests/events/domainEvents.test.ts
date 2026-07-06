import { describe, it, expect, beforeEach, vi } from "vitest";
import { subscriptionDomainBus } from "../../lib/subscriptions/events/bus";
import { createSubscriptionEvent } from "../../lib/subscriptions/events/events";
import { handleSubscriptionAuditLog } from "../../lib/subscriptions/events/handlers/auditHandler";
import { handleCacheInvalidation } from "../../lib/subscriptions/events/handlers/cacheInvalidationHandler";

// Mock prisma and next/cache
vi.mock("../../lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { prisma } from "../../lib/prisma";
import { revalidateTag } from "next/cache";

describe("Domain Event System: Subscription Event Bus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear bus handlers to isolate tests
    (subscriptionDomainBus as any).handlers.clear();
  });

  it("should securely publish domain events and attach default observability metadata", async () => {
    const event = createSubscriptionEvent({
      type: "SubscriptionActivated",
      tenantId: "tenant_1",
      correlationId: "corr_123",
      source: "test",
      payload: {
        subscriptionId: "sub_1",
        memberId: "member_1",
        planId: "plan_1",
      },
    });

    expect(event.id).toBeDefined();
    expect(event.occurredAt).toBeDefined();
    expect(event.version).toBe(1);
    expect(event.type).toBe("SubscriptionActivated");

    const mockHandler = vi.fn().mockResolvedValue(undefined);
    subscriptionDomainBus.subscribe("SubscriptionActivated", mockHandler);

    const result = await subscriptionDomainBus.publish(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(event);
    
    expect(result.successfulHandlers).toBe(1);
    expect(result.failedHandlers).toBe(0);
  });

  it("should process the Audit Log Handler synchronously", async () => {
    const event = createSubscriptionEvent({
      type: "SubscriptionRenewed",
      tenantId: "tenant_2",
      correlationId: "corr_456",
      source: "test",
      payload: {
        subscriptionId: "sub_2",
        memberId: "member_2",
        planId: "plan_2",
      },
    });

    await handleSubscriptionAuditLog(event);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_2",
        eventType: "SubscriptionRenewed",
        actorId: undefined,
        correlationId: "corr_456",
        occurredAt: event.occurredAt,
        payload: event.payload as any,
      },
    });
  });

  it("should process the Cache Invalidation Handler synchronously", async () => {
    const event = createSubscriptionEvent({
      type: "SubscriptionExpired",
      tenantId: "tenant_3",
      correlationId: "corr_789",
      source: "test",
      payload: {
        subscriptionId: "sub_3",
        memberId: "member_3",
      },
    });

    await handleCacheInvalidation(event);

    expect(revalidateTag).toHaveBeenCalledWith("tenant-subscriptions-tenant_3", "default");
  });

  it("should bubble up failures in critical handlers to prevent silent side-effect failures", async () => {
    const event = createSubscriptionEvent({
      type: "SubscriptionCancelled",
      tenantId: "tenant_fail",
      correlationId: "corr_fail",
      source: "test",
      payload: {
        subscriptionId: "sub_fail",
        memberId: "member_fail",
      },
    });

    // Make revalidateTag throw to simulate a cache failure
    vi.mocked(revalidateTag).mockImplementationOnce(() => {
      throw new Error("Redis connection lost");
    });
    
    subscriptionDomainBus.subscribe("SubscriptionCancelled", handleCacheInvalidation);

    // Since the event bus now swallows errors, we can test that it returns the failure in PublishResult
    const result = await subscriptionDomainBus.publish(event);
    
    expect(result.failedHandlers).toBe(1);
    expect(result.failures[0].error).toBeInstanceOf(Error);
    expect((result.failures[0].error as Error).message).toBe("Redis connection lost");
  });
});
