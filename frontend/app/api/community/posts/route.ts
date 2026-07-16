import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId from session — never from request body
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { content, imageUrl } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        tenantId: ctx.tenantId, // ✅ from session
        authorId: session.user.id,
        content: content.trim(),
        imageUrl: imageUrl ?? null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        likes: { select: { userId: true } },
        comments: { include: { author: { select: { id: true, name: true } } } },
      },
    });

    // ✅ Badge count is now tenant-scoped — only counts posts within this gym
    const postCount = await prisma.post.count({
      where: { authorId: session.user.id, tenantId: ctx.tenantId },
    });
    if (postCount >= 10) {
      await prisma.badge.upsert({
        where: { userId_type: { userId: session.user.id, type: "COMMUNITY_STAR" } },
        update: {},
        create: { userId: session.user.id, type: "COMMUNITY_STAR" },
      });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ tenantId from session
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const posts = await prisma.post.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        likes: { select: { userId: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(posts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const postId = req.nextUrl.searchParams.get("postId");
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // ✅ Ensure the post belongs to the caller's tenant before allowing delete
    if (post.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
    if (post.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleteResult = await prisma.post.deleteMany({ where: { id: postId, tenantId: ctx.tenantId } });
    if (deleteResult.count === 0) return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
