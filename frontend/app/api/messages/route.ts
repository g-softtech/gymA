import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId from session — never from request body
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { receiverId, content } = await req.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // ✅ Cross-tenant message prevention — receiver must belong to same tenant
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { tenantId: true, name: true, email: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    if (receiver.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: "Cannot message users from other gyms" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        tenantId: ctx.tenantId, // ✅ from session
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
    });

    // Notify receiver
    await prisma.notification.create({
      data: {
        tenantId: ctx.tenantId,
        userId: receiverId,
        type: "MESSAGE",
        title: "New Message",
        message: `You have a new message from ${session.user.name ?? session.user.email}`,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/messages?withUserId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId from session — query param ignored
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const withUserId = req.nextUrl.searchParams.get("withUserId");
    if (!withUserId) {
      return NextResponse.json({ error: "withUserId required" }, { status: 400 });
    }

    // ✅ Verify the other user is in the same tenant
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
          { senderId: session.user.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: {
        tenantId: ctx.tenantId,
        senderId: withUserId,
        receiverId: session.user.id,
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
