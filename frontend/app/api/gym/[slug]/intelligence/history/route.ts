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

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const outcomeStatus = searchParams.get("outcomeStatus");

  const where: any = { tenantId: tenant.id };
  if (outcomeStatus && outcomeStatus !== "ALL") {
    where.outcomeStatus = outcomeStatus;
  }

  const [logs, total] = await Promise.all([
    prisma.intelligenceActionLog.findMany({
      where,
      orderBy: { executedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        targetMember: true,
      }
    }),
    prisma.intelligenceActionLog.count({ where })
  ]);

  return NextResponse.json({
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
}
