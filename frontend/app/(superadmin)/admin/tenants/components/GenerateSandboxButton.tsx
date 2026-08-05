"use client";

import { useState } from "react";
import { generateSandboxAction } from "../../actions/sandbox";
import { Copy, Loader2, Sparkles, X, User, ArrowRight } from "lucide-react";

export default function GenerateSandboxButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const res = await generateSandboxAction(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate sandbox");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Generate Sandbox
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {result ? "Sandbox Ready" : "Generate Sandbox"}
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {result ? (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-4 flex items-start gap-3">
                    <div className="text-2xl mt-0.5">🚀</div>
                    <div>
                      <h3 className="font-bold">Sandbox Environment Created!</h3>
                      <p className="text-sm text-emerald-600/80 mt-1">
                        A fully populated, isolated instance for <strong>{result.tenant.name}</strong> is ready for demonstration.
                      </p>
                    </div>
                  </div>

                  <form action="/api/sandbox/impersonate" method="POST">
                    <input type="hidden" name="email" value={result.adminEmail} />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-indigo-500/25 transition-all"
                    >
                      Open Sandbox <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground">
                    You will be instantly logged in as the Gym Owner. Use the persona switcher inside the app to change roles.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-500/10 text-red-500 text-sm px-4 py-3 rounded-lg border border-red-500/20">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-foreground">
                      Gym Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="gymName"
                      required
                      placeholder="e.g., Titan Performance"
                      className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-foreground">
                        Logo URL <span className="text-muted-foreground font-normal">(Optional)</span>
                      </label>
                      <input
                        name="logoUrl"
                        placeholder="https://..."
                        className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-foreground">
                        Primary Color <span className="text-muted-foreground font-normal">(Optional)</span>
                      </label>
                      <input
                        name="primaryColor"
                        placeholder="#3b82f6"
                        className="w-full bg-background text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    This will automatically seed the environment with members, trainers, membership plans, and scheduled classes.
                  </p>

                  <div className="pt-4 border-t border-border flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Generate Data
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
