import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PerformanceMetrics } from "@/lib/intelligence/types";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Get the most recent rollup per tenant
  const latestRollups = await prisma.intelligenceOpsMetrics.groupBy({
    by: ['tenantId'],
    _max: {
      timestamp: true,
    }
  });

  const latestTimestamps = latestRollups.map(r => r._max.timestamp).filter(Boolean) as Date[];

  const latestMetrics = await prisma.intelligenceOpsMetrics.findMany({
    where: {
      timestamp: {
        in: latestTimestamps
      }
    }
  });

  let retainedMRR = 0;
  let successCount = 0;
  let generatedCount = 0;
  let totalConfidenceSum = 0;

  type PolicyKey = `${number}_${string}`;
  const policyMap = new Map<PolicyKey, { successes: number, total: number }>();

  for (const m of latestMetrics) {
    retainedMRR += m.retainedMRR;
    successCount += m.successfulCount;
    generatedCount += m.generatedCount;
    totalConfidenceSum += m.averageConfidence * m.generatedCount;

    const pKey: PolicyKey = `${m.algorithmVersion}_${m.explorationPolicy}`;
    if (!policyMap.has(pKey)) policyMap.set(pKey, { successes: 0, total: 0 });
    const pData = policyMap.get(pKey)!;
    pData.successes += m.successfulCount;
    pData.total += m.executedCount; // Assuming conversion is from executed
  }

  const averageConfidence = generatedCount > 0 ? totalConfidenceSum / generatedCount : 0;

  const policyComparisons = Array.from(policyMap.entries()).map(([key, data]) => {
    const [algoStr, policy] = key.split("_");
    return {
      algorithmVersion: parseInt(algoStr, 10),
      explorationPolicy: policy,
      successRate: data.total > 0 ? data.successes / data.total : 0,
      sampleSize: data.total
    };
  });

  const data: PerformanceMetrics = {
    retainedMRR,
    successCount,
    averageConfidence,
    generatedCount,
    policyComparisons
  };

  return NextResponse.json(data);
}
