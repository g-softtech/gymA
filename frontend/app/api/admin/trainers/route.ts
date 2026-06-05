import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email, specialties, bio, hourlyRate, tenantId } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "No user found with that email. They must sign in first." }, { status: 404 });
    if (user.tenantId !== session.user.tenantId) return NextResponse.json({ error: "User does not belong to your gym." }, { status: 403 });
    await prisma.user.update({ where: { id: user.id }, data: { role: "TRAINER" } });
    const profile = await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: { specialties: specialties ?? [], bio: bio ?? "", hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null },
      create: { userId: user.id, specialties: specialties ?? [], availability: {}, bio: bio ?? "", hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null },
    });
    if (tenantId) {
      await prisma.notification.create({
        data: { tenantId, userId: user.id, type: "GENERAL", title: "You are now a Trainer!", message: "Your account has been upgraded to Trainer. You can now manage clients and bookings." },
      });
    }
    return NextResponse.json({ success: true, profile }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = req.nextUrl.searchParams.get("tenantId");
    if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
    const trainers = await prisma.user.findMany({
      where: { tenantId, role: "TRAINER" },
      include: { trainerProfile: { include: { bookings: true } } },
    });
    return NextResponse.json(trainers);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
