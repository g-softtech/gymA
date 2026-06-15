import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Search query too short" }, { status: 400 });
    }

    // Search by name or email
    const members = await prisma.memberProfile.findMany({
      where: {
        user: {
          tenantId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } }
          ]
        }
      },
      include: {
        user: { select: { name: true, email: true, image: true } },
        subscriptions: {
          where: { status: "ACTIVE", endDate: { gt: new Date() } },
          take: 1
        }
      },
      take: 10
    });

    const results = members.map(m => ({
      ...m,
      hasActiveMembership: m.subscriptions.length > 0
    }));

    return NextResponse.json({ members: results });

  } catch (error) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
