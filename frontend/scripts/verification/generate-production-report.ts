import fs from "fs";
import path from "path";
import { REPORTS_DIR, EVIDENCE_FILE, VerificationStatus } from "./utils";

async function generateProductionReport() {
  console.log("==============================");
  console.log("GENERATE PRODUCTION REPORT");
  console.log("==============================\n");

  if (!fs.existsSync(EVIDENCE_FILE)) {
    console.error("No evidence file found!");
    process.exit(1);
  }

  const evidence = JSON.parse(fs.readFileSync(EVIDENCE_FILE, "utf-8"));
  const statuses = Object.values(evidence).map((e: any) => e.status as VerificationStatus);

  let productionStatus = "READY";
  if (statuses.includes("FAIL")) {
    productionStatus = "BLOCKED";
  } else if (statuses.includes("PENDING MANUAL VERIFICATION") || statuses.includes("WARNING")) {
    productionStatus = "CONDITIONAL";
  }

  let md = "# Cortex Systems Platform Billing - Production Readiness Report\n\n";
  md += `## Overall Status: **${productionStatus}**\n\n`;

  const getEvidenceFileContent = (filename: string) => {
    const fp = path.join(REPORTS_DIR, filename);
    if (fs.existsSync(fp)) {
      return fs.readFileSync(fp, "utf-8");
    }
    return "*(No detailed report generated)*";
  };

  const sections = [
    { key: "build", title: "Build & Schema Validation", reportFile: "build-report.md" },
    { key: "database", title: "Database Constraints", reportFile: "database-report.md" },
    { key: "telemetry", title: "Telemetry Schema", reportFile: "telemetry-report.json" },
    { key: "security", title: "Security Verification", reportFile: "security-report.md" },
    { key: "performance", title: "Performance Benchmarks", reportFile: "performance-report.json" },
    { key: "repository", title: "Repository Mutation Audit", reportFile: "repository-audit.md" },
    { key: "email", title: "Email Notifications", reportFile: "email-report.md" },
    { key: "dashboard", title: "Dashboard Visuals", reportFile: "screenshots/dashboard-status.md" },
    { key: "recovery", title: "Disaster Recovery", reportFile: "recovery-report.md" },
  ];

  const implementedAndVerified = [];
  const pendingManual = [];
  const failed = [];

  for (const sec of sections) {
    const stat = evidence[sec.key]?.status || "MISSING";
    const sectionMd = `### ${sec.title}\n**Status:** ${stat}\n\n<details><summary>View Evidence</summary>\n\n${
      sec.reportFile.endsWith(".json") 
        ? "```json\n" + getEvidenceFileContent(sec.reportFile) + "\n```" 
        : getEvidenceFileContent(sec.reportFile)
    }\n\n</details>\n`;

    if (stat === "PASS") {
      implementedAndVerified.push(sectionMd);
    } else if (stat === "FAIL") {
      failed.push(sectionMd);
    } else {
      pendingManual.push(sectionMd);
    }
  }

  md += "## 1. Verified Evidence\n\n";
  if (implementedAndVerified.length === 0) md += "*None*\n\n";
  else md += implementedAndVerified.join("\n");

  if (failed.length > 0) {
    md += "## 2. Failed Verifications (BLOCKERS)\n\n";
    md += failed.join("\n");
  }

  md += "## 3. Pending Manual Verification\n\n";
  if (pendingManual.length === 0) md += "*None*\n\n";
  else md += pendingManual.join("\n");

  md += `\n*Report generated at ${new Date().toISOString()}*\n`;

  fs.writeFileSync(path.join(REPORTS_DIR, "PRODUCTION_READINESS_REPORT.md"), md);
  console.log("Successfully generated PRODUCTION_READINESS_REPORT.md");
}

generateProductionReport().catch(console.error);
