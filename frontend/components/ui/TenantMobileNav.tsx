"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface LinkItem {
  label: string;
  href: string;
}

export function TenantMobileNav({
  links,
  primaryColor,
  signInHref,
  joinHref,
}: {
  links: LinkItem[];
  primaryColor: string;
  signInHref: string;
  joinHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-foreground"
        aria-label="Toggle mobile menu"
      >
        {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>

      {open && (
        <div className="absolute top-[64px] left-0 right-0 bg-background border-b border-border shadow-2xl flex flex-col animate-in slide-in-from-top-2 z-50">
          <div className="px-6 py-4 flex flex-col gap-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-lg font-bold text-foreground py-3 border-b border-border/50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="flex flex-col gap-3 px-6 pb-8 pt-2 bg-muted/30">
            <Link
              href={signInHref}
              className="px-4 py-3.5 text-center text-sm font-bold rounded-xl border transition-all"
              style={{ borderColor: primaryColor, color: primaryColor }}
              onClick={() => setOpen(false)}
            >
              Member Sign In
            </Link>
            <Link
              href={joinHref}
              className="px-5 py-3.5 text-center text-sm font-bold rounded-xl text-white shadow-md transition-all"
              style={{ background: primaryColor }}
              onClick={() => setOpen(false)}
            >
              Join Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
