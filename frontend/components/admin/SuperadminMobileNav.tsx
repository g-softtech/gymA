"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function SuperadminMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const bottomLinks = [
    { href: "/admin", label: "Home", icon: "⚡" },
    { href: "/admin/tenants", label: "Gyms", icon: "🏢" },
    { href: "/admin/users", label: "Users", icon: "👥" },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f] border-t border-white/10 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        <div className="flex justify-around items-center h-16 px-2">
          {bottomLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "text-violet-400 font-bold" : "text-slate-500 font-medium hover:text-slate-300"
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-[10px] uppercase tracking-wide">{link.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              moreOpen ? "text-violet-400 font-bold" : "text-slate-500 font-medium hover:text-slate-300"
            }`}
          >
            <span className="text-xl">☰</span>
            <span className="text-[10px] uppercase tracking-wide">More</span>
          </button>
        </div>
      </div>

      {/* More Drawer */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-[#11111a] rounded-t-2xl shadow-2xl p-4 border-t border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-card text-card-foreground/20 rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              <a
                href="/api/auth/signout"
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition"
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
