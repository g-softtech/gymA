/**
 * VERCEL FORENSIC LOG CAPTURE — SMART VERSION
 *
 * Finds the newest READY production deployment automatically.
 * Streams runtime logs and filters for FORENSIC: lines.
 * Saves everything to a timestamped file.
 *
 * Usage: node vercel-log-capture-v2.js
 * Press Ctrl+C when done.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Read token from sibling file
const captureFile = path.join(__dirname, "vercel-log-capture.js");
const content = fs.readFileSync(captureFile, "utf8");
const m = content.match(/VERCEL_TOKEN\s*=\s*["']?([^"'\s;]+)["']?/);
const VERCEL_TOKEN = m ? m[1] : "";
const VERCEL_PROJECT_ID = "prj_i7yH0EdgE5W2M2RaWl4XFmEqMfW2";
const VERCEL_TEAM_ID = "team_bApvcVnmXpdK6jJeTh0mv8nv";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = path.join(__dirname, `forensic-capture-${timestamp}.log`);
const stream = fs.createWriteStream(logFile, { flags: "a" });

function get(urlPath) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: "api.vercel.com",
      path: urlPath,
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    }).on("error", reject);
  });
}

async function getNewestReadyDeployment() {
  const result = await get(
    `/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&limit=10&target=production`
  );
  const deps = result.deployments || [];
  // Find newest READY one
  const ready = deps.filter(d => d.state === "READY");
  if (ready.length === 0) throw new Error("No READY production deployments found");
  const newest = ready[0];
  console.log(`\n  Using deployment: ${newest.uid}`);
  console.log(`  State:   ${newest.state}`);
  console.log(`  URL:     https://${newest.url}`);
  console.log(`  Created: ${new Date(newest.createdAt).toISOString()}\n`);
  return newest.uid;
}

function streamLogs(deploymentId) {
  let since = Date.now() - 3000;
  let lineCount = 0;

  console.log("=".repeat(70));
  console.log(" FORENSIC LOG CAPTURE ACTIVE");
  console.log(` Log file: ${logFile}`);
  console.log("=".repeat(70));
  console.log("\n NOW TRIGGER THE SCENARIOS IN THE BROWSER:\n");
  console.log("  SCENARIO A: Register new user → create gym → observe if loop");
  console.log("  SCENARIO B: Google login as sadeawo85@gmail.com → final URL");
  console.log("  SCENARIO C: Login as ibukunawo16@gmail.com → join tenant-a-audit\n");
  console.log(" After each scenario visit: https://cortexfit.vercel.app/api/auth/session");
  console.log(" Press Ctrl+C when ALL scenarios are done.\n");

  const poll = () => {
    const urlPath = `/v2/deployments/${deploymentId}/events?since=${since}&limit=500&builds=0&teamId=${VERCEL_TEAM_ID}`;
    https.get({
      hostname: "api.vercel.com",
      path: urlPath,
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const lines = data.trim().split("\n");
        let latestTs = since;
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            if (!ev) continue;
            const text = ev.payload?.text ?? ev.text ?? "";
            const created = ev.created ?? ev.payload?.created ?? Date.now();
            if (created > latestTs) latestTs = created;
            if (!text) continue;

            const entry = `[${new Date(created).toISOString()}] ${text}`;
            stream.write(entry + "\n");
            lineCount++;

            // Print FORENSIC lines and auth traces to console
            if (
              text.includes("[FORENSIC:") ||
              text.includes("[AUTH TRACE]") ||
              text.includes("SELF-HEALING") ||
              text.includes("DB MISS") ||
              text.includes("SKIPPING DB") ||
              text.includes("⚠️") ||
              text.includes("REDIRECT:") ||
              text.includes("ALLOW:") ||
              text.includes("DENY:")
            ) {
              console.log(entry);
            }
          } catch (_) {}
        }
        if (latestTs > since) since = latestTs + 1;
      });
    }).on("error", e => console.error("Poll error:", e.message));
  };

  const interval = setInterval(poll, 2000);
  poll();

  process.on("SIGINT", () => {
    clearInterval(interval);
    stream.end();
    console.log(`\n\n Capture complete. ${lineCount} lines written to:\n ${logFile}\n`);
    process.exit(0);
  });
}

getNewestReadyDeployment()
  .then(streamLogs)
  .catch(e => { console.error("ERROR:", e.message); process.exit(1); });
