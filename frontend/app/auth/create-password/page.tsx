"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreatePasswordPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to set password." });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: "Password saved successfully!" });
      
      // Update the NextAuth session so it knows we have a password now
      await update({ hasPassword: true });
      
      // Redirect to dashboard
      const tenantSlug = session?.user?.tenantSlug;
      if (tenantSlug) {
        router.push(`/gym/${tenantSlug}/dashboard`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setMessage({ type: "error", text: "An error occurred." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-foreground text-center mb-2">Create Your Password</h1>
        <p className="text-muted-foreground text-sm text-center mb-8">
          Welcome! Please set a permanent password so you can sign in easily next time.
        </p>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "error"
              ? "bg-red-500/10 border border-red-500/20 text-red-300"
              : "bg-green-500/10 border border-green-500/20 text-green-300"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password (min 8 characters)"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save Password"}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button 
             type="button"
             onClick={() => {
                const tenantSlug = session?.user?.tenantSlug;
                router.push(tenantSlug ? `/gym/${tenantSlug}/dashboard` : "/dashboard");
             }}
             className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
