"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DomainData {
  customDomain: string | null;
  domainVerified: boolean;
  verificationToken: string | null;
  dnsVerifiedAt: string | null;
}

export function DomainManagerClient({
  slug,
  initialData,
}: {
  slug: string;
  initialData: DomainData;
}) {
  const [data, setData] = useState<DomainData>(initialData);
  const [loading, setLoading] = useState(false);
  const [inputDomain, setInputDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Auto-poll verification status every 15 seconds if pending
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (data.customDomain && !data.domainVerified) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/admin/domains");
          const json = await res.json();
          if (json.data && json.data.domainVerified !== data.domainVerified) {
            setData(json.data);
            if (json.data.domainVerified) {
              setSuccess("Domain successfully verified!");
            }
          }
        } catch (e) {
          // Silent fail on background poll
        }
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [data.customDomain, data.domainVerified]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: inputDomain }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to add domain");
      }

      setData(result.data);
      setInputDomain("");
      setSuccess("Domain added! Please configure your DNS settings.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/domains/verify", {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Verification request failed");
      }

      if (result.verified) {
        setSuccess("Domain successfully verified!");
        const freshRes = await fetch("/api/admin/domains");
        const freshData = await freshRes.json();
        setData(freshData.data);
        router.refresh();
      } else {
        setError("DNS records not found yet. It can take up to 48 hours for DNS to fully propagate globally.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${data.customDomain}? Your public site will instantly stop routing to it.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: data.customDomain }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to remove domain");
      }

      setData({
        customDomain: null,
        domainVerified: false,
        verificationToken: null,
        dnsVerifiedAt: null,
      });
      setSuccess("Domain removed successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-medium">
          {success}
        </div>
      )}

      {/* STATE 1: No Domain */}
      {!data.customDomain && (
        <form onSubmit={handleAddDomain} className="p-6 bg-card text-card-foreground border border-border rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">Connect a Domain</h2>
          <p className="text-muted-foreground text-sm mb-5">
            Enter the exact domain you want to use (e.g., powergym.com or app.powergym.com). Do not include http:// or www.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              required
              value={inputDomain}
              onChange={(e) => setInputDomain(e.target.value)}
              placeholder="powergym.com"
              className="flex-1 px-4 py-2 bg-muted border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputDomain}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Adding..." : "Add Domain"}
            </button>
          </div>
        </form>
      )}

      {/* STATE 2: Pending DNS Instructions */}
      {data.customDomain && !data.domainVerified && (
        <div className="p-6 bg-card text-card-foreground border border-amber-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Pending Verification
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                  Pending
                </span>
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Please add the following DNS records to your domain provider (GoDaddy, Namecheap, Route53, etc.) for <strong className="text-foreground">{data.customDomain}</strong>.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border mb-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Type</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Name / Host</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Value / Target</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* A Record */}
                <tr className="bg-card text-card-foreground">
                  <td className="px-4 py-3 font-mono text-muted-foreground">A</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">@</td>
                  <td className="px-4 py-3 font-mono text-foreground font-medium">76.76.21.21</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => copyToClipboard("76.76.21.21")} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">Copy</button>
                  </td>
                </tr>
                {/* CNAME if it's a subdomain (e.g., app.powergym.com) - we just show standard A record above, but Vercel requires TXT for verification sometimes */}
                {data.verificationToken && (
                  <tr className="bg-card text-card-foreground">
                    <td className="px-4 py-3 font-mono text-muted-foreground">TXT</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">_vercel</td>
                    <td className="px-4 py-3 font-mono text-foreground font-medium truncate max-w-[200px]">{data.verificationToken}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => copyToClipboard(data.verificationToken!)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">Copy</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Checking..." : "Verify DNS Now"}
            </button>
            <span className="text-xs text-muted-foreground">
              We are also checking automatically every 15 seconds.
            </span>
          </div>
        </div>
      )}

      {/* STATE 3: Verified Active Domain */}
      {data.customDomain && data.domainVerified && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
              Domain Active
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                Verified
              </span>
            </h2>
            <p className="text-emerald-700 text-sm mt-1">
              Your public website is securely routed and live on the internet.
            </p>
            <a 
              href={`https://${data.customDomain}`} 
              target="_blank" 
              className="mt-3 inline-flex items-center gap-2 text-emerald-800 font-semibold text-sm hover:underline"
            >
              https://{data.customDomain} ↗
            </a>
            {data.dnsVerifiedAt && (
              <p className="text-xs text-emerald-600/70 mt-2">
                Last checked: {new Date(data.dnsVerifiedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-emerald-800 bg-emerald-200/50 px-2.5 py-1 rounded-lg">
              SSL Managed by Vercel
            </span>
          </div>
        </div>
      )}

      {/* STATE 4: Danger Zone */}
      {data.customDomain && (
        <div className="p-6 bg-card text-card-foreground border border-red-100 rounded-2xl shadow-sm mt-8">
          <h2 className="text-base font-semibold text-red-900 mb-1">Danger Zone</h2>
          <p className="text-red-500 text-sm mb-4">
            Removing this domain will instantly detach it from your gym. Visitors to this domain will see a 404 page.
          </p>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="px-4 py-2 bg-destructive/10 text-destructive border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {loading ? "Removing..." : "Remove Domain"}
          </button>
        </div>
      )}
    </div>
  );
}
