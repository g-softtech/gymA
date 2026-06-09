
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`);
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  if (!session.user.tenantId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { tenantId: tenant.id },
    });
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`);
  }

  if (session.user.tenantId !== tenant.id) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2 text-gray-600">You do not have access to {tenant.name}.</p>
        </div>
      </div>
    );
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

  const navLinks = isAdmin
    ? [
        { href: `/gym/${slug}/dashboard/admin`, label: "Overview", icon: "📊" },
        { href: `/gym/${slug}/dashboard/admin/members`, label: "Members", icon: "👥" },
        { href: `/gym/${slug}/dashboard/admin/plans`, label: "Plans", icon: "📋" },
        { href: `/gym/${slug}/dashboard/admin/trainers`, label: "Trainers", icon: "🏋️" },
        { href: `/gym/${slug}/dashboard/admin/attendance`, label: "Attendance", icon: "✅" },
        { href: `/gym/${slug}/dashboard/admin/revenue`, label: "Revenue", icon: "💰" },
        { href: `/gym/${slug}/dashboard/admin/notifications`, label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`, icon: "🔔" },
      ]
    : isTrainer
    ? [
        { href: `/gym/${slug}/dashboard/trainer`, label: "Overview", icon: "📊" },
        { href: `/gym/${slug}/dashboard/trainer/clients`, label: "My Clients", icon: "👥" },
        { href: `/gym/${slug}/dashboard/trainer/workouts`, label: "Workout Plans", icon: "💪" },
        { href: `/gym/${slug}/dashboard/trainer/schedule`, label: "My Schedule", icon: "📅" },
        { href: `/gym/${slug}/dashboard/trainer/bookings`, label: "Bookings", icon: "📋" },
        { href: `/gym/${slug}/dashboard/trainer/progress`, label: "Progress", icon: "📊" },
        { href: `/gym/${slug}/dashboard/trainer/messages`, label: "Messages", icon: "💬" },
      ]
    : [
        { href: `/gym/${slug}/dashboard/member`, label: "Dashboard", icon: "🏠" },
        { href: `/gym/${slug}/dashboard/member/profile`, label: "My Profile", icon: "👤" },
        { href: `/gym/${slug}/dashboard/member/workouts`, label: "Workouts", icon: "💪" },
        { href: `/gym/${slug}/dashboard/member/nutrition`, label: "Nutrition", icon: "🥗" },
        { href: `/gym/${slug}/dashboard/member/community`, label: "Community", icon: "🏅" },
        { href: `/gym/${slug}/dashboard/member/ai`, label: "AI Coach", icon: "🤖" },
        { href: `/gym/${slug}/dashboard/member/bookings`, label: "Book Trainer", icon: "📅" },
        { href: `/gym/${slug}/dashboard/member/progress`, label: "My Progress", icon: "📊" },
        { href: `/gym/${slug}/dashboard/member/attendance`, label: "Attendance", icon: "✅" },
        { href: `/gym/${slug}/dashboard/member/notifications`, label: "Notifications", icon: "🔔" },
        { href: `/gym/${slug}/dashboard/member/messages`, label: "Messages", icon: "💬" },
      ];


  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-56 bg-white border-r border-gray-100 shadow-sm flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-base truncate">{tenant.name}</p>
          <p className="text-xs text-indigo-600 font-medium mt-0.5">{role}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
              {session.user.name?.[0] ?? session.user.email?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {session.user.name ?? "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
            </div>
          </div>
          <a
            href={`/api/auth/logout?callbackUrl=/gym/${slug}`}
            className="block text-xs text-red-500 hover:text-red-700 hover:underline pt-1"
          >
            Sign out
          </a>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}