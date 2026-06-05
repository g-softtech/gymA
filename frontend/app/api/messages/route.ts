import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content, tenantId } = await req.json();

    if (!receiverId || !content || !tenantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        tenantId,
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
    });

    // Notify receiver
    await prisma.notification.create({
      data: {
        tenantId,
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

// GET /api/messages?tenantId=xxx&withUserId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get("tenantId");
    const withUserId = req.nextUrl.searchParams.get("withUserId");

    if (!tenantId || !withUserId) {
      return NextResponse.json({ error: "tenantId and withUserId required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        tenantId,
        OR: [
          { senderId: session.user.id, receiverId: withUserId },
          { senderId: withUserId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        tenantId,
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
