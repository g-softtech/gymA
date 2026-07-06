import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getAuthSession();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug }
  });
  if (!tenant) {
    return new NextResponse("Not found", { status: 404 });
  }

  const latestRollups = await prisma.intelligenceOpsMetrics.findMany({
    where: { tenantId: tenant.id },
    orderBy: { timestamp: 'desc' },
    take: 10, // We could just take the most recent per algorithm/policy
  });
  
  if (latestRollups.length === 0) {
    return NextResponse.json({
      retainedMRR: 0,
      successfulInterventions: 0,
      membersSaved: 0,
      averageConfidence: 0,
      successRate: 0
    });
  }

  // To prevent counting the same policy multiple times across timestamps, 
  // we just need the LATEST row for each policy.
  type PolicyKey = `${number}_${string}`;
  const latestPerPolicy = new Map<PolicyKey, typeof latestRollups[0]>();

  // Fetch all recent rows for tenant and group to find max timestamp per policy
  const allTenantMetrics = await prisma.intelligenceOpsMetrics.findMany({
    where: { tenantId: tenant.id }
  });

  for (const m of allTenantMetrics) {
    const key: PolicyKey = `${m.algorithmVersion}_${m.explorationPolicy}`;
    if (!latestPerPolicy.has(key) || m.timestamp > latestPerPolicy.get(key)!.timestamp) {
      latestPerPolicy.set(key, m);
    }
  }

  let retainedMRR = 0;
  let successfulInterventions = 0;
  let totalExecuted = 0;
  let totalGenerated = 0;
  let sumConfidence = 0;
  let partialSuccessCount = 0;

  for (const m of latestPerPolicy.values()) {
    retainedMRR += m.retainedMRR;
    successfulInterventions += m.successfulCount;
    partialSuccessCount += m.partialSuccessCount;
    totalExecuted += m.executedCount;
    totalGenerated += m.generatedCount;
    sumConfidence += (m.averageConfidence * m.generatedCount);
  }

  const averageConfidence = totalGenerated > 0 ? sumConfidence / totalGenerated : 0;
  const successRate = totalExecuted > 0 ? successfulInterventions / totalExecuted : 0;
  const membersSaved = successfulInterventions + partialSuccessCount;

  return NextResponse.json({
    retainedMRR,
    successfulInterventions,
    membersSaved,
    averageConfidence,
    successRate
  });
}
