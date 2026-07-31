"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import PayoutSettingsClient from "@/app/gym/[slug]/dashboard/admin/revenue/payout-settings/PayoutSettingsClient";

export default function WelcomeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if slug was passed directly from the provisioning step
    const urlParams = new URLSearchParams(window.location.search);
    const urlSlug = urlParams.get("slug");
    if (urlSlug) {
      setSlug(urlSlug);
      return;
    }

    // 2. Fallback: Fetch the user's tenant slug from NextAuth session
    getSession().then((session) => {
      if (session?.user?.tenantSlug) {
        setSlug(session.user.tenantSlug);
      }
    });
  }, []);

  const nextStep = () => setStep(s => s + 1);

  const finish = () => {
    if (slug) {
      router.push(`/gym/${slug}/dashboard/admin`);
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-gray-800 w-full">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/30">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-4">Your Gym is Live!</h1>
            <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">
              Your workspace has been successfully provisioned. Let's get some basic settings configured so you can start taking payments.
            </p>
            <button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition w-full sm:w-auto">
              Let's Go 🚀
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold mb-2">Upload your Logo</h2>
            <p className="text-gray-400 mb-8">Brand your workspace for your members.</p>
            
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:bg-white/5 transition cursor-pointer mb-8">
              <span className="text-4xl mb-4 block">📸</span>
              <p className="text-gray-300 font-medium">Click to upload logo</p>
              <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={nextStep} className="text-gray-500 hover:text-white transition">Skip for now</button>
              <button onClick={nextStep} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-medium transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold mb-2">Connect Bank Account</h2>
            <p className="text-gray-400 mb-8">Connect Paystack to start receiving member subscriptions immediately.</p>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
              <PayoutSettingsClient settings={null} />
            </div>

            <div className="flex justify-between items-center">
              <button onClick={nextStep} className="text-gray-500 hover:text-white transition">Skip for now</button>
              <button onClick={nextStep} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-medium transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">You're all set!</h2>
            <p className="text-gray-400 mb-10 max-w-sm mx-auto">
              You can configure your membership plans and invite your staff directly from your Superadmin dashboard.
            </p>
            <button onClick={finish} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition w-full">
              Go to my Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
