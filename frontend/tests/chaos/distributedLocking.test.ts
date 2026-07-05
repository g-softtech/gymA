import { prisma } from "@/lib/prisma";
import { acquireLock, releaseLock } from "@/lib/distributedLock";

describe("Distributed Locking (Chaos)", () => {
  const TEST_LOCKS = ["test-cron-job", "crash-test-job"];

  beforeEach(async () => {
    // Clear only test locks before each test
    await prisma.cronLock.deleteMany({ where: { id: { in: TEST_LOCKS } } });
  });

  afterAll(async () => {
    await prisma.cronLock.deleteMany({ where: { id: { in: TEST_LOCKS } } });
  });

  it("should prevent concurrent executions of the same cron job", async () => {
    const lockId = "test-cron-job";
    const correlationId1 = "exec-1";
    const correlationId2 = "exec-2";

    // Simulate Cron Instance 1 waking up
    const acquired1 = await acquireLock({ lockId, timeoutMs: 5000, correlationId: correlationId1 });
    expect(acquired1).toBe(true);

    // Simulate Cron Instance 2 waking up precisely while Instance 1 is running
    const acquired2 = await acquireLock({ lockId, timeoutMs: 5000, correlationId: correlationId2 });
    
    // Instance 2 MUST be blocked
    expect(acquired2).toBe(false);

    // Instance 1 finishes and releases lock
    await releaseLock(lockId, correlationId1);

    // Instance 3 wakes up later and CAN acquire it
    const acquired3 = await acquireLock({ lockId, timeoutMs: 5000, correlationId: "exec-3" });
    expect(acquired3).toBe(true);
    await releaseLock(lockId, "exec-3");
  });

  it("should auto-recover if a previous execution crashed (timeout expiration)", async () => {
    const lockId = "crash-test-job";
    
    // Instance 1 acquires but CRASHES (does not call releaseLock)
    // We simulate this by manually inserting an expired lock
    const now = new Date();
    await prisma.cronLock.create({
      data: {
        id: lockId,
        lockedAt: new Date(now.getTime() - 10000), // locked 10s ago
        expiresAt: new Date(now.getTime() - 5000), // expired 5s ago
      }
    });

    // Instance 2 wakes up. The lock exists but is expired. It MUST claim it successfully.
    const acquired = await acquireLock({ lockId, timeoutMs: 5000, correlationId: "exec-recovery" });
    expect(acquired).toBe(true);

    // Verify it updated the lock rather than crashing
    const lock = await prisma.cronLock.findUnique({ where: { id: lockId } });
    expect(lock?.expiresAt.getTime()).toBeGreaterThan(now.getTime());

    await releaseLock(lockId, "exec-recovery");
  });
});
