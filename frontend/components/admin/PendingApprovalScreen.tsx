"use client";

export default function PendingApprovalScreen({
  brandName,
  slug,
  status,
}: {
  brandName: string;
  slug: string;
  status: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080811] text-white p-6">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/5 p-8 rounded-2xl text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center mb-6 text-2xl">
          ⏳
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Pending Approval</h1>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
          Your gym application for <strong>{brandName}</strong> is currently in the waitlist queue. Our team is reviewing your details.
        </p>

        <div className="bg-[#0f0f1a] rounded-lg p-4 mb-8 border border-white/5">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Current Status</div>
          <div className="text-lg font-bold text-amber-400">{status}</div>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          You will receive an email as soon as your dashboard is unlocked and ready for configuration.
        </p>
      </div>
    </div>
  );
}
