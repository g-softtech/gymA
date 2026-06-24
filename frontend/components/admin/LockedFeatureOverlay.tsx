"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

interface LockedFeatureOverlayProps {
  featureName?: string;
  className?: string;
}

export function LockedFeatureOverlay({ featureName = "This feature", className = "" }: LockedFeatureOverlayProps) {
  const params = useParams();
  const slug = params.slug as string;
  const upgradePath = slug ? `/gym/${slug}/dashboard/admin/billing` : "/admin/billing";

  return (
    <div className={`relative flex items-center justify-center w-full h-full min-h-[400px] overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 ${className}`}>
      {/* Decorative abstract background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600 rounded-full blur-[80px]" />
      </div>

      {/* Glassmorphic card */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-md bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 bg-gray-800/80 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10">
          <LockIcon className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">Feature Locked</h3>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          {featureName} is locked on your current plan. Upgrade to unlock advanced capabilities instantly.
        </p>
        
        <Link 
          href={upgradePath}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98]"
        >
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
}
