import { subscriptionEventBus } from "../../lib/events/subscriptionEventBus";

describe("Subscription Events", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // We spy on console.log because our current minimal implementation logs it.
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("emits event on subscription creation", async () => {
    await subscriptionEventBus.emit("subscription_created", {
      tenantId: "tenant_1",
      newPlanCode: "STARTER",
      newPlanVersion: 1,
      actor: "user"
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    const logArg = consoleSpy.mock.calls[0][1];
    const event = JSON.parse(logArg);
    
    expect(event.eventType).toBe("subscription_created");
    expect(event.payload.newPlanCode).toBe("STARTER");
    expect(event.schemaVersion).toBe(1);
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeDefined();
  });

  it("emits event on upgrade", async () => {
    await subscriptionEventBus.emit("subscription_upgraded", {
      tenantId: "tenant_1",
      previousPlanCode: "STARTER",
      previousPlanVersion: 1,
      newPlanCode: "PRO",
      newPlanVersion: 1,
      actor: "user"
    });

    const logArg = consoleSpy.mock.calls[0][1];
    const event = JSON.parse(logArg);
    expect(event.eventType).toBe("subscription_upgraded");
  });

  it("emits event on downgrade", async () => {
    await subscriptionEventBus.emit("subscription_downgraded", {
      tenantId: "tenant_1",
      previousPlanCode: "PRO",
      previousPlanVersion: 1,
      newPlanCode: "STARTER",
      newPlanVersion: 1,
      actor: "admin"
    });

    const logArg = consoleSpy.mock.calls[0][1];
    const event = JSON.parse(logArg);
    expect(event.eventType).toBe("subscription_downgraded");
  });

  it("is append-only (no mutation)", () => {
    // In our current implementation, emit just builds the object and passes it to the persistent layer.
    // There are no methods on subscriptionEventBus to update or delete events.
    expect((subscriptionEventBus as any).update).toBeUndefined();
    expect((subscriptionEventBus as any).delete).toBeUndefined();
  });
});
