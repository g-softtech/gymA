import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, noTenantContext } from "@/lib/tenant";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Phase 4: tenantId from session
    const ctx = getTenantContextFromSession(session);
    if (!ctx?.tenantId) return noTenantContext();

    const { postId } = await params;

    // ✅ Verify the post belongs to the caller's tenant — prevents cross-tenant liking
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { tenantId: true },
    });

    if (!post || post.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: session.user.id } },
    });

    if (existing) {
      // Unlike
      await prisma.postLike.delete({
        where: { postId_userId: { postId, userId: session.user.id } },
      });
      const count = await prisma.postLike.count({ where: { postId } });
      return NextResponse.json({ liked: false, count });
    } else {
      // Like
      await prisma.postLike.create({
        data: { postId, userId: session.user.id },
      });
      const count = await prisma.postLike.count({ where: { postId } });
      return NextResponse.json({ liked: true, count });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
