import { GovernanceEngine } from "../../lib/intelligence/governanceEngine";
import { IntelligencePipeline } from "../../lib/intelligence/intelligencePipeline";
import { prisma } from "../../lib/prisma";

async function verifyGovernance() {
  console.log("--- 1. Testing Kill Switch ---");
  // Insert a mock safety event
  await prisma.intelligenceSafetyEvent.create({
    data: {
      action: "DISABLE",
      reason: "Emergency threshold reached",
      triggeredBy: "user_admin"
    }
  });

  const killSwitch = await GovernanceEngine.evaluateKillSwitch();
  console.log("Kill Switch Active:", killSwitch.active);
  console.log("Reason:", killSwitch.reason);

  const pipelineResult = await IntelligencePipeline.executeDecision(
    "tenant_1",
    "user_1",
    { trafficSplit: [{ variant: "CONTROL", weight: 1.0 }] } as any,
    {}
  );
  
  console.log("Pipeline Intercepted:", !pipelineResult.executed);
  console.log("Fallback Decision:", pipelineResult.decision?.actionType);

  // Clean up
  await prisma.intelligenceSafetyEvent.deleteMany();

  console.log("\n--- 2. Testing Promotion Idempotency ---");
  const expId = "test_exp_" + Date.now();
  
  // First promotion should succeed
  const v1 = await GovernanceEngine.promoteVariantToProduction(expId, "BAYESIAN", "admin_1", "Outperformed control by 15%");
  console.log("First Promotion Success:", v1.status === "ACTIVE");

  // Second promotion of SAME experiment should fail
  try {
    await GovernanceEngine.promoteVariantToProduction(expId, "BAYESIAN", "admin_1", "Duplicate attempt");
    console.log("Second Promotion: FAIL (Allowed duplicate)");
  } catch (error: any) {
    console.log("Second Promotion: PASS (Blocked duplicate) ->", error.message);
  }

  // Clean up
  await prisma.intelligenceVersionRegistry.deleteMany();
  await prisma.intelligencePromotionLog.deleteMany();
}

verifyGovernance()
  .then(() => console.log("Governance verification complete."))
  .catch(console.error);
