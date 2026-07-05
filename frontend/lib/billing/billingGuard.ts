import { recordMetric } from "@/lib/billing/revenueMetrics";
import { subscriptionEventBus } from "@/lib/events/subscriptionEventBus";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BLOCKED = ["PAST_DUE", "SUSPENDED", "EXPIRED"];

const SAFE_ROUTES = [
  "/auth",
  "/billing",
  "/api/webhooks",
  "/api/checkout",
  "/billing/blocked",
];

function isSafeRoute(path: string) {
  return SAFE_ROUTES.some((r) => path.startsWith(r));
}

export async function billingGuard(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ALWAYS allow safe routes
  if (isSafeRoute(pathname)) {
    return null;
  }

  const tenantId = request.headers.get("x-tenant-id");

  // ⚠️ FAIL CLOSED (important hardening)
  if (!tenantId) {
    return NextResponse.redirect(new URL("/billing/blocked", request.url));
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  // ⚠️ FAIL CLOSED
  if (!tenant) {
    return NextResponse.redirect(new URL("/billing/blocked", request.url));
  }

  // UNKNOWN STATE = BLOCK ACCESS (prevents silent drift)
  if (!tenant.billingStatus) {
    return NextResponse.redirect(new URL("/billing/blocked", request.url));
  }

  if (BLOCKED.includes(tenant.billingStatus)) {
    recordMetric("blockedAccess");

    subscriptionEventBus.emit("REVENUE_BLOCKED_ACCESS", {
      tenantId,
      timestamp: Date.now(),
    });

    return NextResponse.redirect(new URL("/billing/blocked", request.url));
  }

  return null;
}
