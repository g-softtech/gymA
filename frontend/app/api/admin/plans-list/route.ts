
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_PROMOTE_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const plans = await prisma.membershipPlan.findMany({
    select: { id: true, name: true, price: true, tenantId: true },
  });
  return NextResponse.json(plans);
}
