import { recordEvidence, generateReportFile } from "./utils";
import fs from "fs";
import path from "path";

async function verifyDashboard() {
  console.log("==============================");
  console.log("VERIFY DASHBOARD");
  console.log("==============================\n");

  let overallStatus: any = "PENDING MANUAL VERIFICATION";
  let report = "# Dashboard Verification\n\n";

  // Check if Playwright is installed
  const pkgPath = path.join(__dirname, "../../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  const hasPlaywright = pkg.devDependencies?.["@playwright/test"] || pkg.dependencies?.["@playwright/test"];

  if (hasPlaywright) {
    report += "Playwright is installed, but full automated dashboard visual testing requires a seeded database and authentication mocking.\n";
    console.log("Playwright detected, but tests not configured. Defaulting to PENDING.");
  } else {
    report += "Playwright is NOT installed. Automated screenshot generation is unavailable.\n";
    console.log("Playwright not found.");
  }

  report += "\n**Status:** PENDING MANUAL VERIFICATION\n";

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("dashboard", {
    status: overallStatus,
  });

  generateReportFile("screenshots/dashboard-status.md", report);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyDashboard().catch(console.error);
