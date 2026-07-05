import { prisma } from "../../lib/prisma";
import { recordEvidence, generateReportFile, VerificationStatus } from "./utils";

async function verifyTelemetry() {
  console.log("==============================");
  console.log("VERIFY TELEMETRY");
  console.log("==============================\n");

  let overallStatus: string = "PASS";
  const report: any = { events: [] };
  let failCount = 0;

  try {
    const events = await prisma.billingEvent.findMany({ 
      where: { eventType: "BILLING_STATE_TRANSITION" },
      take: 10, 
      orderBy: { createdAt: "desc" } 
    });

    for (const evt of events) {
      const payload = evt.payload as Record<string, any> | null;
      if (!payload) continue;

      const eventReport: any = { eventId: evt.eventId, fields: {} };

      const checkField = (field: string, condition: boolean) => {
        eventReport.fields[field] = condition ? "PASS" : "FAIL";
        if (!condition) {
          overallStatus = "FAIL";
          failCount++;
        }
      };

      // UUID / string check
      checkField("tenantId", typeof payload.tenantId === "string" && payload.tenantId.length > 0);
      
      // ISO8601 timestamp check (if it exists)
      const ts = payload.timestamp;
      const isIso = typeof ts === "string" && !isNaN(Date.parse(ts));
      const isEpoch = typeof ts === "number";
      checkField("timestamp", isIso || isEpoch);

      // Exists check
      checkField("correlationId", !!payload.correlationId);
      checkField("workerId", !!payload.workerId);
      checkField("cronExecutionId", payload.cronExecutionId !== undefined || payload.eventType !== "cron");

      // Enum check
      const validStatuses = ["ACTIVE", "TRIALING", "PAST_DUE", "SUSPENDED", "EXPIRED", "GRACE_PERIOD"];
      checkField("billingStatusBefore", !payload.billingStatusBefore || validStatuses.includes(payload.billingStatusBefore));
      checkField("billingStatusAfter", !payload.billingStatusAfter || validStatuses.includes(payload.billingStatusAfter));

      report.events.push(eventReport);
    }
  } catch (error: any) {
    console.error(error);
    overallStatus = "FAIL";
    failCount++;
    report.error = error.message;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("telemetry", {
    status: overallStatus,
    failures: failCount,
  });

  generateReportFile("telemetry-report.json", JSON.stringify(report, null, 2));

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyTelemetry().catch(console.error);
