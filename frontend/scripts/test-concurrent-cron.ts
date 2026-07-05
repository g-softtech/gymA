import { runBillingReconciliationJob } from "../lib/billing/billingReconciliationJob";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runConcurrent() {
  console.log("Starting concurrent cron jobs...");
  
  await Promise.all([
    runBillingReconciliationJob(),
    runBillingReconciliationJob(),
    runBillingReconciliationJob(),
  ]);

  console.log("Concurrent execution complete.");
}

runConcurrent().catch(console.error);
