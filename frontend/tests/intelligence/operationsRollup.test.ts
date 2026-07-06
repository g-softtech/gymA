import { prisma } from "@/lib/prisma";
import { IntelligenceOpsRollupJob } from "@/lib/intelligence/intelligenceOpsRollupJob";
import { Clock } from "@/lib/time/Clock";

class MockClock implements Clock {
  constructor(public currentTime: Date) {}
  now(): Date {
    return this.currentTime;
  }
}

describe("IntelligenceOpsRollupJob", () => {
  let mockClock: MockClock;
  let job: IntelligenceOpsRollupJob;

  beforeEach(() => {
    mockClock = new MockClock(new Date("2026-07-06T12:00:00Z"));
    job = new IntelligenceOpsRollupJob(mockClock);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a successful job log when runAll executes", async () => {
    // This will process all tenants in the test DB
    const result = await job.runAll();
    
    expect(result.success).toBe(true);
    expect(result.processedTenants).toBeGreaterThanOrEqual(0);

    const logs = await prisma.intelligenceRollupJobLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 1
    });

    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("SUCCESS");
    expect(logs[0].recordsProcessed).toBe(result.processedTenants);
  });
});
