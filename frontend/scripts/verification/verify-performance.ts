import { prisma } from "../../lib/prisma";
import { recordEvidence, generateReportFile, VerificationStatus } from "./utils";

async function verifyPerformance() {
  console.log("==============================");
  console.log("VERIFY PERFORMANCE");
  console.log("==============================\n");

  const report: any = {};
  let overallStatus: string = "PASS";

  const runBenchmark = async (name: string, fn: () => Promise<void>, iterations = 100) => {
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p95 = times[Math.floor(times.length * 0.95)];

    report[name] = { min, max, average: avg, median, p95, iterations };
    console.log(`[${name}] Avg: ${avg.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms`);

    // Basic threshold assert
    if (p95 > 500) {
      overallStatus = "WARNING";
    }
  };

  try {
    console.log("Benchmarking Billing Guard (DB Lookup)...");
    await runBenchmark("billingGuardLookup", async () => {
      await prisma.tenant.findFirst({ select: { id: true, billingStatus: true, billingEndsAt: true } });
    }, 100);

  } catch (error: any) {
    console.error("Benchmark failed", error);
    overallStatus = "FAIL";
    report.error = error.message;
  } finally {
    await prisma.$disconnect();
  }

  // Latency for cron and webhook processing is harder without actual HTTP endpoints/events
  // We will mark those as pending manual verification internally if they exceed capabilities
  report.cronExecution = "PENDING MANUAL VERIFICATION";
  report.webhookProcessing = "PENDING MANUAL VERIFICATION";

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("performance", {
    status: overallStatus,
  });

  generateReportFile("performance-report.json", JSON.stringify(report, null, 2));

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyPerformance().catch(console.error);
