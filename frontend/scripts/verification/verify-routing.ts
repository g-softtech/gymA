import { assignVariant, TrafficSplit } from "../../lib/intelligence/experimentRouter";
import { ExperimentVariant } from "@prisma/client";

async function verifyRouting() {
  const trafficSplit: TrafficSplit = [
    { variant: ExperimentVariant.CONTROL, weight: 0.70 },
    { variant: ExperimentVariant.BAYESIAN, weight: 0.15 },
    { variant: ExperimentVariant.UCB, weight: 0.10 },
    { variant: ExperimentVariant.THOMPSON, weight: 0.05 }
  ];

  const counts = {
    [ExperimentVariant.CONTROL]: 0,
    [ExperimentVariant.BAYESIAN]: 0,
    [ExperimentVariant.UCB]: 0,
    [ExperimentVariant.THOMPSON]: 0,
  };

  const experimentId = "exp_churn_001";
  const numUsers = 10000;

  for (let i = 0; i < numUsers; i++) {
    const userId = `user_${i}_${Math.random()}`;
    const variant = assignVariant(userId, experimentId, trafficSplit);
    counts[variant as keyof typeof counts]++;
  }

  console.log("Traffic Split Verification:");
  console.log(`Expected Control: 70%, Actual: ${(counts[ExperimentVariant.CONTROL] / numUsers) * 100}%`);
  console.log(`Expected Bayesian: 15%, Actual: ${(counts[ExperimentVariant.BAYESIAN] / numUsers) * 100}%`);
  console.log(`Expected UCB: 10%, Actual: ${(counts[ExperimentVariant.UCB] / numUsers) * 100}%`);
  console.log(`Expected Thompson: 5%, Actual: ${(counts[ExperimentVariant.THOMPSON] / numUsers) * 100}%`);

  // Verify determinism
  const stableUserId = "test_user_deterministic";
  const v1 = assignVariant(stableUserId, experimentId, trafficSplit);
  const v2 = assignVariant(stableUserId, experimentId, trafficSplit);
  console.log(`Determinism check: ${v1 === v2 ? 'PASS' : 'FAIL'} (${v1})`);
}

verifyRouting();
