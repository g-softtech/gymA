import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  getTenantContextFromSession,
  requireAdmin,
  noTenantContext,
} from "@/lib/tenant";

/**
 * GET /api/blog
 *
 * - Authenticated (admin): returns all posts for tenant (drafts + published)
 * - Public (?slug=<tenantSlug>): returns only published posts
 */
export async function GET(req: NextRequest) {
  try {
    const slugParam = req.nextUrl.searchParams.get("slug");

    // ── Public mode ─────────────────────────────────────────────────────────
    if (slugParam) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: slugParam },
        select: { id: true, isActive: true },
      });

      if (!tenant || !tenant.isActive) {
        return NextResponse.json({ error: "Gym not found" }, { status: 404 });
      }

      const posts = await prisma.blogPost.findMany({
        where: { tenantId: tenant.id, published: true },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          tags: true,
          publishedAt: true,
        },
      });

      return NextResponse.json(posts);
    }

    // ── Authenticated mode (admin CMS) ───────────────────────────────────────
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const posts = await prisma.blogPost.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        tags: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(posts);
  } catch (err) {
    console.error("[GET /api/blog]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/blog
 * Create a new blog post. ADMIN only.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { title, slug, excerpt, content, coverImage, tags, published } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    // Derive slug from title if not provided
    const derivedSlug =
      (slug?.trim() ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")) +
      `-${Date.now().toString(36)}`; // suffix prevents collisions

    const post = await prisma.blogPost.create({
      data: {
        tenantId: ctx.tenantId,
        authorId: ctx.userId,
        title: title.trim(),
        slug: derivedSlug,
        excerpt: excerpt?.trim() ?? null,
        content: content.trim(),
        coverImage: coverImage?.trim() ?? null,
        tags: Array.isArray(tags) ? tags : [],
        published: published === true,
        publishedAt: published === true ? new Date() : null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("[POST /api/blog]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
