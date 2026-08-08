import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, requireSuperAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const posts = await prisma.marketingBlog.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (err) {
    console.error("[MarketingBlog GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const body = await req.json();
    const { title, slug, excerpt, content, category, readTime, coverImage, metaTitle, metaDescription, published } = body;

    if (!title || !slug || !content || !metaTitle || !metaDescription || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.marketingBlog.findUnique({ where: { slug: normalizedSlug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const post = await prisma.marketingBlog.create({
      data: {
        title,
        slug: normalizedSlug,
        excerpt: excerpt || "",
        content,
        category,
        readTime: readTime ? parseInt(readTime, 10) : null,
        coverImage,
        metaTitle,
        metaDescription,
        published: !!published,
        publishedAt: published ? new Date() : null,
      },
    });

    if (post.published) {
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
      revalidatePath("/sitemap-blog.xml");
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err: any) {
    console.error("[MarketingBlog POST]", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const body = await req.json();
    const { id, title, slug, excerpt, content, category, readTime, coverImage, metaTitle, metaDescription, published } = body;

    if (!id || !title || !slug || !content || !metaTitle || !metaDescription || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    // Fetch existing post to handle publishedAt logic
    const existing = await prisma.marketingBlog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let publishedAt = existing.publishedAt;
    if (published && !existing.published) {
      publishedAt = new Date(); // newly published
    } else if (!published) {
      publishedAt = null; // unpublished
    }

    const post = await prisma.marketingBlog.update({
      where: { id },
      data: {
        title,
        slug: normalizedSlug,
        excerpt: excerpt || "",
        content,
        category,
        readTime: readTime ? parseInt(readTime, 10) : null,
        coverImage,
        metaTitle,
        metaDescription,
        published: !!published,
        publishedAt,
      },
    });

    // Invalidate caches if it was published, is now published, or slug changed
    if (existing.published || post.published) {
      revalidatePath("/blog");
      revalidatePath("/sitemap-blog.xml");
      revalidatePath(`/blog/${existing.slug}`);
      if (existing.slug !== post.slug) {
        revalidatePath(`/blog/${post.slug}`);
      }
    }

    return NextResponse.json(post);
  } catch (err: any) {
    console.error("[MarketingBlog PUT]", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);

    const roleErr = requireSuperAdmin(ctx);
    if (roleErr) return roleErr;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const post = await prisma.marketingBlog.findUnique({ where: { id } });
    
    await prisma.marketingBlog.delete({ where: { id } });

    if (post && post.published) {
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
      revalidatePath("/sitemap-blog.xml");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[MarketingBlog DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
