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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `cortexfit/logos/${slug}`);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to upload image");

      setData({ ...data, logoUrl: result.url });
      setSuccess("Logo uploaded successfully! Make sure to save branding.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
              
              {data.logoUrl && (
                <div className="mb-3 relative inline-block">
                  <img src={data.logoUrl} alt="Logo Preview" className="h-16 w-auto object-contain rounded border border-gray-200 bg-gray-50" />
                  <button
                    type="button"
                    onClick={() => setData({ ...data, logoUrl: "" })}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                    title="Remove Logo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingLogo ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Image from Device (Max 4.5MB)
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG with transparent background recommended. Max size 5MB.</p>
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
