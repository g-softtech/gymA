"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface SidebarNavProps {
  slug: string;
  role: string;
  isSandbox?: boolean;
  adminLinks: NavLink[];
  trainerLinks: NavLink[];
  memberLinks: NavLink[];
  user: { name?: string | null; email?: string | null };
  branding: {
    brandName: string;
    logoUrl?: string | null;
    primaryColor: string;
    secondaryColor: string;
    darkMode: boolean;
    sidebarBg: string;
    sidebarBorder: string;
    textPrimary: string;
    textMuted: string;
  };
}

export function SidebarNav({
  slug,
  role,
  adminLinks,
  trainerLinks,
  memberLinks,
  user,
  branding,
  isSandbox = false,
}: SidebarNavProps) {
  const pathname = usePathname();

  let activeLinks = memberLinks;
  let currentContext = "MEMBER";

  // If passed explicitly via prop, trust it, otherwise fallback to pathname (though prop is preferred)
  const _isSandbox = isSandbox || pathname.includes("/sandbox/");
  const isDashboardAdmin = pathname.includes("/dashboard/admin");
  const isDashboardTrainer = pathname.includes("/dashboard/trainer");
  const isDashboardMember = pathname.includes("/dashboard/member");

  // Determine actual path context
  let pathContext = "MEMBER";
  
  if (_isSandbox) {
    const parts = pathname.split("/");
    const remaining = parts.slice(3).join("/");
    
    if (remaining === "member" || remaining.startsWith("member/")) {
      pathContext = "MEMBER";
    } else if (remaining === "trainer" || remaining.startsWith("trainer/")) {
      pathContext = "TRAINER";
    } else {
      // Anything else in sandbox is ADMIN (overview, members, plans, etc)
      pathContext = "ADMIN";
    }
  } else {
    if (isDashboardAdmin) {
      pathContext = "ADMIN";
    } else if (isDashboardTrainer) {
      pathContext = "TRAINER";
    } else if (isDashboardMember) {
      pathContext = "MEMBER";
    }
  }

  if (role === "SUPERADMIN" || role === "ADMIN") {
    if (pathContext === "ADMIN") {
      activeLinks = adminLinks;
      currentContext = "ADMIN";
    } else if (pathContext === "TRAINER") {
      activeLinks = trainerLinks;
      currentContext = "TRAINER";
    } else {
      activeLinks = memberLinks;
      currentContext = "MEMBER";
    }
  } else if (role === "TRAINER") {
    if (pathContext === "MEMBER") {
      activeLinks = memberLinks;
      currentContext = "MEMBER";
    } else {
      activeLinks = trainerLinks;
      currentContext = "TRAINER";
    }
  } else {
    activeLinks = memberLinks;
    currentContext = "MEMBER";
  }

  return (
    <aside
      className="hidden md:flex w-56 flex-col shrink-0 bg-card border-r border-border"
    >
      <div className="px-5 py-5 border-b border-border">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt={branding.brandName} className="h-8 w-auto object-contain mb-1" />
        ) : (
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black uppercase shrink-0"
              style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
            >
              {branding.brandName[0]}
            </div>
            <p className="font-bold text-sm truncate text-foreground">
              {branding.brandName}
            </p>
          </div>
        )}
        <p className="text-xs font-semibold mt-0.5" style={{ color: branding.primaryColor }}>
          {role}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {activeLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary/10" : "hover:bg-accent"}`}
              style={{
                color: isActive ? branding.primaryColor : undefined,
              }}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* ROLE SWITCHER */}
      {(_isSandbox || role === "TRAINER" || role === "ADMIN" || role === "SUPERADMIN") && (
        <div className="px-3 py-2 border-t border-border space-y-1">
          {/* If ADMIN/SUPERADMIN OR Sandbox, they can switch between Admin, Trainer, and Member */}
          {(_isSandbox || role === "ADMIN" || role === "SUPERADMIN") && (
            <>
              {currentContext !== "ADMIN" && (
                <button
                  onClick={async () => {
                    if (_isSandbox) await fetch("/api/sandbox/impersonate", { method: "POST", body: JSON.stringify({ action: "revert" }) }).catch(() => {});
                    window.location.href = _isSandbox ? `/sandbox/${slug}` : `/gym/${slug}/dashboard/admin`;
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full bg-accent hover:bg-accent/80 text-foreground"
                >
                  <span>👑</span> Switch to Admin View
                </button>
              )}
              {currentContext !== "TRAINER" && (
                <button
                  onClick={async () => {
                    if (_isSandbox) await fetch("/api/sandbox/impersonate", { method: "POST", body: JSON.stringify({ action: "revert" }) }).catch(() => {});
                    window.location.href = _isSandbox ? `/sandbox/${slug}/trainer` : `/gym/${slug}/dashboard/trainer`;
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full bg-accent hover:bg-accent/80 text-foreground"
                >
                  <span>🏋️</span> Switch to Trainer View
                </button>
              )}
              {currentContext !== "MEMBER" && (
                <button
                  onClick={async () => {
                    if (_isSandbox) await fetch("/api/sandbox/impersonate", { method: "POST", body: JSON.stringify({ action: "revert" }) }).catch(() => {});
                    window.location.href = _isSandbox ? `/sandbox/${slug}/member` : `/gym/${slug}/dashboard/member`;
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full bg-accent hover:bg-accent/80 text-foreground"
                >
                  <span>👤</span> Switch to Member View
                </button>
              )}
            </>
          )}

          {/* If strictly TRAINER (and not Sandbox), they can only switch between Trainer and Member */}
          {!_isSandbox && role === "TRAINER" && (
            <>
              {currentContext !== "TRAINER" && (
                <Link
                  href={`/gym/${slug}/dashboard/trainer`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full bg-accent hover:bg-accent/80 text-foreground"
                >
                  <span>🏋️</span> Switch to Trainer View
                </Link>
              )}
              {currentContext !== "MEMBER" && (
                <Link
                  href={`/gym/${slug}/dashboard/member`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full bg-accent hover:bg-accent/80 text-foreground"
                >
                  <span>👤</span> Switch to Member View
                </Link>
              )}
            </>
          )}
        </div>
      )}

      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
          >
            {user.name?.[0] ?? user.email?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate text-foreground">
              {user.name ?? "User"}
            </p>
            <p className="text-xs truncate text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between w-full mt-3">
          <button
            onClick={async () => {
              if (_isSandbox) {
                await fetch("/api/sandbox/impersonate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "revert" }),
                }).catch(console.error);
              }
              window.location.href = `/api/auth/signout?callbackUrl=/gym/${slug}`;
            }}
            className="text-xs hover:underline text-destructive text-left"
          >
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
