import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { verifyWriteAccess } from "@/lib/sandbox/guard";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * GET /api/blog/[postId]
 *
 * - Public (?slug=<tenantSlug>): returns a single published post by DB id or post slug
 * - Authenticated admin: returns the post regardless of published status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const tenantSlug = req.nextUrl.searchParams.get("slug");

    if (tenantSlug) {
      // Public mode: look up by post slug within the tenant
      const post = await prisma.blogPost.findFirst({
        where: {
          slug: postId, // postId param is actually the post slug in public mode
          published: true,
          tenant: { slug: tenantSlug, isActive: true },
        },
      });

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      return NextResponse.json(post);
    }

    // Authenticated mode
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post || post.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error("[GET /api/blog/[postId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/blog/[postId]
 * Update a blog post (title, content, published state, etc.). ADMIN only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { postId } = await params;

    const existing = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!existing || existing.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { title, excerpt, content, coverImage, tags, published } = await req.json();

    // If publishing for the first time, set publishedAt
    const publishedAt =
      published === true && !existing.published
        ? new Date()
        : published === false
        ? null
        : existing.publishedAt;

    const updateResult = await prisma.blogPost.updateMany({ where: { id: postId, tenantId: ctx.tenantId }, data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(excerpt !== undefined && { excerpt: excerpt?.trim() ?? null }),
        ...(content !== undefined && { content: content.trim() }),
        ...(coverImage !== undefined && { coverImage: coverImage?.trim() ?? null }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
        ...(published !== undefined && { published, publishedAt }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/blog/[postId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/blog/[postId]
 * Permanently delete a blog post. ADMIN only.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { postId } = await params;

    const existing = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!existing || existing.tenantId !== ctx.tenantId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const deleteResult = await prisma.blogPost.deleteMany({ where: { id: postId, tenantId: ctx.tenantId } });
    if (deleteResult.count === 0) return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/blog/[postId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
