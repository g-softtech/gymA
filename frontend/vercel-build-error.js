/**
 * Gets build error logs for a specific Vercel deployment.
 * Usage: node vercel-build-error.js [deploymentId]
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const captureFile = path.join(__dirname, "vercel-log-capture.js");
const content = fs.readFileSync(captureFile, "utf8");
const m = content.match(/VERCEL_TOKEN\s*=\s*["']?([^"'\s;]+)["']?/);
const VERCEL_TOKEN = m ? m[1] : "";
const VERCEL_TEAM_ID = "team_bApvcVnmXpdK6jJeTh0mv8nv";

const DEP_ID = process.argv[2] || "dpl_EvCEFDgsCo33Ew5H8bj4vhukUGAq";

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

async function run() {
  console.log(`\nFetching build events for: ${DEP_ID}\n`);

  // Get deployment events (build logs)
  const result = await get(
    `/v2/deployments/${DEP_ID}/events?limit=100&teamId=${VERCEL_TEAM_ID}&builds=1`
  );

  let events = [];
  if (typeof result === "string") {
    // NDJSON format
    events = result.trim().split("\n").map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } else if (Array.isArray(result)) {
    events = result;
  } else if (result.events) {
    events = result.events;
  }

  // Print only error-relevant lines
  const errorLines = [];
  for (const ev of events) {
    const text = ev.payload?.text ?? ev.text ?? "";
    if (!text) continue;
    // Show all lines - filter for errors/warnings
    const lower = text.toLowerCase();
    if (
      lower.includes("error") ||
      lower.includes("failed") ||
      lower.includes("warning") ||
      lower.includes("cannot") ||
      lower.includes("module not found") ||
      lower.includes("type error") ||
      lower.includes("syntax") ||
      lower.includes("build failed")
    ) {
      errorLines.push(text);
    }
  }

  console.log(`=== BUILD ERROR LOG (${errorLines.length} relevant lines) ===\n`);
  errorLines.forEach(l => console.log(l));

  if (errorLines.length === 0) {
    console.log("(No error lines found in events — printing last 30 lines of all events)\n");
    events.slice(-30).forEach(ev => {
      const text = ev.payload?.text ?? ev.text ?? "";
      if (text) console.log(text);
    });
  }
}

run().catch(e => console.error(e));
