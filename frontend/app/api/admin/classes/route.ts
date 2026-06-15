import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// GET /api/admin/classes
export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    const whereClause: any = { tenantId: session.user.tenantId };

    if (startStr && endStr) {
      whereClause.startTime = {
        gte: new Date(startStr),
        lte: new Date(endStr),
      };
    }

    const classes = await prisma.classSession.findMany({
      where: whereClause,
      include: {
        instructor: {
          include: { user: { select: { name: true, image: true } } },
        },
        _count: { select: { bookings: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("GET /api/admin/classes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/classes
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, instructorId, startTime, durationMins, capacity, recurrenceWeeks } = body;

    if (!title || !startTime || !capacity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tenantId = session.user.tenantId;

    if (instructorId) {
      const instructor = await prisma.trainerProfile.findFirst({
        where: { id: instructorId, user: { tenantId } }
      });
      if (!instructor) {
        return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
      }
    }

    const baseStartTime = new Date(startTime);
    const weeks = recurrenceWeeks ? parseInt(recurrenceWeeks, 10) : 1;
    
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      return NextResponse.json({ error: "Invalid recurrence" }, { status: 400 });
    }

    const sessionsToCreate = [];
    
    // Generate class sessions for N weeks
    for (let i = 0; i < weeks; i++) {
      const sessionStart = new Date(baseStartTime);
      sessionStart.setDate(sessionStart.getDate() + i * 7); // add 7 days per week

      sessionsToCreate.push({
        tenantId,
        title,
        description,
        instructorId: instructorId || null,
        startTime: sessionStart,
        durationMins: parseInt(durationMins, 10) || 60,
        capacity: parseInt(capacity, 10),
      });
    }

    const result = await prisma.classSession.createMany({
      data: sessionsToCreate,
    });

    return NextResponse.json({ message: "Classes created successfully", count: result.count });
  } catch (error) {
    console.error("POST /api/admin/classes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
