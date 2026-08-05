import "dotenv/config";
import { resetDemoEnvironmentService } from "../lib/demo/seed";

async function main() {
  console.log("🚀 Running manual CLI Demo Reset...");
  await resetDemoEnvironmentService();
  console.log("✅ Manual CLI Demo Reset complete.");
}

main()
  .catch((e) => {
    console.error("❌ Demo Seeding failed:", e);
    process.exit(1);
  });
