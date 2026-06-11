import { ReactNode } from "react";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  if (session.user.role !== "SUPERADMIN") {
    redirect("/api/auth/signin");
  }

  const navItems = [
    { href: "/admin", label: "Overview", icon: "⚡" },
    { href: "/admin/tenants", label: "Gyms", icon: "🏢" },
    { href: "/admin/users", label: "All Users", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-white/5 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-black">
              S
            </div>
            <div>
              <p className="text-sm font-bold text-white">CortexFit</p>
              <p className="text-[10px] text-violet-400 font-semibold tracking-widest uppercase">
                Superadmin
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              id={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium group"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Session info */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
              {session.user.name?.[0] ?? session.user.email?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {session.user.name ?? "Superadmin"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <a
            href="/api/auth/signout"
            className="block mt-3 text-[11px] text-slate-600 hover:text-red-400 transition-colors"
          >
            Sign out →
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
