import { execSync } from "child_process";
import { recordEvidence, generateReportFile } from "./utils";

async function verifyBuild() {
  console.log("==============================");
  console.log("VERIFY BUILD");
  console.log("==============================\n");

  let reportContent = "# Build Verification Report\n\n";
  let overallStatus: string = "PASS";

  const runCommand = (cmd: string) => {
    console.log(`Running:\n${cmd}\n`);
    let output = "";
    let exitCode = 0;
    try {
      output = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
      console.log(output);
      console.log(`Exit Code: 0\n`);
    } catch (error: any) {
      exitCode = error.status || 1;
      output = error.stdout + "\n" + error.stderr;
      console.error(output);
      console.error(`Exit Code: ${exitCode}\n`);
      overallStatus = "FAIL";
    }

    reportContent += `### Command: \`${cmd}\`\n`;
    reportContent += `**Exit Code:** ${exitCode}\n`;
    reportContent += `\`\`\`text\n${output.trim()}\n\`\`\`\n\n`;
  };

  runCommand("npx prisma validate");
  runCommand("npx tsc --noEmit");
  runCommand("npm run build");

  console.log(`Status:\n${overallStatus}\n`);

  recordEvidence("build", {
    status: overallStatus,
    exitCode: overallStatus === "PASS" ? 0 : 1,
    createdAt: new Date().toISOString(),
  });

  generateReportFile("build-report.md", reportContent);

  if (overallStatus === "FAIL") {
    process.exit(1);
  }
}

verifyBuild().catch(console.error);
