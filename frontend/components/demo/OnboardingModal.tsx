"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [gymName, setGymName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Parse UTM parameters from URL if available
  const getUtmParams = () => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    };
  };

  const getDemoPersona = () => {
    if (typeof window === "undefined") return "GYM_OWNER";
    if (window.location.pathname.includes("/dashboard/trainer")) return "TRAINER";
    if (window.location.pathname.includes("/dashboard/member")) return "MEMBER";
    return "GYM_OWNER";
  };

  const liveSlug = gymName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !email.trim() || !gymName.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const utmParams = getUtmParams();
      const attribution = {
        ...utmParams,
        landing_page: window.location.pathname,
        referrer: document.referrer,
      };

      // 1. Create the PendingSignup record
      const res = await fetch("/api/signup/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ownerName, 
          email, 
          gymName, 
          slug: liveSlug,
          phone: phone.trim() || undefined,
          leadSource: "LIVE_DEMO",
          demoPersona: getDemoPersona(),
          attribution
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate signup.");
      }

      // 2. Trigger NextAuth Magic Link
      const signInRes = await signIn("email", { 
        email, 
        redirect: false,
        callbackUrl: "/onboarding/process" 
      });

      if (signInRes?.error) {
        throw new Error(signInRes.error);
      }

      // 3. Show success screen
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border shadow-2xl rounded-2xl overflow-hidden p-0">
        {success ? (
          <div className="p-8 text-center bg-gradient-to-b from-card to-muted/20">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
              <span className="text-4xl text-white">✉️</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Check your email!
            </h2>
            <p className="text-muted-foreground mb-8">
              We've sent a secure login link to <span className="font-semibold text-foreground">{email}</span>. 
              Click it to verify your account and finish setting up <strong>{gymName}</strong>.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8">
              <p className="text-sm font-medium text-primary">
                In the meantime, you can continue exploring the live demo!
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/sandbox/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ slug: liveSlug, email })
                  });
                  window.location.href = `/sandbox/${liveSlug}/member?welcome=1`;
                } catch (e) {
                  onClose();
                }
              }}
              className="w-full bg-secondary text-secondary-foreground font-semibold py-3 px-4 rounded-xl hover:bg-secondary/80 transition"
            >
              Continue Exploring
            </button>
          </div>
        ) : (
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">Start Your Free Trial</DialogTitle>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your details to launch your CortexFit workspace. No credit card required.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Your Full Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Gym or Studio Name</label>
                <input
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="IronHouse Fitness"
                  disabled={isSubmitting}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">WhatsApp / Phone <span className="text-muted-foreground font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  disabled={isSubmitting}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !ownerName.trim() || !email.trim() || !gymName.trim()}
                className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 transition disabled:opacity-50 mt-4"
              >
                {isSubmitting ? "Preparing Workspace..." : "Create My Gym 🚀"}
              </button>
              
              <div className="text-center mt-4">
                <p className="text-xs text-muted-foreground">
                  Not ready? <a href="mailto:sales@cortexfit.com" className="text-primary hover:underline font-medium">Talk to Sales / Schedule a Walkthrough</a>
                </p>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
