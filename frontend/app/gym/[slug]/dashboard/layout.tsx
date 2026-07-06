
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getUserAccessContext } from "@/lib/access-control";
import AdminLockoutGuard from "@/components/admin/AdminLockoutGuard";
import PendingApprovalScreen from "@/components/admin/PendingApprovalScreen";
import { MobileNav } from "@/components/MobileNav";
import { SidebarNav } from "@/components/SidebarNav";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();
  if (!session?.user) return null;
  const ctx = getUserAccessContext(session);

  // ── FORENSIC ─────────────────────────────────────────────────────────────────
  const TRACE = `[FORENSIC:dashboard-layout][${Date.now()}]`;
  console.log(`${TRACE} ┌─ ENTRY slug=${slug}`);
  console.log(`${TRACE} │  user.id          = ${session.user.id}`);
  console.log(`${TRACE} │  user.email       = ${session.user.email ?? "undefined"}`);
  console.log(`${TRACE} │  ctx.role         = ${ctx.role}`);
  console.log(`${TRACE} │  ctx.hasTenant    = ${ctx.hasTenant}`);
  console.log(`${TRACE} │  ctx.tenantId     = ${ctx.tenantId ?? "null"}`);
  console.log(`${TRACE} │  ctx.tenantSlug   = ${ctx.tenantSlug ?? "null"}`);
  console.log(`${TRACE} │  url.slug         = ${slug}`);
  console.log(`${TRACE} │  slugMatch        = ${ctx.tenantSlug === slug}`);
  console.log(`${TRACE} │  ctx.defaultRedirect = ${ctx.defaultRedirect}`);

  // Use pure centralized logic to verify identity and tenant alignment
  if (!ctx.hasTenant || ctx.tenantSlug !== slug) {
    // SUPERADMIN is exempt from cross-tenant isolation
    if (ctx.role !== "SUPERADMIN") {
      if (!ctx.hasTenant) {
        console.log(`${TRACE} └─ REDIRECT: User has no tenant, redirecting to join page`);
        redirect(`/gym/${slug}/join`);
      } else {
        console.log(`${TRACE} └─ REDIRECT: hasTenant=${ctx.hasTenant} tenantSlug=${ctx.tenantSlug} url.slug=${slug} role=${ctx.role} → ${ctx.defaultRedirect}`);
        redirect(ctx.defaultRedirect);
      }
    } else {
      console.log(`${TRACE} │  SUPERADMIN cross-tenant access: allowed into slug=${slug}`);
    }
  } else {
    console.log(`${TRACE} │  ALLOW: tenant match confirmed, rendering dashboard`);
  }

  // ✅ Phase 5: Fetch TenantSettings alongside the tenant for branding
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { settings: true },
  });
  if (!tenant) notFound();

  // Waitlist Lock
  if (tenant.status !== "APPROVED" && ctx.role !== "SUPERADMIN") {
    const brandName = tenant.settings?.brandName || tenant.name;
    return <PendingApprovalScreen brandName={brandName} slug={slug} status={tenant.status} />;
  }

  const role = session.user.role;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
  const isTrainer = role === "TRAINER";

  // Unread notifications count for admin
  let unreadCount = 0;
  if (isAdmin) {
    unreadCount = await prisma.notification.count({
      where: { tenantId: tenant.id, read: false },
    });
  }

  // ✅ Phase 5: Brand CSS variables derived from TenantSettings
  const settings = tenant.settings;
  const primaryColor = settings?.primaryColor ?? "#6366F1";
  const secondaryColor = settings?.secondaryColor ?? "#8B5CF6";
  const fontFamily = settings?.fontFamily ?? "Inter";
  const logoUrl = settings?.logoUrl;
  const brandName = settings?.brandName || tenant.name;
  const darkMode = settings?.darkMode ?? false;

  // Sidebar theme
  const sidebarBg = darkMode ? "#0f0f1a" : "#ffffff";
  const sidebarBorder = darkMode ? "rgba(255,255,255,0.06)" : "#f0f0f0";
  const textPrimary = darkMode ? "#f9fafb" : "#111827";
  const textMuted = darkMode ? "#9ca3af" : "#6b7280";

  // ✅ Phase 9B.4: Grace Period / Lockout calculations
  const now = new Date();
  const daysRemaining = tenant.billingEndsAt 
    ? Math.ceil((tenant.billingEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : tenant.trialEndsAt
    ? Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isActive = daysRemaining >= -3; // Includes 3-day grace period
  const isGrace = daysRemaining < 0 && daysRemaining >= -3;

  const adminLinks = [
    { href: `/gym/${slug}/dashboard/admin`, label: "Overview", icon: "📊" },
    { href: `/gym/${slug}/dashboard/admin/members`, label: "Members", icon: "👥" },
    { href: `/gym/${slug}/dashboard/admin/plans`, label: "Plans", icon: "📋" },
    { href: `/gym/${slug}/dashboard/admin/trainers`, label: "Trainers", icon: "🏋️" },
    { href: `/gym/${slug}/dashboard/admin/checkin`, label: "Check-in Desk", icon: "📲" },
    { href: `/gym/${slug}/dashboard/admin/attendance`, label: "Attendance", icon: "✅" },
    { href: `/gym/${slug}/dashboard/admin/revenue`, label: "Revenue", icon: "💰" },
    { href: `/gym/${slug}/dashboard/admin/analytics`, label: "Analytics ⭐", icon: "📈" },
    { href: `/gym/${slug}/dashboard/admin/intelligence`, label: "Intelligence ⚡", icon: "🧠" },
    { href: `/gym/${slug}/dashboard/admin/ai-usage`, label: "AI Usage", icon: "🤖" },
    { href: `/gym/${slug}/dashboard/admin/blog`, label: "Blog", icon: "📝" },
    { href: `/gym/${slug}/dashboard/admin/notifications`, label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`, icon: "🔔" },
    { href: `/gym/${slug}/dashboard/admin/website`, label: "Website", icon: "🌐" },
    { href: `/gym/${slug}/dashboard/admin/billing`, label: "Platform Subscription", icon: "💳" },
  ];

  const trainerLinks = [
    { href: `/gym/${slug}/dashboard/trainer`, label: "Overview", icon: "📊" },
    { href: `/gym/${slug}/dashboard/trainer/clients`, label: "My Clients", icon: "👥" },
    { href: `/gym/${slug}/dashboard/trainer/workouts`, label: "Workout Plans", icon: "💪" },
    { href: `/gym/${slug}/dashboard/trainer/schedule`, label: "My Schedule", icon: "📅" },
    { href: `/gym/${slug}/dashboard/trainer/bookings`, label: "Bookings", icon: "📋" },
    { href: `/gym/${slug}/dashboard/trainer/progress`, label: "Progress", icon: "📊" },
    { href: `/gym/${slug}/dashboard/trainer/messages`, label: "Messages", icon: "💬" },
  ];

  const memberLinks = [
    { href: `/gym/${slug}/dashboard/member`, label: "Dashboard", icon: "🏠" },
    { href: `/gym/${slug}/dashboard/member/profile`, label: "My Profile", icon: "👤" },
    { href: `/gym/${slug}/dashboard/member/workouts`, label: "Workouts", icon: "💪" },
    { href: `/gym/${slug}/dashboard/member/nutrition`, label: "Nutrition", icon: "🥗" },
    { href: `/gym/${slug}/dashboard/member/community`, label: "Community", icon: "🏅" },
    { href: `/gym/${slug}/dashboard/member/ai`, label: "AI Coach", icon: "🤖" },
    { href: `/gym/${slug}/dashboard/member/book-trainer`, label: "Book Trainer", icon: "🏋️" },
    { href: `/gym/${slug}/dashboard/member/bookings`, label: "My Schedule", icon: "📅" },
    { href: `/gym/${slug}/dashboard/member/progress`, label: "My Progress", icon: "📊" },
    { href: `/gym/${slug}/dashboard/member/attendance`, label: "Attendance", icon: "✅" },
    { href: `/gym/${slug}/dashboard/member/notifications`, label: "Notifications", icon: "🔔" },
    { href: `/gym/${slug}/dashboard/member/messages`, label: "Messages", icon: "💬" },
  ];

  return (
    <>
      {/* ✅ Phase 5: Google Fonts injection based on TenantSettings.fontFamily */}
      {fontFamily !== "Inter" && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`}
        />
      )}

      <div
        className="flex min-h-screen bg-background text-foreground"
        style={{
          fontFamily: `'${fontFamily}', system-ui, sans-serif`,
          // ✅ Phase 5: CSS custom properties for brand colors — used by child components
          ["--brand-primary" as string]: primaryColor,
          ["--brand-secondary" as string]: secondaryColor,
          ["--brand-accent" as string]: settings?.accentColor ?? "#A78BFA",
        } as React.CSSProperties}
      >
        {/* Sidebar (Tablet/Desktop only) */}
        <SidebarNav
          slug={slug}
          role={role}
          adminLinks={adminLinks}
          trainerLinks={trainerLinks}
          memberLinks={memberLinks}
          user={session.user}
          branding={{
            brandName,
            logoUrl,
            primaryColor,
            secondaryColor,
            darkMode,
            sidebarBg,
            sidebarBorder,
            textPrimary,
            textMuted,
          }}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {isAdmin && (
            <AdminLockoutGuard
              isActive={isActive}
              isGrace={isGrace}
              slug={slug}
              daysRemaining={daysRemaining}
            />
          )}
          <div className="flex-1 p-6 overflow-y-auto pb-24 md:pb-6">{children}</div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        slug={slug}
        role={role as "SUPERADMIN" | "ADMIN" | "TRAINER" | "MEMBER"}
        adminLinks={adminLinks}
        trainerLinks={trainerLinks}
        memberLinks={memberLinks}
        primaryColor={primaryColor}
      />
    </>
  );
}