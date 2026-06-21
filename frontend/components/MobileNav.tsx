"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MobileNavProps {
  slug: string;
  role: "MEMBER" | "TRAINER" | "ADMIN" | "SUPERADMIN";
  allLinks: { href: string; label: string; icon: string }[];
  primaryColor: string;
}

export function MobileNav({ slug, role, allLinks, primaryColor }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-hide during scanner mode or booking/payment flows
  const shouldHide = pathname.includes("/checkin") || pathname.includes("/bookings/new") || pathname.includes("/checkout");
  if (shouldHide) return null;

  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  // Define bottom bar links based on role
  let bottomLinks = [];
  if (isAdmin) {
    bottomLinks = [
      { href: `/gym/${slug}/dashboard/admin`, label: "Home", icon: "🏠" },
      { href: `/gym/${slug}/dashboard/admin/bookings`, label: "Bookings", icon: "📅" },
      { href: `/gym/${slug}/dashboard/admin/members`, label: "Members", icon: "👥" },
      { href: `/gym/${slug}/dashboard/admin/revenue`, label: "Revenue", icon: "💰" },
    ];
  } else {
    // Member or Trainer
    bottomLinks = allLinks.slice(0, 4).map(l => ({
      ...l,
      label: l.label === "Dashboard" || l.label === "Overview" ? "Home" : l.label
    }));
  }

  const moreLinks = allLinks.filter(l => !bottomLinks.some(bl => bl.href === l.href));

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {bottomLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "text-indigo-600 font-bold" : "text-gray-500 font-medium hover:text-gray-900"
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
              moreOpen ? "text-indigo-600 font-bold" : "text-gray-500 font-medium hover:text-gray-900"
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
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMoreOpen(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              {moreLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span className="font-semibold text-gray-900">{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={`/api/auth/signout?callbackUrl=/gym/${slug}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition"
              >
                <span className="text-2xl">🚪</span>
                <span className="font-semibold">Sign out</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
