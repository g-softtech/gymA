"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface MobileNavProps {
  slug: string;
  role: "MEMBER" | "TRAINER" | "ADMIN" | "SUPERADMIN";
  adminLinks: NavLink[];
  trainerLinks: NavLink[];
  memberLinks: NavLink[];
  primaryColor: string;
  isSandbox?: boolean;
}

export function MobileNav({ slug, role, adminLinks, trainerLinks, memberLinks, primaryColor, isSandbox = false }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-hide during scanner mode or booking/payment flows
  const shouldHide = pathname.includes("/checkin") || pathname.includes("/bookings/new") || pathname.includes("/checkout");
  if (shouldHide) return null;

  let activeLinks = memberLinks;
  let currentContext = "MEMBER";

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

  const isAdminContext = currentContext === "ADMIN";

  // Define bottom bar links based on context
  let bottomLinks: typeof activeLinks = [];
  if (isAdminContext) {
    const adminBase = activeLinks[0]?.href ?? `/gym/${slug}/dashboard/admin`; // Fallback, but should be accurate from activeLinks
    
    // Attempt to pick 4 key items from activeLinks to ensure correct paths and avoid hardcoding missing pages
    // The preferred icons are Home, Members, Check-in (since Bookings is mostly trainer/member), Revenue
    
    const findLink = (partialHref: string, fallbackLabel: string, fallbackIcon: string) => {
      const link = activeLinks.find(l => l.href.endsWith(partialHref) || l.href === partialHref);
      if (link) return link;
      // Fallback if not found (though it should be in activeLinks)
      return { href: partialHref.startsWith("/") ? partialHref : `${adminBase}/${partialHref}`, label: fallbackLabel, icon: fallbackIcon };
    };

    bottomLinks = [
      { href: adminBase, label: "Home", icon: "🏠" },
      { ...findLink("members", "Members", "👥") },
      { ...findLink("checkin", "Check-in", "📲") },
      { ...findLink("revenue", "Revenue", "💰") },
    ];
  } else {
    // Member or Trainer
    bottomLinks = activeLinks.slice(0, 4).map(l => ({
      ...l,
      label: l.label === "Dashboard" || l.label === "Overview" ? "Home" : l.label
    }));
  }

  const moreLinks = activeLinks.filter(l => !bottomLinks.some(bl => bl.href === l.href));

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {bottomLinks.map((link) => {
            const isActive = pathname === link.href;
            let tourId = undefined;
            if (link.href.endsWith("/checkin")) tourId = "tour-mobile-checkin-desk";
            if (link.href.endsWith("/revenue")) tourId = "tour-mobile-revenue";
            if (link.href.endsWith("/website")) tourId = "tour-mobile-website";
            if (link.href.endsWith("/intelligence")) tourId = "tour-mobile-intelligence";
            if (link.href.endsWith("/trainers")) tourId = "tour-mobile-trainers";
            if (link.href.endsWith("/analytics")) tourId = "tour-mobile-analytics";
            
            return (
              <Link
                key={link.href}
                href={link.href}
                id={tourId}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "font-bold" : "text-muted-foreground font-medium hover:text-foreground"
                }`}
                style={isActive ? { color: primaryColor } : {}}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-[10px] uppercase tracking-wide">{link.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              moreOpen ? "font-bold" : "text-muted-foreground font-medium hover:text-foreground"
            }`}
            style={moreOpen ? { color: primaryColor } : {}}
          >
            <span className="text-xl">☰</span>
            <span className="text-[10px] uppercase tracking-wide">More</span>
          </button>
        </div>
      </div>

      {/* More Drawer */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-black/50" onClick={() => setMoreOpen(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              {isAdminContext && _isSandbox && (
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    setTimeout(() => window.dispatchEvent(new CustomEvent('cortexfit:start-tour')), 300);
                  }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition w-full text-left"
                >
                  <span className="text-2xl">🧭</span>
                  <span className="font-semibold">Take Product Tour</span>
                </button>
              )}
              {moreLinks.map(link => {
                let tourId = undefined;
                if (link.href.endsWith("/checkin")) tourId = "tour-mobile-checkin-desk";
                if (link.href.endsWith("/revenue")) tourId = "tour-mobile-revenue";
                if (link.href.endsWith("/website")) tourId = "tour-mobile-website";
                if (link.href.endsWith("/intelligence")) tourId = "tour-mobile-intelligence";
                if (link.href.endsWith("/trainers")) tourId = "tour-mobile-trainers";
                if (link.href.endsWith("/analytics")) tourId = "tour-mobile-analytics";
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    id={tourId}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-accent transition"
                  >
                    <span className="text-2xl">{link.icon}</span>
                    <span className="font-semibold text-foreground">{link.label}</span>
                  </Link>
                );
              })}

            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between px-4">
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
                className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-destructive/10 text-destructive w-full text-left transition"
              >
                <span className="text-2xl">🚪</span>
                <span className="font-semibold">Sign out</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
