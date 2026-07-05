import { execSync } from "child_process";
import path from "path";

const scripts = [
  "verify-build.ts",
  "verify-database.ts",
  "verify-security.ts",
  "verify-repository.ts",
  "verify-telemetry.ts",
  "verify-performance.ts",
  "verify-email.ts",
  "verify-dashboard.ts",
  "verify-recovery.ts",
  "generate-production-report.ts"
];

async function runAll() {
  console.log("==========================================");
  console.log("STARTING PRODUCTION VERIFICATION FRAMEWORK");
  console.log("==========================================\n");

  for (const script of scripts) {
    const startTime = new Date();
    console.log(`\n>>> EXECUTING: ${script} (Started: ${startTime.toISOString()})`);
    
    try {
      const cmd = `npx tsx scripts/verification/${script}`;
      // inherit stdio to pipe output directly to console
      execSync(cmd, { stdio: "inherit", cwd: path.join(__dirname, "../../") });
    } catch (e: any) {
      console.error(`\n[WARNING] Script ${script} failed with exit code ${e.status}. Continuing to next verification...`);
    }
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(`<<< FINISHED: ${script} (Duration: ${duration}s)\n`);
  }

  console.log("==========================================");
  console.log("VERIFICATION SUITE COMPLETE");
  console.log("==========================================\n");
}

runAll().catch(console.error);
