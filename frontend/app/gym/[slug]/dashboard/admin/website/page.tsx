import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WebsiteHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect(`/gym/${slug}/dashboard/admin`);
  }

  const settings = await prisma.tenantSettings.findFirst({
    where: { tenant: { slug } },
    select: {
      logoUrl: true,
      primaryColor: true,
      tagline: true,
      instagramUrl: true,
      heroData: true,
      servicesData: true,
    },
  });

  const sections = [
    {
      href: `/gym/${slug}/dashboard/admin/website/branding`,
      icon: "🎨",
      title: "Branding",
      desc: "Logo, colors, fonts, and dark mode",
      badge: settings?.primaryColor ? "Configured" : "Not set",
      badgeColor: settings?.primaryColor ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
      id: "website-branding-link",
    },
    {
      href: `/gym/${slug}/dashboard/admin/website/info`,
      icon: "🏢",
      title: "Business Info",
      desc: "Gym name, contact details, address, and opening hours",
      badge: settings?.tagline ? "Configured" : "Not set",
      badgeColor: settings?.tagline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
      id: "website-info-link",
    },
    {
      href: `/gym/${slug}/dashboard/admin/website/social`,
      icon: "📲",
      title: "Social Media",
      desc: "Instagram, Facebook, TikTok, WhatsApp, and more",
      badge: settings?.instagramUrl ? "Configured" : "Not set",
      badgeColor: settings?.instagramUrl ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
      id: "website-social-link",
    },
    {
      href: `/gym/${slug}/dashboard/admin/website/hero`,
      icon: "🖼️",
      title: "Hero Section",
      desc: "Headline, subheadline, CTA button, and background image",
      badge: settings?.heroData ? "Configured" : "Not set",
      badgeColor: settings?.heroData ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
      id: "website-hero-link",
    },
    {
      href: `/gym/${slug}/dashboard/admin/website/content`,
      icon: "📝",
      title: "Page Content",
      desc: "Stats, services, testimonials, gallery, and feature highlights",
      badge: settings?.servicesData ? "Has content" : "Empty",
      badgeColor: settings?.servicesData ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
      id: "website-content-link",
    },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Website & Branding</h1>
        <p className="text-gray-500 text-sm mt-1">
          Customize your gym&apos;s public profile and brand identity.
        </p>
      </div>

      {/* Public page quick link */}
      <div className="mb-6 flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <span className="text-2xl">🌐</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-900">Your public gym page</p>
          <p className="text-xs text-indigo-600 truncate">
            cortexfit.com/gym/{slug}
          </p>
        </div>
        <Link
          href={`/gym/${slug}`}
          target="_blank"
          id="view-public-page-btn"
          className="shrink-0 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View →
        </Link>
      </div>

      {/* Section cards */}
      <div className="grid gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            id={s.id}
            className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0 group-hover:bg-indigo-100 transition-colors">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.badgeColor}`}>
                {s.badge}
              </span>
              <span className="text-gray-300 group-hover:text-indigo-500 transition-colors text-lg">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
