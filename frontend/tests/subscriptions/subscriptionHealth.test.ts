import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSubscriptionHealthSummary } from "../../lib/subscriptions/subscriptionHealth";
import * as repo from "../../lib/repositories/subscriptionRepository";
import * as dateUtils from "../../lib/date/dateUtils";
import { MembershipStatus } from "@prisma/client";

vi.mock("../../lib/repositories/subscriptionRepository");
vi.mock("../../lib/date/dateUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/date/dateUtils")>();
  return {
    ...actual,
    now: vi.fn(),
  };
});

describe("Subscription Health Calculations", () => {
  const mockUtcNow = new Date("2026-07-05T12:00:00.000Z");

  beforeEach(() => {
    vi.mocked(dateUtils.now).mockReturnValue(mockUtcNow);
  });

  const createMockSub = (
    status: repo.SubscriptionHealthRecord["status"],
    endDateStr: string
  ): repo.SubscriptionHealthRecord => ({
    id: "sub_1",
    memberId: "mem_1",
    status,
    endDate: new Date(endDateStr),
    startDate: new Date("2026-06-05T12:00:00.000Z"),
    plan: { name: "Test Plan" },
    member: { user: { name: "Test", email: "test@test.com" } },
  });

  it("bucket 24h: Subscription expires exactly now should be EXPIRED, not active", async () => {
    vi.mocked(repo.getSubscriptionsForHealth).mockResolvedValue([
      createMockSub("ACTIVE", "2026-07-05T12:00:00.000Z"),
    ]);

    const result = await getSubscriptionHealthSummary("tenant_1");
    expect(result.metrics.expired).toBe(1);
    expect(result.metrics.active).toBe(0);
    expect(result.metrics.expiring24h).toBe(0);
  });

  it("bucket 24h: expires in 2 hours", async () => {
    vi.mocked(repo.getSubscriptionsForHealth).mockResolvedValue([
      createMockSub("ACTIVE", "2026-07-05T14:00:00.000Z"),
    ]);
    const result = await getSubscriptionHealthSummary("tenant_1");
    expect(result.metrics.expiring24h).toBe(1);
    expect(result.metrics.active).toBe(1); // Still counts as active
  });

  it("bucket 3d: expires in 48 hours", async () => {
    vi.mocked(repo.getSubscriptionsForHealth).mockResolvedValue([
      createMockSub("ACTIVE", "2026-07-07T12:00:00.000Z"),
    ]);
    const result = await getSubscriptionHealthSummary("tenant_1");
    expect(result.metrics.expiring24h).toBe(0);
    expect(result.metrics.expiring3d).toBe(1);
  });

  it("bucket 7d: expires in 5 days", async () => {
    vi.mocked(repo.getSubscriptionsForHealth).mockResolvedValue([
      createMockSub("ACTIVE", "2026-07-10T12:00:00.000Z"),
    ]);
    const result = await getSubscriptionHealthSummary("tenant_1");
    expect(result.metrics.expiring7d).toBe(1);
    expect(result.metrics.expiring3d).toBe(0);
  });

  it("Cancelled but endDate still future (Cancel at period end)", async () => {
    vi.mocked(repo.getSubscriptionsForHealth).mockResolvedValue([
      createMockSub("CANCELLED", "2026-07-10T12:00:00.000Z"),
    ]);
    const result = await getSubscriptionHealthSummary("tenant_1");
    // Depending on logic, it shouldn't be counted as active or expiring soon if status is CANCELLED.
    expect(result.metrics.active).toBe(0);
    expect(result.metrics.expiring7d).toBe(0); 
  });

  it("Timezone edge cases: Midnight expiry", async () => {
    vi.mocked(repo.getSubscriptionsForHealth).mockResolvedValue([
      createMockSub("ACTIVE", "2026-07-06T00:00:00.000Z"), // 12 hours from mock now
    ]);
    const result = await getSubscriptionHealthSummary("tenant_1");
    expect(result.metrics.expiring24h).toBe(1);
  });
});
