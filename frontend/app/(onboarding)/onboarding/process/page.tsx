"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { provisionGymAction } from "./actions";

export default function OnboardingProcessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    provisionGymAction().then((res) => {
      if (!isMounted) return;

      if (res.error) {
        if (res.redirect) {
          router.push(res.redirect);
        } else {
          setError(res.error);
        }
      } else if (res.alreadyProvisioned) {
        router.push(`/gym/${res.slug}/dashboard/admin`);
      } else {
        router.push(`/onboarding/welcome?slug=${res.slug}`);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold mb-2">Provisioning your workspace...</h1>
        <p className="text-gray-400">Please wait while we set up your gym.</p>
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
