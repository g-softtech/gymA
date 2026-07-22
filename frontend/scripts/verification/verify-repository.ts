import path from "path";
import fs from "fs";
import { recordEvidence, generateReportFile } from "./utils";

interface Finding {
  file: string;
  line: number;
  pattern: string;
  allowed: boolean;
  reason: string;
}

const BILLING_OWNER_DIRECTORIES = [
  "lib/billing/",
  "lib/subscriptions/",
  "app/api/webhooks/platform-billing/",
  "app/api/payments/",
  "app/api/billing/initialize/",
  "app/api/admin/revenue/refund/",
  "app/api/cron/subscriptions/",
  "app/api/member/subscription/",
  "scripts/seed",
];

const AUTHORIZED_FILES = [
  "lib/paymentFulfillment.ts",
  "scripts/cleanup-tenants.ts",
  "scripts/billing-disaster-recovery.ts",
  "scripts/phase15_audit.ts"
];

const ALLOWED_RAW_SQL = [
  "scripts/billing-disaster-recovery.ts"
];

const REPO_ROOT = path.join(__dirname, "../../");

function isAuthorized(file: string, isRawSql: boolean = false): boolean {
  const relativePath = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  
  if (isRawSql) {
    return ALLOWED_RAW_SQL.includes(relativePath);
  }
  
  const inDir = BILLING_OWNER_DIRECTORIES.some(dir => relativePath.startsWith(dir));
  const isFile = AUTHORIZED_FILES.some(auth => relativePath === auth);
  return inDir || isFile;
}

// recursively read all ts/tsx files
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      const isReportsDir = filePath.includes(path.join("scripts", "verification", "reports"));
      const isFixturesDir = filePath.includes(path.join("scripts", "verification", "fixtures"));
      const isNodeModules = filePath.includes("node_modules");
      if (!isReportsDir && !isFixturesDir && !isNodeModules) {
        getAllFiles(filePath, fileList);
      }
    } else if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function verifyRepository() {
  console.log("==============================");
  console.log("VERIFY REPOSITORY (CONTEXTUAL SCANNER)");
  console.log("Note: Scanner detects inline mutation payloads.");
  console.log("Indirect object assignments (e.g., const data = { ... }; prisma.update({ data })) require future AST enhancement.");
  console.log("==============================\n");

  const findings: Finding[] = [];
  let overallStatus: string = "PASS";

  const allFiles = [
    ...getAllFiles(path.join(REPO_ROOT, "app")),
    ...getAllFiles(path.join(REPO_ROOT, "lib")),
    ...getAllFiles(path.join(REPO_ROOT, "components")),
    ...getAllFiles(path.join(REPO_ROOT, "scripts")),
  ];

  for (const file of allFiles) {
    // Exclude self from scan to prevent false positives from scanner's own code
    if (file.replace(/\\/g, '/').endsWith('scripts/verification/verify-repository.ts')) {
      continue;
    }
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    // SCANNER 1 & 2: Prisma Mutations
    const prismaMutationRegex = /prisma\.(tenant|subscription|transaction|saasInvoice|billingEvent)\.(create|update|updateMany|upsert|delete|deleteMany)/g;
    
    let match;
    while ((match = prismaMutationRegex.exec(content)) !== null) {
      const model = match[1];
      const operation = match[2];
      
      const lineNum = content.substring(0, match.index).split("\n").length;
      const contextLines = lines.slice(lineNum - 1, lineNum + 50).join("\n");
      
      if (model === "tenant") {
        // Scanner 1: Check for protected billing fields inside Tenant mutation
        if (contextLines.match(/billingStatus\s*:/) || 
            contextLines.match(/billingEndsAt\s*:/) || 
            contextLines.match(/trialEndsAt\s*:/) || 
            contextLines.match(/plan\s*:/)) {
            
            const authorized = isAuthorized(file, false);
            findings.push({
              file: path.relative(REPO_ROOT, file).replace(/\\/g, '/'),
              line: lineNum,
              pattern: `Tenant DB Mutation (${operation})`,
              allowed: authorized,
              reason: authorized ? "Authorized lifecycle owner" : "Unauthorized billing mutation"
            });
            if (!authorized) overallStatus = "FAIL";
        }
      } else {
        // Scanner 2: Subscription, transaction, invoice, billingEvent mutations
        const authorized = isAuthorized(file, false);
        findings.push({
          file: path.relative(REPO_ROOT, file).replace(/\\/g, '/'),
          line: lineNum,
          pattern: `${model.charAt(0).toUpperCase() + model.slice(1)} DB Mutation (${operation})`,
          allowed: authorized,
          reason: authorized ? "Authorized lifecycle owner" : "Unauthorized billing mutation"
        });
        if (!authorized) overallStatus = "FAIL";
      }
    }

    // SCANNER 3: Raw SQL Scanner
    const rawSqlRegex = /(queryRaw|executeRaw)/g;
    while ((match = rawSqlRegex.exec(content)) !== null) {
       const lineNum = content.substring(0, match.index).split("\n").length;
       const contextLines = lines.slice(lineNum - 1, lineNum + 10).join("\n");
       const normalizedSql = contextLines.replace(/\s+/g, " ");
       
       if (/ (UPDATE|DELETE|INSERT|ALTER|DROP) /i.test(normalizedSql)) {
          const authorized = isAuthorized(file, true);
          findings.push({
            file: path.relative(REPO_ROOT, file).replace(/\\/g, '/'),
            line: lineNum,
            pattern: `Raw SQL Mutation`,
            allowed: authorized,
            reason: authorized ? "Authorized lifecycle owner" : "Unauthorized billing mutation"
          });
          if (!authorized) overallStatus = "FAIL";
       }
    }
  }

  const uniqueFindings = findings.filter((f, index, self) => 
    index === self.findIndex((t) => t.file === f.file && t.line === f.line)
  );

  console.log(`Status:\n${overallStatus}\n`);
  console.log(`Total Findings: ${uniqueFindings.length}`);
  console.log(`Unauthorized: ${uniqueFindings.filter(f => !f.allowed).length}\n`);

  recordEvidence("repository", {
    status: overallStatus,
    findingCount: uniqueFindings.length,
    unauthorizedCount: uniqueFindings.filter(f => !f.allowed).length,
  });

  generateReportFile("repository-audit.json", JSON.stringify(uniqueFindings, null, 2));

  let mdReport = "# Repository Audit Report\n\n";
  mdReport += `Total Findings: ${uniqueFindings.length}\n`;
  mdReport += `Unauthorized Mutations: ${uniqueFindings.filter(f => !f.allowed).length}\n\n`;

  mdReport += "| File | Line | Pattern | Allowed | Reason |\n";
  mdReport += "| ---- | ---- | ------- | ------- | ------ |\n";
  for (const f of uniqueFindings) {
    const icon = f.allowed ? "✅" : "❌";
    mdReport += `| ${f.file} | ${f.line} | \`${f.pattern}\` | ${icon} | ${f.reason} |\n`;
  }

  generateReportFile("repository-audit.md", mdReport);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyRepository().catch(console.error);
