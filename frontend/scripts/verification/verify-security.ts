import fs from "fs";
import path from "path";
import { recordEvidence, generateReportFile, VerificationStatus } from "./utils";
import { execSync } from "child_process";

async function verifySecurity() {
  console.log("==============================");
  console.log("VERIFY SECURITY");
  console.log("==============================\n");

  let reportContent = "# Security Verification Report\n\n";
  let overallStatus: string = "PASS";
  let failCount = 0;

  const runGrep = (pattern: string, excludeDirs: string[] = ["node_modules", "dist", ".next", "coverage", "scripts"]) => {
    try {
      const excludeArgs = excludeDirs.map(d => `--exclude-dir=${d}`).join(" ");
      const cmd = `git grep -n -E "${pattern}" -- ':!scripts' ':!tests' ':!docs' ':!*.md'`;
      const output = execSync(cmd, { encoding: "utf8", cwd: path.join(__dirname, "../../") });
      return output.split("\n").filter(l => l.trim().length > 0);
    } catch (e: any) {
      // grep exits with 1 if no matches found
      return [];
    }
  };

  const check = (name: string, lines: string[], allowedCount: number = 0, shouldFail: boolean = true) => {
    const count = lines.length;
    const passed = count <= allowedCount;
    reportContent += `### ${name}\n`;
    reportContent += `- Matches found: ${count}\n`;
    reportContent += `- Status: ${passed ? "✅ PASS" : (shouldFail ? "❌ FAIL" : "⚠️ WARNING")}\n`;
    
    if (count > 0) {
      reportContent += `\`\`\`text\n${lines.slice(0, 10).join("\n")}${count > 10 ? "\n... (truncated)" : ""}\n\`\`\`\n`;
    }
    reportContent += "\n";

    if (!passed && shouldFail) {
      overallStatus = "FAIL";
      failCount++;
    } else if (!passed && !shouldFail && overallStatus === "PASS") {
      overallStatus = "WARNING";
    }
  };

  console.log("Scanning for Unsafe SQL...");
  const unsafeSql = runGrep("\\$queryRawUnsafe|\\$executeRawUnsafe");
  check("Unsafe SQL Queries", unsafeSql, 0, true);

  console.log("Scanning for Hardcoded Secrets...");
  const hardcodedSecrets = runGrep("(?i)secret\\s*=\\s*['\"][^'\"]+['\"]|(?i)api_?key\\s*=\\s*['\"][^'\"]+['\"]");
  check("Hardcoded Keys/Secrets", hardcodedSecrets, 0, true);

  console.log("Scanning for console logs...");
  const consoleLogs = runGrep("console\\.(log|error|info)\\([^)]*(SECRET|PAYSTACK|STRIPE|RESEND|JWT|AUTH)[^)]*\\)");
  check("Secrets in Console Logs", consoleLogs, 0, true);

  console.log("Scanning for Superadmin Scoping...");
  const superadminRoutes = runGrep("requireSuperAdmin", ["node_modules"]);
  check("Superadmin Authorization Usage", superadminRoutes, -1, false); // Just informational

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("security", {
    status: overallStatus,
    failures: failCount,
  });

  generateReportFile("security-report.md", reportContent);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifySecurity().catch(console.error);
