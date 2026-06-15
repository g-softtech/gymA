"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BrandingData {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  brandName: string;
  whiteLabelEnabled: boolean;
}

export default function BrandingManagerClient({
  slug,
  initialData,
}: {
  slug: string;
  initialData: BrandingData & { subscriptionPlan?: string };
}) {
  const [data, setData] = useState<BrandingData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update branding");
      }

      setSuccess("Branding settings saved successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Editor Column */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo Section */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo Branding</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image URL</label>
              <input
                type="url"
                value={data.logoUrl}
                onChange={(e) => setData({ ...data, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">Must be a valid HTTPS image URL. PNG with transparent background recommended.</p>
            </div>
          </div>

          {/* Brand Name */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Name Override</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Brand Name</label>
              <input
                type="text"
                value={data.brandName}
                onChange={(e) => setData({ ...data, brandName: e.target.value })}
                placeholder="e.g. Power Gym Pro"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Color Theme Editor */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Theme</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={data.primaryColor}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={data.primaryColor}
                    onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={data.secondaryColor}
                    onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                    className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={data.secondaryColor}
                    onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={data.accentColor}
                    onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                    className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={data.accentColor}
                    onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* White-Label Mode Toggle */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  White-Label Mode
                  {!initialData.subscriptionPlan || initialData.subscriptionPlan !== "ENTERPRISE" ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded uppercase">Enterprise</span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded uppercase">Premium</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {!initialData.subscriptionPlan || initialData.subscriptionPlan !== "ENTERPRISE" 
                    ? "Upgrade to Enterprise to completely remove 'Powered by CortexFit' branding from your gym's public pages."
                    : "Completely remove 'Powered by CortexFit' branding from your gym's public pages and emails."}
                </p>
                {(!initialData.subscriptionPlan || initialData.subscriptionPlan !== "ENTERPRISE") && (
                  <a href={`/gym/${slug}/dashboard/admin/billing`} className="inline-block mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    Upgrade Plan &rarr;
                  </a>
                )}
              </div>
              
              <label className={`relative inline-flex items-center ${(!initialData.subscriptionPlan || initialData.subscriptionPlan !== "ENTERPRISE") ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={data.whiteLabelEnabled}
                  disabled={!initialData.subscriptionPlan || initialData.subscriptionPlan !== "ENTERPRISE"}
                  onChange={(e) => setData({ ...data, whiteLabelEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : "Save Branding"}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Preview</h2>
            
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: "#fafafa" }}>
              {/* Fake Navbar */}
              <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-3">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: data.primaryColor }}></div>
                )}
                <span className="font-bold text-gray-900">{data.brandName || "Your Gym Name"}</span>
              </div>
              
              {/* Fake Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                
                <button 
                  className="w-full py-2 rounded-lg text-white font-semibold text-sm transition-colors"
                  style={{ backgroundColor: data.primaryColor }}
                >
                  Primary Action
                </button>
                
                <button 
                  className="w-full py-2 rounded-lg text-white font-semibold text-sm transition-colors"
                  style={{ backgroundColor: data.secondaryColor }}
                >
                  Secondary Action
                </button>
              </div>

              {/* Fake Footer */}
              <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                {!data.whiteLabelEnabled ? (
                  <p className="text-xs text-gray-400">Powered by CortexFit</p>
                ) : (
                  <p className="text-xs text-gray-400">© 2026 {data.brandName || "Your Gym"}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
