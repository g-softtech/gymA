import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
  }

  try {
    // 1. User Record
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        password: true, // we will just check if it exists
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasPassword = !!user.password;
    delete (user as any).password;

    // 2. Memberships (Subscriptions)
    const subscriptions = await prisma.subscription.findMany({
      where: { member: { userId: user.id } },
      include: { plan: true },
    });

    // 3. Tenant Ownership Records (Check if they are an ADMIN of their current tenantId)
    const currentTenant = user.tenantId
      ? await prisma.tenant.findUnique({ where: { id: user.tenantId } })
      : null;

    // 4. Gym Ownership Records (Check if there is ANY tenant whose name loosely matches the user's name or email)
    // This looks for orphaned tenants that might belong to this user
    const possibleOrphanedTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { slug: { contains: email.split("@")[0].toLowerCase() } },
        ],
      },
      take: 5,
    });

    // 5. Check Super Admins
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN" },
      select: { id: true, email: true, role: true, tenantId: true },
    });

    // 6. Linked Accounts (Google vs Credentials)
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: { provider: true, type: true },
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user: {
        ...user,
        hasPassword,
        linkedProviders: accounts.map((a) => a.provider),
      },
      currentTenant,
      subscriptionsCount: subscriptions.length,
      subscriptions,
      possibleOrphanedTenants,
      systemSuperAdmins: superAdmins,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
