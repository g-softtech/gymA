import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ actionLogId: string }> }
) {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { actionLogId } = await params;

  try {
    // 1. Fetch the immutable execution record (Phase 7.2)
    const actionLog = await prisma.intelligenceActionLog.findUnique({
      where: { id: actionLogId },
      include: {
        experimentOutcomes: true // Phase 9
      }
    });

    if (!actionLog) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 2. Resolve the experiment assignment at the time (Phase 9)
    // Note: The outcome links directly to the variant, but we can also fetch the strict assignment if it exists.
    let experimentAssignment = null;
    let variant = actionLog.experimentOutcomes[0]?.variant || "CONTROL";

    // 3. Resolve the active intelligence registry version at the time of execution (Phase 10)
    // We look up the latest version that was activated *before* this action log was created.
    const historicalVersion = await prisma.intelligenceVersionRegistry.findFirst({
      where: {
        activatedAt: { lte: actionLog.executedAt }
      },
      orderBy: { activatedAt: "desc" }
    });

    // 4. Construct the Append-Only Immutable Causality Chain
    // Input → Score → Experiment → Policy → Action → Outcome
    const auditTrace = {
      traceId: actionLog.id,
      executedAt: actionLog.executedAt,
      causality: {
        // Step A: What was the system context?
        governance: {
          scoringVersion: historicalVersion?.scoringVersion || 1,
          policyVersion: historicalVersion?.policyVersion || 1,
          registryId: historicalVersion?.id || null,
        },
        // Step B: What was the input and the resulting score? (Single Scoring Contract)
        scoring: {
          snapshot: actionLog.scoringSnapshot,
        },
        // Step C: Was this an experiment?
        experimentation: {
          experimentId: actionLog.experimentOutcomes[0]?.experimentId || null,
          variant: variant,
        },
        // Step D: What policy was applied?
        policy: {
          explorationPolicy: actionLog.explorationPolicy,
          explorationVersion: actionLog.explorationVersion
        },
        // Step E: What action did the system take?
        action: {
          actionType: actionLog.actionType,
          targetMemberId: actionLog.targetMemberId
        },
        // Step F: What was the business outcome?
        outcome: {
          success: actionLog.experimentOutcomes[0]?.success || false,
          mrrImpact: actionLog.experimentOutcomes[0]?.mrrImpact || 0,
        }
      }
    };

    return NextResponse.json({ data: auditTrace });
  } catch (error) {
    console.error("[AUDIT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
