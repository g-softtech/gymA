import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { ActionRegistry } from "@/lib/actions/actionRegistry";
import { ActionExecutor } from "@/lib/actions/actionExecutor";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.tenantId || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { actionId, status } = body;

    if (!actionId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (status === "APPROVED") {
      await ActionRegistry.approveAction(actionId);
      // Immediately try to process the executor queue
      // In production this might be deferred to a separate worker
      setTimeout(() => {
        ActionExecutor.processApprovedActions().catch(e => console.error("Executor err:", e));
      }, 0);
    } else {
      await ActionRegistry.rejectAction(actionId);
    }

    return NextResponse.json({ success: true, message: `Action marked as ${status}` });

  } catch (error) {
    console.error("Action Approval Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
