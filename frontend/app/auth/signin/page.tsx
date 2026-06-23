"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const EyeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      const match = callbackUrl.match(/\/gym\/([^\/]+)/);
      if (match) {
        try {
          const res = await fetch(`/api/public/branding?slug=${match[1]}`);
          const json = await res.json();
          if (json.data) setBranding(json.data);
        } catch (e) {}
      }
    };
    fetchBranding();
  }, [callbackUrl]);

  // Map NextAuth error codes to human-readable messages
  const authErrorMap: Record<string, string> = {
    OAuthAccountNotLinked: "This email is already used with a different sign-in method.",
    invalid_client: "Google sign-in is not configured. Please use email & password.",
    AccessDenied: "Access denied.",
    Verification: "Sign-in link is invalid or has expired.",
    CredentialsSignin: "Incorrect email or password.",
  };

  useEffect(() => {
    if (errorParam) {
      setMessage({ type: "error", text: authErrorMap[errorParam] ?? `Sign-in error: ${errorParam}` });
    }
  }, [errorParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setMessage(null);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (result?.ok) {
      router.push(callbackUrl);
    } else {
      setMessage({ type: "error", text: result?.error || "Incorrect email or password." });
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (form.password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Registration failed." });
      setLoading(false);
      return;
    }

    // Auto sign in after successful registration
    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (result?.ok) {
      router.push(callbackUrl);
    } else {
      setMessage({ type: "success", text: "Account created! Please sign in." });
      setTab("signin");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 px-4">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-14 w-auto object-contain mx-auto mb-4" />
          ) : (
            <div 
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30 text-white font-bold"
              style={branding ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` } : { background: "linear-gradient(to bottom right, #6366f1, #9333ea)" }}
            >
              <span className="text-2xl">{branding?.brandName ? branding.brandName[0] : "💪"}</span>
            </div>
          )}
          <h1 className="text-2xl font-black text-white">{branding?.brandName || "CortexFit"}</h1>
          <p className="text-white/50 text-sm mt-1">Smart Gym Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(["signin", "register"] as const).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => { setTab(t); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Error / Success message */}
          {message && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === "error"
                ? "bg-red-500/10 border border-red-500/20 text-red-300"
                : "bg-green-500/10 border border-green-500/20 text-green-300"
            }`}>
              {message.text}
            </div>
          )}

          {tab === "signin" ? (
            <>
              {/* Google Sign In */}
              <button
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 transition-all hover:shadow-lg disabled:opacity-60 mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Credentials form */}
              <form onSubmit={handleCredentialsSignIn} className="space-y-3">
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className={inputClass}
                />
                <div className="relative">
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  id="signin-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                id="register-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                className={inputClass}
              />
              <input
                id="register-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="Email address"
                className={inputClass}
              />
              <div className="relative">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password (min 8 characters)"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create Account →"}
              </button>
            </form>
          )}

          {/* Footer links */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition">
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Privacy note */}
        {!branding?.whiteLabelEnabled && (
          <p className="text-center text-white/20 text-xs mt-4">
            By signing in, you agree to CortexFit&apos;s Terms of Service and Privacy Policy.
          </p>
        )}
      </div>
    </div>
  );
}
