/**
 * Gets all recent Vercel deployments to find the active production one.
 */
const https = require("https");
const path = require("path");
const fs = require("fs");

const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf8");
let VERCEL_TOKEN = "";
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (t.startsWith("VERCEL_TOKEN=")) { VERCEL_TOKEN = t.slice("VERCEL_TOKEN=".length).replace(/^["']|["']$/g, ""); break; }
}

// Try from vercel-log-capture.js directly
if (!VERCEL_TOKEN) {
  const captureFile = path.join(__dirname, "vercel-log-capture.js");
  if (fs.existsSync(captureFile)) {
    const content = fs.readFileSync(captureFile, "utf8");
    const m = content.match(/VERCEL_TOKEN\s*=\s*["']?([^"'\s;]+)["']?/);
    if (m) VERCEL_TOKEN = m[1];
  }
}

const VERCEL_PROJECT_ID = "prj_i7yH0EdgE5W2M2RaWl4XFmEqMfW2";
const VERCEL_TEAM_ID = "team_bApvcVnmXpdK6jJeTh0mv8nv";

function get(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: "api.vercel.com",
      path,
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

async function run() {
  const result = await get(
    `/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&limit=5`
  );

  console.log("\n RECENT VERCEL DEPLOYMENTS:\n");
  for (const dep of result.deployments || []) {
    const isProduction = dep.target === "production";
    console.log(`  ${isProduction ? "★ PROD" : "      "} ${dep.uid}`);
    console.log(`         state   = ${dep.state}`);
    console.log(`         target  = ${dep.target ?? "preview"}`);
    console.log(`         url     = https://${dep.url}`);
    console.log(`         created = ${new Date(dep.createdAt).toISOString()}`);
    console.log(`         branch  = ${dep.meta?.githubCommitRef ?? "?"}`);
    console.log(`         commit  = ${dep.meta?.githubCommitMessage?.slice(0, 60) ?? "?"}`);
    console.log();
  }
}

run().catch(e => console.error(e));
