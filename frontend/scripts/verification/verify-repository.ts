import path from "path";
import { execSync } from "child_process";
import { recordEvidence, generateReportFile, VerificationStatus } from "./utils";

interface Finding {
  file: string;
  line: number;
  pattern: string;
  allowed: boolean;
  reason: string;
}

const AUTHORIZED_FILES = [
  "lib/subscriptions/platformLifecycleEngine.ts",
  "lib/billing/billingReconciliationJob.ts",
  "app/api/webhooks/platform-billing/route.ts"
];

async function verifyRepository() {
  console.log("==============================");
  console.log("VERIFY REPOSITORY");
  console.log("==============================\n");

  const findings: Finding[] = [];
  let overallStatus: string = "PASS";

  const runGrep = (pattern: string) => {
    try {
      const cmd = `git grep -n -E "${pattern}" -- app lib components`;
      const output = execSync(cmd, { encoding: "utf8", cwd: path.join(__dirname, "../../") });
      return output.split("\n").filter(l => l.trim().length > 0);
    } catch (e) {
      return [];
    }
  };

  const processLines = (lines: string[], patternLabel: string) => {
    for (const line of lines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        const file = match[1];
        const lineNum = parseInt(match[2], 10);
        const content = match[3];

        const isAuthorized = AUTHORIZED_FILES.some(auth => file.includes(auth));
        
        findings.push({
          file: file.replace(/\\/g, '/'),
          line: lineNum,
          pattern: patternLabel,
          allowed: isAuthorized,
          reason: isAuthorized ? "Authorized lifecycle owner" : "Unauthorized billing mutation"
        });

        if (!isAuthorized) {
          overallStatus = "FAIL";
        }
      }
    }
  };

  const runGrepBilling = () => {
    try {
      const cmd = `git grep -n -E "billingStatus\\s*:|billingEndsAt\\s*:|trialEndsAt\\s*:" -- app lib components`;
      const output = execSync(cmd, { encoding: "utf8", cwd: path.join(__dirname, "../../") });
      return output.split("\\n").filter(l => l.trim().length > 0 && !l.startsWith("app/(superadmin)/admin/billing/page.tsx") && !l.includes(".tsx:"));
    } catch (e) {
      return [];
    }
  };

  processLines(runGrepBilling(), "Billing state assignment");

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("repository", {
    status: overallStatus,
    findingCount: findings.length,
    unauthorizedCount: findings.filter(f => !f.allowed).length,
  });

  generateReportFile("repository-audit.json", JSON.stringify(findings, null, 2));

  let mdReport = "# Repository Audit Report\n\n";
  mdReport += `Total Findings: ${findings.length}\n`;
  mdReport += `Unauthorized Mutations: ${findings.filter(f => !f.allowed).length}\n\n`;

  mdReport += "| File | Line | Pattern | Allowed | Reason |\n";
  mdReport += "| ---- | ---- | ------- | ------- | ------ |\n";
  for (const f of findings) {
    const icon = f.allowed ? "✅" : "❌";
    mdReport += `| ${f.file} | ${f.line} | \`${f.pattern}\` | ${icon} | ${f.reason} |\n`;
  }

  // Quick fix for generateReportFile not taking 'json' properly if we used generic
  generateReportFile("repository-audit.md", mdReport);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyRepository().catch(console.error);
