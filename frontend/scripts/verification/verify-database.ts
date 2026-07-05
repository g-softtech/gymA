import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { recordEvidence, generateReportFile, VerificationStatus } from "./utils";

async function verifyDatabase() {
  console.log("==============================");
  console.log("VERIFY DATABASE");
  console.log("==============================\n");

  let reportContent = "# Database Verification Report\n\n";
  let overallStatus: string = "PASS";
  let failCount = 0;

  const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
  let schema = "";
  try {
    schema = fs.readFileSync(schemaPath, "utf-8");
  } catch (e) {
    console.error("Could not read schema.prisma");
    overallStatus = "FAIL";
  }

  const checkPattern = (description: string, regex: RegExp, requiredCount: number = 1) => {
    const matches = schema.match(regex);
    const count = matches ? matches.length : 0;
    const passed = count >= requiredCount;
    reportContent += `- **${description}**: ${passed ? "✅ PASS" : "❌ FAIL"}\n`;
    if (!passed) {
      failCount++;
      overallStatus = "FAIL";
    }
  };

  // Extract model blocks to make checks more precise
  const getModelBody = (modelName: string) => {
    const match = schema.match(new RegExp(`model ${modelName} \\{[^}]+\\}`, "s"));
    return match ? match[0] : "";
  };

  const tenantModel = getModelBody("Tenant");
  const subscriptionModel = getModelBody("Subscription");
  const billingEventModel = getModelBody("BillingEvent");

  reportContent += "### Schema Inspection\n";
  
  // Verify billingStatus index
  checkPattern("Index on billingStatus (Tenant)", /@@index\(\[.*billingStatus.*\]\)/, 1);
  // Verify billingEndsAt index
  checkPattern("Index on billingEndsAt (Tenant)", /@@index\(\[.*billingEndsAt.*\]\)/, 1);
  // Verify trialEndsAt index (if applicable, possibly on Tenant or Subscription)
  checkPattern("Index on trialEndsAt (Tenant)", /@@index\(\[.*trialEndsAt.*\]\)/, 1);

  // Unique constraint on webhook event IDs (eventId in BillingEvent)
  checkPattern("Unique webhook event IDs (BillingEvent.eventId)", /eventId\s+String\s+(@unique|@id)/, 1);

  // NOT NULL constraints (no ? on critical fields)
  const billingNotNull = schema.includes("billingStatus    String");
  reportContent += `- **billingStatus is NOT NULL (Tenant)**: ${billingNotNull ? "✅ PASS" : "❌ FAIL"}\n`;
  if (!billingNotNull) {
    failCount++;
    overallStatus = "FAIL";
  }

  reportContent += "\n### Migration Status\n";
  console.log("Running: npx prisma migrate status");
  try {
    const output = execSync("npx prisma migrate status", { encoding: "utf8", stdio: "pipe" });
    console.log(output);
    reportContent += `\`\`\`text\n${output.trim()}\n\`\`\`\n\n`;
    if (!output.includes("Database schema is up to date")) {
       reportContent += "⚠️ Output did not contain 'Database schema is up to date'.\n";
       overallStatus = "FAIL";
    }
  } catch (error: any) {
    console.error(error.stdout || error.message);
    reportContent += `\`\`\`text\n${error.stdout || error.message}\n\`\`\`\n\n`;
    overallStatus = "FAIL";
    failCount++;
  }

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("database", {
    status: overallStatus,
    failures: failCount,
  });

  generateReportFile("database-report.md", reportContent);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyDatabase().catch(console.error);
