import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import ContactForm from "@/components/ContactForm";
import { getEntitlementFeatures } from "@/lib/entitlements/registry";

// ─────────────────────────────────────────────────────────────────────────────
// Types mirroring TenantSettings JSON blobs
// ─────────────────────────────────────────────────────────────────────────────
interface HeroData {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  bgImageUrl?: string;
  overlayOpacity?: number;
}
interface Stat { value: string; label: string }
interface Service { icon?: string; title: string; description: string; imageUrl?: string; scheduleInfo?: string; }
interface GalleryItem { imageUrl: string; caption?: string; category?: string }
interface Testimonial { name: string; role?: string; quote: string; avatarUrl?: string; rating?: number }
interface FeatureItem { icon?: string; title: string; description: string }
interface OpeningHoursDay { open: string; close: string; closed?: boolean }
type OpeningHours = Record<string, OpeningHoursDay>

const DEFAULT_LAYOUT = [
  "hero", "stats", "about", "features", "activities", "trainers", 
  "plans", "testimonials", "gallery", "blog", "contact"
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic SEO metadata
// ─────────────────────────────────────────────────────────────────────────────
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

  if (!tenant) return { title: "Gym Not Found" };

  const s = tenant.settings;
  const hero = s?.heroData as HeroData | null;
  const brandName = s?.brandName || tenant.name;
  const title = s?.metaTitle ?? (s?.whiteLabelEnabled ? brandName : `${brandName} — CortexFit`);
  const description =
    s?.metaDescription ??
    s?.tagline ??
    hero?.subheadline ??
    `Join ${tenant.name} and start your fitness journey today.`;

  return {
    title,
    description,
    icons: { icon: s?.faviconUrl ?? "/favicon.ico" },
    openGraph: {
      title,
      description,
      images: s?.ogImageUrl ? [{ url: s.ogImageUrl }] : s?.logoUrl ? [{ url: s.logoUrl }] : [],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public gym landing page
// ─────────────────────────────────────────────────────────────────────────────
export default async function GymPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      settings: true,
      membershipPlans: { orderBy: { price: "asc" } },
      blogPosts: {
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take: 3,
      },
    },
  });

  if (!tenant) notFound();

  const trainers = await prisma.trainerProfile.findMany({
    where: { showOnWebsite: true, user: { tenantId: tenant.id } },
    include: { user: { select: { name: true, image: true } } },
  });

  const s = tenant.settings;
  const primary = s?.primaryColor ?? "#6366F1";
  const secondary = s?.secondaryColor ?? "#8B5CF6";
  const accent = s?.accentColor ?? "#A78BFA";

  // Parse CMS JSON blobs — must cast via `unknown` because Prisma returns JsonValue
  const hero = ((s?.heroData ?? {}) as unknown) as HeroData;
  const stats = ((s?.statsData ?? []) as unknown) as Stat[];
  const services = ((s?.servicesData ?? []) as unknown) as Service[];
  const gallery = ((s?.galleryData ?? []) as unknown) as GalleryItem[];
  const testimonials = ((s?.testimonialData ?? []) as unknown) as Testimonial[];
  const features = ((s?.featuresData ?? []) as unknown) as FeatureItem[];
  const openingHours = ((s?.openingHours ?? {}) as unknown) as OpeningHours;
  const layout = Array.isArray(s?.homepageLayout) && s.homepageLayout.length > 0 
    ? (s.homepageLayout as string[]) 
    : DEFAULT_LAYOUT;

  const optimizeImageUrl = (url?: string | null) => {
    if (!url) return "";
    return url.includes('cloudinary.com') ? url.replace('/upload/', '/upload/f_auto,q_auto/') : url;
  };

  const heroHeadline = hero.headline ?? tenant.name;
  const heroSub = hero.subheadline ?? s?.tagline ?? "Join our gym and transform your fitness journey.";
  const heroBg = hero.bgImageUrl;
  const overlayOpacity = hero.overlayOpacity ?? 0.55;

  const socialLinks = [
    { href: s?.instagramUrl, icon: "📸", label: "Instagram" },
    { href: s?.facebookUrl, icon: "👤", label: "Facebook" },
    { href: s?.twitterUrl, icon: "🐦", label: "Twitter" },
    { href: s?.tiktokUrl, icon: "🎵", label: "TikTok" },
    { href: s?.youtubeUrl, icon: "▶️", label: "YouTube" },
    ...(s?.whatsappNumber
      ? [{ href: `https://wa.me/${s.whatsappNumber.replace(/\D/g, "")}`, icon: "💬", label: "WhatsApp" }]
      : []),
  ].filter((l) => l.href);

  const gradientMain = `linear-gradient(135deg, ${primary}, ${secondary})`;
  const gradientSoft = `linear-gradient(135deg, ${primary}15, ${secondary}20)`;

  return (
    <TenantThemeProvider settings={s}>
      <div className="min-h-screen bg-white" style={{ fontFamily: s?.fontFamily ? `'${s.fontFamily}', system-ui, sans-serif` : undefined }}>

        {/* ── Nav ────────────────────────────────────────────────────────────── */}
        <nav
          className="sticky top-0 z-50 backdrop-blur-md border-b"
          style={{ background: "rgba(255,255,255,0.92)", borderColor: `${primary}20` }}
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {s?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt={tenant.name} className="h-9 w-auto object-contain" />
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black uppercase"
                    style={{ background: gradientMain }}
                  >
                    {tenant.name[0]}
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{tenant.name}</span>
                </>
              )}
            </div>
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
              {services.length > 0 && <a href="#services" className="hover:text-gray-900 transition-colors">Services</a>}
              {tenant.membershipPlans.length > 0 && <a href="#plans" className="hover:text-gray-900 transition-colors">Pricing</a>}
              {trainers.length > 0 && <a href="#trainers" className="hover:text-gray-900 transition-colors">Trainers</a>}
              {tenant.blogPosts.length > 0 && <a href="#blog" className="hover:text-gray-900 transition-colors">Blog</a>}
              <a href="#contact" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`}
                id="nav-signin-btn"
                className="hidden sm:inline-block px-4 py-2 text-sm font-semibold rounded-lg border transition-all hover:shadow-sm"
                style={{ borderColor: primary, color: primary }}
              >
                Sign In
              </Link>
              <Link
                href={`/gym/${slug}/join`}
                id="nav-join-btn"
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all hover:opacity-90 hover:shadow-md"
                style={{ background: gradientMain }}
              >
                Join Now
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Sections ── */}
        {layout.map((sectionId) => {
          switch (sectionId) {
            case "hero":
              return (
                <section
                  key="hero"
          id="hero"
          className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
          style={
            heroBg
              ? { backgroundImage: `url(${optimizeImageUrl(heroBg)})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: gradientMain }
          }
        >
          {/* Overlay */}
          {heroBg && (
            <div
              className="absolute inset-0"
              style={{ background: `rgba(0,0,0,${overlayOpacity})` }}
            />
          )}

          {/* Animated blobs (when no bg image) */}
          {!heroBg && (
            <>
              <div
                className="absolute top-1/4 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse"
                style={{ background: accent }}
              />
              <div
                className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
                style={{ background: secondary, animationDelay: "1s" }}
              />
            </>
          )}

          <div className="relative z-10 max-w-4xl mx-auto">
            {s?.logoUrl && (
              <div className="flex justify-center mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizeImageUrl(s.logoUrl)} alt={tenant.name} className="h-20 object-contain drop-shadow-xl" loading="lazy" />
              </div>
            )}

            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 text-white"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              🏆 &nbsp; Premium Fitness Experience
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 drop-shadow-sm">
              {heroHeadline}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              {heroSub}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/gym/${slug}/join`}
                id="hero-join-btn"
                className="px-10 py-4 text-lg font-bold rounded-2xl text-white transition-all hover:scale-105 hover:shadow-2xl"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.4)" }}
              >
                {hero.ctaText ?? "Get Started Today"} →
              </Link>
              <Link
                href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`}
                id="hero-signin-btn"
                className="px-10 py-4 text-lg font-bold rounded-2xl bg-white transition-all hover:scale-105 hover:shadow-2xl"
                style={{ color: primary }}
              >
                Member Sign In
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce text-2xl z-10">
            ↓
          </div>
        </section>
              );

            case "stats":
              if (stats.length === 0) return null;
              return (
          <section id="stats" className="py-14" style={{ background: gradientMain }}>
            <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl md:text-5xl font-black text-white drop-shadow">{stat.value}</p>
                  <p className="text-white/75 text-sm font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>
              );

            case "about":
              if (!s?.description) return null;
              return (
          <section id="about" className="py-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                style={{ background: `${primary}15`, color: primary }}
              >
                About Us
              </span>
              <h2 className="text-4xl font-black text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 text-lg leading-relaxed">{s.description}</p>
            </div>
          </section>
              );

            case "features":
              if (features.length === 0) return null;
              return (
          <section id="features" className="py-20 px-6" style={{ background: "#f8fafc" }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  Why Choose Us
                </span>
                <h2 className="text-4xl font-black text-gray-900">Everything You Need</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feat, i) => (
                  <div
                    key={i}
                    className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {feat.icon && (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                        style={{ background: `${primary}15` }}
                      >
                        {feat.icon}
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{feat.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{feat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
              );

            case "activities":
              return (
          <section key="activities" id="services" className="py-20 px-6 scroll-mt-24">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  Activities & Programs
                </span>
                <h2 className="text-4xl font-black text-gray-900">What We Offer</h2>
              </div>
              {services.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
                  <div className="text-4xl mb-4 opacity-50">🏋️</div>
                  <p className="text-gray-500 font-medium">No programs available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((svc, i) => (
                  <div
                    key={i}
                    className="group rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {svc.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={optimizeImageUrl(svc.imageUrl)}
                        alt={svc.title}
                        loading="lazy"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-48 flex items-center justify-center text-5xl"
                        style={{ background: gradientSoft }}
                      >
                        {svc.icon ?? "🏋️"}
                      </div>
                    )}
                    <div className="p-6 bg-white">
                      <h3 className="font-bold text-gray-900 text-xl mb-2">{svc.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">{svc.description}</p>
                      {svc.scheduleInfo && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg inline-flex">
                          🗓️ {svc.scheduleInfo}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </section>
              );

            case "trainers":
              if (trainers.length === 0) return null;
              return (
          <section id="trainers" className="py-20 px-6 scroll-mt-24" style={{ background: "#f8fafc" }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  Our Team
                </span>
                <h2 className="text-4xl font-black text-gray-900">Meet Our Trainers</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {trainers.map((trainer) => {
                  const photo = trainer.publicPhotoUrl ?? trainer.user.image;
                  return (
                    <div
                      key={trainer.id}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="relative h-56 overflow-hidden" style={{ background: gradientSoft }}>
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={optimizeImageUrl(photo)}
                            alt={trainer.user.name ?? "Trainer"}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">🏋️</div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {trainer.user.name ?? "Trainer"}
                        </h3>
                        {trainer.title && (
                          <p className="text-indigo-600 font-semibold text-sm mb-1">{trainer.title}</p>
                        )}
                        {trainer.yearsOfExperience && trainer.yearsOfExperience > 0 && (
                          <p className="text-gray-500 text-xs font-medium mb-3">{trainer.yearsOfExperience} years of experience</p>
                        )}
                        {trainer.bio && (
                          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{trainer.bio}</p>
                        )}
                        {trainer.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {trainer.specialties.slice(0, 3).map((spec, i) => (
                              <span
                                key={i}
                                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                style={{ background: `${primary}12`, color: primary }}
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                        {trainer.hourlyRate && (
                          <p className="text-sm font-semibold mt-3" style={{ color: primary }}>
                            ₦{trainer.hourlyRate.toLocaleString()} / session
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
              );

            case "plans":
              return (
          <section key="plans" id="plans" className="py-20 px-6 scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  Pricing
                </span>
                <h2 className="text-4xl font-black text-gray-900">Membership Plans</h2>
                <p className="text-gray-500 mt-3 text-lg">Choose the plan that fits your goals.</p>
            </div>

            {tenant.membershipPlans.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 mb-4">Membership plans are coming soon.</p>
                <Link
                  href={`/gym/${slug}/join`}
                  className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
                  style={{ background: gradientMain }}
                >
                  Join for Free Account →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {tenant.membershipPlans.map((plan) => (
                  <div
                    key={plan.id}
                    id={`plan-card-${plan.id}`}
                    className="relative rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    style={
                      plan.featured
                        ? { borderColor: primary, boxShadow: `0 0 0 2px ${primary}` }
                        : { borderColor: "#e5e7eb" }
                    }
                  >
                    {plan.featured && (
                      <div
                        className="py-2 text-center text-xs font-bold uppercase tracking-widest text-white"
                        style={{ background: gradientMain }}
                      >
                        ⭐ Most Popular
                      </div>
                    )}
                    <div className="p-8 bg-white flex flex-col h-full">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                      )}
                      <div className="mb-2">
                        <span className="text-5xl font-black" style={{ color: primary }}>
                          ₦{plan.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-6">
                        {plan.durationDays} day{plan.durationDays > 1 ? "s" : ""} access
                      </p>

                      {(() => {
                        const customFeatures = plan.features as string[];
                        const entitlementFeatures = getEntitlementFeatures(plan.entitlements as any);
                        const combinedFeatures = [...customFeatures, ...entitlementFeatures];
                        
                        if (combinedFeatures.length === 0) return null;
                        
                        return (
                          <ul className="space-y-2 mb-8 flex-1">
                            {combinedFeatures.map((feat, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <span style={{ color: primary }}>✓</span>
                                {feat}
                              </li>
                            ))}
                          </ul>
                        );
                      })()}

                      <Link
                        href={`/gym/${slug}/checkout/${plan.id}`}
                        id={`plan-cta-${plan.id}`}
                        className="mt-auto block w-full text-center font-bold py-3.5 rounded-xl transition-all hover:opacity-90 hover:shadow-lg text-white"
                        style={{ background: plan.featured ? gradientMain : `${primary}CC` }}
                      >
                        Get Started →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
              );

            case "testimonials":
              if (testimonials.length === 0) return null;
              return (
          <section key="testimonials" id="testimonials" className="py-20 px-6" style={{ background: gradientSoft }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={{ background: "white", color: primary }}
                >
                  Testimonials
                </span>
                <h2 className="text-4xl font-black text-gray-900">What Our Members Say</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    {t.rating && (
                      <div className="flex gap-0.5 mb-4 text-amber-400 text-lg">
                        {"★".repeat(Math.min(5, t.rating))}
                      </div>
                    )}
                    <p className="text-gray-700 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      {t.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={optimizeImageUrl(t.avatarUrl)} alt={t.name} loading="lazy" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase"
                          style={{ background: gradientMain }}
                        >
                          {t.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                        {t.role && <p className="text-gray-400 text-xs">{t.role}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
              );

            case "gallery":
              return (
          <section key="gallery" id="gallery" className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  Gallery
                </span>
                <h2 className="text-4xl font-black text-gray-900">Inside {tenant.name}</h2>
              </div>
              {gallery.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
                  <div className="text-4xl mb-4 opacity-50">🖼️</div>
                  <p className="text-gray-500 font-medium">No facilities uploaded yet</p>
                </div>
              ) : (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {gallery.map((item, i) => (
                  <div key={i} className="break-inside-avoid rounded-xl overflow-hidden group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={optimizeImageUrl(item.imageUrl)}
                      alt={item.caption ?? "Gallery image"}
                      loading="lazy"
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.category && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                        {item.category}
                      </div>
                    )}
                    {item.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-sm font-medium drop-shadow-md">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
          </section>
              );

            case "blog":
              if (tenant.blogPosts.length === 0) return null;
              return (
          <section key="blog" id="blog" className="py-20 px-6 scroll-mt-24" style={{ background: "#f8fafc" }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  Blog
                </span>
                <h2 className="text-4xl font-black text-gray-900">Fitness Tips & Insights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tenant.blogPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/gym/${slug}/blog/${post.slug}`}
                    id={`blog-post-${post.id}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={optimizeImageUrl(post.coverImage)}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-44 flex items-center justify-center text-4xl"
                        style={{ background: gradientSoft }}
                      >
                        📝
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:underline">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-3">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link
                  href={`/gym/${slug}/blog`}
                  id="blog-view-all-btn"
                  className="inline-block px-8 py-3 rounded-xl font-semibold text-sm border transition-all hover:shadow-md"
                  style={{ borderColor: primary, color: primary }}
                >
                  View All Posts →
                </Link>
              </div>
            </div>
          </section>
              );

            case "contact":
              return (
          <section key="contact" id="contact" className="py-20 px-6 scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                style={{ background: `${primary}15`, color: primary }}
              >
                Get In Touch
              </span>
              <h2 className="text-4xl font-black text-gray-900">Find Us</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Contact info */}
              <div className="space-y-5">
                {(s?.address || s?.city) && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: `${primary}15` }}>
                      📍
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Address</p>
                      <p className="text-gray-500 text-sm">
                        {[s?.address, s?.city, s?.state, s?.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {s?.phone && (
                  <a href={`tel:${s.phone}`} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: `${primary}15` }}>
                      📞
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Phone</p>
                      <p className="text-gray-500 text-sm group-hover:text-gray-800 transition-colors">{s.phone}</p>
                    </div>
                  </a>
                )}
                {s?.email && (
                  <a href={`mailto:${s.email}`} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: `${primary}15` }}>
                      ✉️
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-0.5">Email</p>
                      <p className="text-gray-500 text-sm group-hover:text-gray-800 transition-colors">{s.email}</p>
                    </div>
                  </a>
                )}

                {/* Social links */}
                {socialLinks.length > 0 && (
                  <div className="pt-4">
                    <p className="font-semibold text-gray-900 text-sm mb-3">Follow Us</p>
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.href!}
                          target="_blank"
                          rel="noopener noreferrer"
                          id={`social-${link.label.toLowerCase()}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm"
                          style={{ borderColor: `${primary}40`, color: primary }}
                        >
                          {link.icon} {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Opening hours */}
              {Object.keys(openingHours).length > 0 ? (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Opening Hours</h3>
                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const h = openingHours[day];
                      if (!h) return null;
                      const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
                      const isToday = today === day;
                      return (
                        <div
                          key={day}
                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        >
                          <span
                            className="capitalize text-sm font-medium"
                            style={{ color: isToday ? primary : "#374151", fontWeight: isToday ? 700 : undefined }}
                          >
                            {isToday ? `${day} (Today)` : day}
                          </span>
                          <span className="text-sm text-gray-500">
                            {h.closed ? (
                              <span className="text-red-400 font-medium">Closed</span>
                            ) : (
                              `${h.open} – ${h.close}`
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Map embed fallback */
                s?.mapEmbedUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-64">
                    <iframe
                      src={s.mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Gym location"
                    />
                  </div>
                ) : null
              )}
            </div>

            {/* Map embed if hours are shown */}
            {Object.keys(openingHours).length > 0 && s?.mapEmbedUrl && (
              <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-56">
                <iframe
                  src={s.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Gym location map"
                />
              </div>
            )}

            {/* ── Contact Form ─────────────────────────────────────────────── */}
            <div className="mt-14">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Send Us a Message</h3>
              <p className="text-gray-500 text-sm mb-6">
                Have a question about membership or services? We&apos;d love to hear from you.
              </p>
              <ContactForm slug={slug} primaryColor={primary} />
            </div>
            </div>
          </section>
              );

            default:
              return null;
          }
        })}

        {/* ── Footer CTA ─────────────────────────────────────────────────────── */}
        <section className="py-20 px-6 text-center text-white relative overflow-hidden" style={{ background: gradientMain }}>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Ready to Start?</h2>
            <p className="text-white/80 text-lg mb-10">
              Join {tenant.name} today and take the first step towards a healthier, stronger you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#plans"
                id="footer-join-btn"
                className="px-10 py-4 text-lg font-bold rounded-2xl bg-white transition-all hover:scale-105 hover:shadow-2xl"
                style={{ color: primary }}
              >
                View Membership Plans
              </Link>
              <Link
                href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`}
                id="footer-signin-btn"
                className="px-10 py-4 text-lg font-bold rounded-2xl transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)" }}
              >
                Already a Member? Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer className="bg-gray-900 text-gray-400 py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              {s?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={optimizeImageUrl(s.logoUrl)} alt={tenant.name} loading="lazy" className="h-6 object-contain brightness-0 invert opacity-70" />
              ) : (
                <span className="font-bold text-white">{tenant.name}</span>
              )}
            </div>
            <p>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/admin`} className="hover:text-white transition-colors">
                Admin Login
              </Link>
              <Link href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/trainer`} className="hover:text-white transition-colors">
                Staff Login
              </Link>
            </div>
          </div>
        </footer>

      </div>
    </TenantThemeProvider>
  );
}
