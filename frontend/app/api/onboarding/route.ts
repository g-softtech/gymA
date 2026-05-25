import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as {
      user?: {
        email?: string;
      };
    };

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name } = await req.json();

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      },
    });

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({
      success: true,
      tenant,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}