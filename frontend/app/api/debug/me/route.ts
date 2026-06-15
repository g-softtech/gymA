import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "No active session or missing email" }, { status: 401 });
  }

  const email = session.user.email;

  // 1. Database values (The absolute source of truth)
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ 
      error: "Session exists but DB user missing", 
      sessionUser: session.user 
    }, { status: 404 });
  }

  // 2. Session values (What Next.js Router sees)
  const sessionUser = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    tenantId: session.user.tenantId ?? null,
  };

  const dbUserMapped = {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    tenantId: dbUser.tenantId ?? null,
  };

  // 3. Detect mismatches
  const mismatch = 
    sessionUser.id !== dbUserMapped.id ||
    sessionUser.email !== dbUserMapped.email ||
    sessionUser.role !== dbUserMapped.role ||
    sessionUser.tenantId !== dbUserMapped.tenantId;

  return NextResponse.json({
    mismatch,
    session: sessionUser,
    dbUser: dbUserMapped,
    timestamp: new Date().toISOString(),
  });
}
