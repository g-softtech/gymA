import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { verifyWriteAccess } from "@/lib/sandbox/guard";
import {
  getTenantContextFromSession,
  requireTrainer,
  noTenantContext,
} from "@/lib/tenant";

// POST /api/trainer/messages — trainer sends a message
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireTrainer(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { receiverId, content } = await req.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // ✅ Verify receiver belongs to the same tenant
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { tenantId: true },
    });

    if (!receiver || receiver.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: "Cannot message users from other gyms" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        tenantId: ctx.tenantId, // ✅ from session
        senderId: session!.user.id,
        receiverId,
        content: content.trim(),
      },
    });

    await prisma.notification.create({
      data: {
        tenantId: ctx.tenantId,
        userId: receiverId,
        type: "MESSAGE",
        title: "New Message",
        message: `You have a new message from ${session!.user.name ?? session!.user.email}`,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/trainer/messages?withUserId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireTrainer(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const withUserId = req.nextUrl.searchParams.get("withUserId");
    if (!withUserId) {
      return NextResponse.json({ error: "withUserId required" }, { status: 400 });
    }

    // ✅ Verify other user is in same tenant
    const otherUser = await prisma.user.findUnique({
      where: { id: withUserId },
      select: { tenantId: true },
    });

    if (!otherUser || otherUser.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "User not found in your gym" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: {
        tenantId: ctx.tenantId,
        OR: [
          { senderId: ctx.userId, receiverId: withUserId },
          { senderId: withUserId, receiverId: ctx.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    await prisma.message.updateMany({
      where: {
        tenantId: ctx.tenantId,
        senderId: withUserId,
        receiverId: ctx.userId,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
