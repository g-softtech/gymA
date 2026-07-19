import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// DELETE /api/admin/classes/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: "Class ID required" }, { status: 400 });
    }

    // Ensure the class belongs to this tenant
    const classSession = await prisma.classSession.findUnique({
      where: { id: classId },
    });

    if (!classSession || classSession.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Cascade delete handles removing associated bookings because of onDelete: Cascade in schema
    await prisma.classSession.delete({
      where: { id: classId },
    });

    return NextResponse.json({ message: "Class session deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/classes/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
