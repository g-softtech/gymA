/**
 * FORENSIC LOG CAPTURE — CortexFit Auth Chain
 *
 * PURPOSE: Capture the exact log output from jwt() → session() → access-control → middleware
 * during a real login for sadeawo85@gmail.com.
 *
 * HOW TO USE:
 * 1. Kill any running Next.js dev server.
 * 2. Run: node capture-auth-logs.js
 *    This starts the dev server and streams logs to both console AND a timestamped file.
 * 3. In your browser, complete the login flow for sadeawo85@gmail.com via Google.
 * 4. After you land on the final page (wherever that is), press Ctrl+C here.
 * 5. The log file will be saved to: forensic-auth-capture-<timestamp>.log
 *
 * The log file will contain the complete FORENSIC: chain.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = path.join(__dirname, `forensic-auth-capture-${timestamp}.log`);
const stream = fs.createWriteStream(logFile, { flags: "a" });

console.log(`\n${"=".repeat(70)}`);
console.log(` FORENSIC CAPTURE ACTIVE`);
console.log(` Log file: ${logFile}`);
console.log(`${"=".repeat(70)}`);
console.log(`\n ▶  Now open your browser and complete these steps:`);
console.log(`    1. Go to: http://localhost:3000/api/auth/signout`);
console.log(`    2. Click "Sign out"`);
console.log(`    3. Go to: http://localhost:3000/auth/signin`);
console.log(`    4. Click "Continue with Google"`);
console.log(`    5. Sign in as: sadeawo85@gmail.com`);
console.log(`    6. After landing on the final page, go to:`);
console.log(`       http://localhost:3000/api/auth/session`);
console.log(`    7. Note the JSON content and the URL you are on.`);
console.log(`    8. Press Ctrl+C here when done.\n`);

const server = spawn("npx", ["next", "dev"], {
  cwd: __dirname,
  shell: true,
  env: { ...process.env },
});

const FORENSIC_PREFIXES = [
  "[FORENSIC:",
  "[AUTH TRACE]",
  "[AUTH VERIFY]",
  "[ACCESS CONTROL",
  "GET /",
  "POST /",
  " ✓",
  "Error",
  "error",
];

function shouldCapture(line) {
  return FORENSIC_PREFIXES.some((prefix) => line.includes(prefix));
}

function processLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;

  // Always write to file
  const entry = `[${new Date().toISOString()}] ${trimmed}\n`;
  stream.write(entry);

  // Only print FORENSIC lines to console (reduce noise)
  if (trimmed.includes("[FORENSIC:") || trimmed.includes("Error") || trimmed.includes("GET /") || trimmed.includes("POST /")) {
    console.log(trimmed);
  }
}

let stdoutBuffer = "";
server.stdout.on("data", (data) => {
  stdoutBuffer += data.toString();
  const lines = stdoutBuffer.split("\n");
  stdoutBuffer = lines.pop(); // Keep last incomplete line in buffer
  lines.forEach(processLine);
});

let stderrBuffer = "";
server.stderr.on("data", (data) => {
  stderrBuffer += data.toString();
  const lines = stderrBuffer.split("\n");
  stderrBuffer = lines.pop();
  lines.forEach(processLine);
});

server.on("close", (code) => {
  stream.end();
  console.log(`\n${"=".repeat(70)}`);
  console.log(` CAPTURE COMPLETE`);
  console.log(` Log saved to: ${logFile}`);
  console.log(`${"=".repeat(70)}\n`);
});

process.on("SIGINT", () => {
  console.log("\n\n Stopping server...");
  server.kill();
  setTimeout(() => process.exit(0), 500);
});
