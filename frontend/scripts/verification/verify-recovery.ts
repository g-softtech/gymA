import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { recordEvidence, generateReportFile } from "./utils";

async function verifyRecovery() {
  console.log("==============================");
  console.log("VERIFY RECOVERY");
  console.log("==============================\n");

  let overallStatus: string = "PASS";
  let report = "# Recovery Verification Report\n\n";

  const runbookPath = path.join(__dirname, "../../docs/DISASTER_RECOVERY.md");
  if (fs.existsSync(runbookPath)) {
    report += "✅ Runbook exists: `docs/DISASTER_RECOVERY.md`\n";
    console.log("Runbook found.");
  } else {
    report += "❌ Runbook missing!\n";
    overallStatus = "FAIL";
    console.error("Runbook missing.");
  }

  const scriptPath = path.join(__dirname, "../../scripts/billing-disaster-recovery.ts");
  if (fs.existsSync(scriptPath)) {
    report += "✅ Recovery script exists: `scripts/billing-disaster-recovery.ts`\n";
  } else {
    report += "❌ Recovery script missing!\n";
    overallStatus = "FAIL";
  }

  // PITR
  report += "\n### Point-In-Time Recovery (PITR)\n";
  report += "PITR requires manual staging verification via the Neon console.\n";
  report += "Status: PENDING MANUAL VERIFICATION\n";
  
  if (overallStatus === "PASS") {
    overallStatus = "PENDING MANUAL VERIFICATION";
  }

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("recovery", {
    status: overallStatus as any,
  });

  generateReportFile("recovery-report.md", report);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyRecovery().catch(console.error);
