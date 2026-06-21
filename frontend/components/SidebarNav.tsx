"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface SidebarNavProps {
  slug: string;
  role: string;
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
}: SidebarNavProps) {
  const pathname = usePathname();

  let activeLinks = memberLinks;
  let currentContext = "MEMBER";

  if (role === "SUPERADMIN" || role === "ADMIN") {
    if (pathname.includes("/dashboard/admin")) {
      activeLinks = adminLinks;
      currentContext = "ADMIN";
    } else if (pathname.includes("/dashboard/trainer")) {
      activeLinks = trainerLinks;
      currentContext = "TRAINER";
    } else {
      activeLinks = memberLinks;
      currentContext = "MEMBER";
    }
  } else if (role === "TRAINER") {
    if (pathname.includes("/dashboard/member")) {
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
      className="hidden md:flex w-56 flex-col shrink-0"
      style={{
        background: branding.sidebarBg,
        borderRight: `1px solid ${branding.sidebarBorder}`,
      }}
    >
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${branding.sidebarBorder}` }}>
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
            <p className="font-bold text-sm truncate" style={{ color: branding.textPrimary }}>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors`}
              style={{
                color: isActive ? branding.primaryColor : branding.textMuted,
                backgroundColor: isActive ? (branding.darkMode ? "rgba(255,255,255,0.1)" : "#f3f4f6") : "transparent"
              }}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* DUAL ROLE TOGGLE */}
      {(role === "TRAINER" || role === "ADMIN" || role === "SUPERADMIN") && (
        <div className="px-3 py-2" style={{ borderTop: `1px solid ${branding.sidebarBorder}` }}>
          {currentContext !== "MEMBER" ? (
            <Link
              href={`/gym/${slug}/dashboard/member`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full"
              style={{ color: branding.primaryColor, backgroundColor: branding.darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc" }}
            >
              <span>👤</span> Switch to Member View
            </Link>
          ) : (
            <Link
              href={`/gym/${slug}/dashboard/${role === "TRAINER" ? "trainer" : "admin"}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full"
              style={{ color: branding.primaryColor, backgroundColor: branding.darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc" }}
            >
              <span>{role === "TRAINER" ? "🏋️" : "👑"}</span> Switch to {role === "TRAINER" ? "Trainer" : "Admin"} View
            </Link>
          )}
        </div>
      )}

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${branding.sidebarBorder}` }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
          >
            {user.name?.[0] ?? user.email?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: branding.textPrimary }}>
              {user.name ?? "User"}
            </p>
            <p className="text-xs truncate" style={{ color: branding.textMuted }}>
              {user.email}
            </p>
          </div>
        </div>
        <a
          href={`/api/auth/signout?callbackUrl=/gym/${slug}`}
          className="block mt-3 text-xs hover:underline"
          style={{ color: branding.darkMode ? "#6b7280" : "#ef4444" }}
        >
          Sign out
        </a>
      </div>
    </aside>
  );
}
