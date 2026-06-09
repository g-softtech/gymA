import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { MembershipPlan } from "@prisma/client";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";

// ─── Dynamic metadata + favicon per tenant ───────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { settings: true },
  });

  if (!tenant) {
    return { title: "Gym Not Found" };
  }

  const settings = tenant.settings;
  const title = `${tenant.name} — SmartGym`;
  const description =
    settings?.tagline ??
    settings?.description?.slice(0, 155) ??
    `Join ${tenant.name} and start your fitness journey today.`;

  return {
    title,
    description,
    icons: {
      icon: settings?.faviconUrl ?? "/favicon.ico",
    },
    openGraph: {
      title,
      description,
      ...(settings?.logoUrl ? { images: [{ url: settings.logoUrl }] } : {}),
    },
  };
}

// ─── Public gym page ──────────────────────────────────────────────────────────
export default async function GymPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      membershipPlans: true,
      settings: true,
    },
  });

  if (!tenant) notFound();

  const settings = tenant.settings;
  const primary = settings?.primaryColor ?? "#6366F1";
  const secondary = settings?.secondaryColor ?? "#8B5CF6";

  return (
    <TenantThemeProvider settings={settings}>
      <div className="min-h-screen bg-gray-50">

        {/* Hero */}
        <div
          className="relative py-24 px-6 text-center text-white overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
        >
          {/* Logo */}
          {settings?.logoUrl && (
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logoUrl}
                alt={tenant.name}
                className="h-16 object-contain"
              />
            </div>
          )}

          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-sm">
            {tenant.name}
          </h1>

          <p className="text-xl max-w-xl mx-auto mb-8 opacity-90">
            {settings?.tagline ?? "Join our gym and transform your fitness journey."}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/gym/${slug}/dashboard/member`}
              id="hero-signin-btn"
              className="px-8 py-3 bg-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              style={{ color: primary }}
            >
              Member Sign In
            </Link>
            <Link
              href={`#plans`}
              id="hero-plans-btn"
              className="px-8 py-3 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              View Plans ↓
            </Link>
          </div>
        </div>

        {/* About snippet */}
        {settings?.description && (
          <div className="max-w-3xl mx-auto px-6 py-12 text-center">
            <p className="text-gray-600 text-lg leading-relaxed">{settings.description}</p>
          </div>
        )}

        {/* Membership Plans */}
        <div id="plans" className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Membership Plans
          </h2>

          {tenant.membershipPlans.length === 0 ? (
            <p className="text-center text-gray-500">No plans available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {tenant.membershipPlans.map((plan: MembershipPlan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col justify-between hover:shadow-xl transition-shadow"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-6">
                      {plan.durationDays} day{plan.durationDays > 1 ? "s" : ""} access
                    </p>
                    <p
                      className="text-4xl font-extrabold mb-1"
                      style={{ color: primary }}
                    >
                      &#8358;{plan.price.toLocaleString()}
                    </p>
                  </div>

                  <Link
                    href={`/gym/${slug}/checkout/${plan.id}`}
                    id={`plan-cta-${plan.id}`}
                    className="mt-8 block w-full text-white text-center font-semibold py-3 rounded-xl transition-all hover:opacity-90 hover:shadow-md"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact strip (if info is set) */}
        {(settings?.phone || settings?.email || settings?.city) && (
          <div className="border-t border-gray-100 bg-white py-8">
            <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-2 hover:text-gray-800 transition-colors">
                  📞 {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-gray-800 transition-colors">
                  ✉️ {settings.email}
                </a>
              )}
              {settings.city && (
                <span className="flex items-center gap-2">
                  📍 {settings.city}{settings.state ? `, ${settings.state}` : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="py-10 px-6" style={{ background: `${primary}10` }}>
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-gray-600 mb-2 font-medium">Already a member?</p>
              <Link
                href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`}
                id="footer-signin-btn"
                className="inline-block px-6 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                Member Sign In
              </Link>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-gray-400 text-sm mb-2">Gym staff?</p>
              <Link
                href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/trainer`}
                id="footer-staff-signin-btn"
                className="inline-block px-5 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
              >
                Admin / Trainer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TenantThemeProvider>
  );
}
