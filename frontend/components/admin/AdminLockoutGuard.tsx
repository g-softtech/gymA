"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLockoutGuard({
  isActive,
  isGrace,
  slug,
  daysRemaining,
}: {
  isActive: boolean;
  isGrace: boolean;
  slug: string;
  daysRemaining: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isActive && !pathname.includes("/admin/billing")) {
      router.push(`/gym/${slug}/dashboard/admin/billing`);
    }
  }, [isActive, pathname, router, slug]);

  if (!mounted) return null;

  // Render a persistent banner if in grace period
  const isBillingPage = pathname.includes("/admin/billing");

  return (
    <>
      {isGrace && !isBillingPage && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
          ⚠️ Your subscription has expired. You are in a 3-day grace period ({3 + daysRemaining} days left). 
          <a href={`/gym/${slug}/dashboard/admin/billing`} className="underline ml-2 font-bold">Renew now to avoid lockout.</a>
        </div>
      )}

      {/* Full screen lockout if expired and not on billing page */}
      {!isActive && !isBillingPage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4">Dashboard Locked</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your CortexFit SaaS subscription has expired and the grace period has ended. 
              Admin functionality is currently locked. Your members can still access their accounts, but you cannot manage your gym.
            </p>
            <button
              onClick={() => router.push(`/gym/${slug}/dashboard/admin/billing`)}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              Go to Billing & Renew →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
