import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/gym/[slug]
 *
 * Public endpoint — no authentication required.
 * Returns the full data payload needed to render a tenant's public marketing page:
 *   - Tenant basics (name, slug, plan)
 *   - TenantSettings (all CMS blobs, branding, SEO, social, contact)
 *   - MembershipPlans (all, sorted by price)
 *   - TrainerProfiles (only those with showOnWebsite=true)
 *   - BlogPosts (published only, latest 6)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true,
        settings: true,
        membershipPlans: {
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            durationDays: true,
            featured: true,
            description: true,
            features: true,
          },
        },
        blogPosts: {
          where: { published: true },
          orderBy: { publishedAt: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            tags: true,
            publishedAt: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    if (!tenant.isActive) {
      return NextResponse.json({ error: "This gym is currently inactive" }, { status: 403 });
    }

    // Fetch trainers visible on the public site
    const trainers = await prisma.trainerProfile.findMany({
      where: {
        showOnWebsite: true,
        user: { tenantId: tenant.id },
      },
      select: {
        id: true,
        specialties: true,
        bio: true,
        hourlyRate: true,
        publicPhotoUrl: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
        },
        settings: tenant.settings ?? null,
        plans: tenant.membershipPlans,
        trainers,
        blogPosts: tenant.blogPosts,
      },
      {
        headers: {
          // Cache public page data at the edge for 60 s, stale-while-revalidate 5 min
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/gym/[slug]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
