import { ReactNode } from "react";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserAccessContext } from "@/lib/access-control";
import Link from "next/link";
import SuperadminMobileNav from "@/components/admin/SuperadminMobileNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAuthSession();

  if (!session?.user) return null;
  const ctx = getUserAccessContext(session);


  if (ctx.role !== "SUPERADMIN") {
    redirect(ctx.defaultRedirect);
  }


  const navItems = [
    { href: "/admin", label: "Overview", icon: "⚡" },
    { href: "/admin/growth", label: "Growth", icon: "🌱" },
    { href: "/admin/tenants", label: "Gyms", icon: "🏢" },
    { href: "/admin/users", label: "All Users", icon: "👥" },
    { href: "/admin/billing", label: "Billing", icon: "💰" },
    { href: "/admin/blog", label: "Marketing Blog", icon: "📝" },
    { href: "/admin/subscribers", label: "Subscribers", icon: "📬" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border flex-col shrink-0">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-1">
            <div className="h-8 w-10 flex items-center justify-center overflow-hidden rounded-md">
              <img 
                src="/logo.png" 
                alt="CortexFit Logo" 
                className="h-full w-full object-cover scale-[1.6] drop-shadow-md" 
              />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">CortexFit</p>
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all font-medium group"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Session info */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold uppercase text-white">
              {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {session?.user?.name ?? "Superadmin"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <a
              href="/api/auth/signout"
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              Sign out →
            </a>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 min-w-0">
        {children}
      </main>

      {/* Mobile Nav */}
      <SuperadminMobileNav />
    </div>
  );
}
