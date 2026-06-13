"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const FONT_OPTIONS = ["Inter", "Poppins", "Roboto", "Outfit", "Nunito", "Lato", "Montserrat"];

interface Settings {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  darkMode?: boolean;
}

function ImageUploader({
  label,
  value,
  onChange,
  recommended,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  recommended: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File must be less than 2MB");
      return;
    }
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "cortexfit_branding");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
        {value ? (
          <div className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="max-w-full max-h-full object-contain p-1" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg border border-gray-200 border-dashed bg-white flex items-center justify-center shrink-0 text-xs text-gray-400">
            None
          </div>
        )}

        <div className="flex-1 w-full space-y-3">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100 disabled:opacity-50 transition-colors cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1.5">{uploading ? "Uploading..." : recommended}</p>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Fallback for backward compatibility */}
          <div>
            <input
              type="url"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or paste an existing URL here..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [settings, setSettings] = useState<Settings>({
    primaryColor: "#6366F1",
    secondaryColor: "#8B5CF6",
    accentColor: "#A78BFA",
    fontFamily: "Inter",
    darkMode: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  const primary = settings.primaryColor || "#6366F1";
  const secondary = settings.secondaryColor || "#8B5CF6";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-500 text-sm mt-1">
          Customize your gym&apos;s visual identity across the dashboard and public website.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSave} className="lg:col-span-3 space-y-6">

          {/* Logo */}
          <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Logo & Favicon</h2>
            
            <ImageUploader
              label="Logo"
              value={settings.logoUrl ?? ""}
              onChange={(url) => setSettings((s) => ({ ...s, logoUrl: url }))}
              recommended="PNG or SVG, recommended 200×60px, max 2MB"
            />

            <ImageUploader
              label="Favicon"
              value={settings.faviconUrl ?? ""}
              onChange={(url) => setSettings((s) => ({ ...s, faviconUrl: url }))}
              recommended="ICO or PNG, exactly 32×32px, max 2MB"
            />
          </section>

          {/* Colors */}
          <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Brand Colors</h2>

            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "primaryColor", label: "Primary" },
                { key: "secondaryColor", label: "Secondary" },
                { key: "accentColor", label: "Accent" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`color-${key}`}
                      type="color"
                      value={(settings as Record<string, string>)[key] ?? "#6366F1"}
                      onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={(settings as Record<string, string>)[key] ?? ""}
                      onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                      placeholder="#6366F1"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Typography</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Family</label>
              <select
                id="font-family-select"
                value={settings.fontFamily ?? "Inter"}
                onChange={(e) => setSettings((s) => ({ ...s, fontFamily: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                <p className="text-xs text-gray-400">Apply dark theme to the dashboard</p>
              </div>
              <button
                id="dark-mode-toggle"
                type="button"
                onClick={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.darkMode ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    settings.darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Save */}
          <button
            id="save-branding-btn"
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Branding"}
          </button>
        </form>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Preview</p>
            <div
              className="rounded-2xl overflow-hidden shadow-xl border border-gray-100"
              style={{ fontFamily: settings.fontFamily ?? "Inter" }}
            >
              {/* Sidebar preview */}
              <div
                className="w-full p-4 flex flex-col gap-3"
                style={{ background: settings.darkMode ? "#0f0f1a" : "#ffffff" }}
              >
                {/* Logo area */}
                <div className="flex items-center gap-3 pb-3 border-b"
                  style={{ borderColor: settings.darkMode ? "#ffffff15" : "#f0f0f0" }}
                >
                  {settings.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logoUrl} alt="Logo" className="h-8 object-contain" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                    >
                      G
                    </div>
                  )}
                  <span
                    className="font-semibold text-sm"
                    style={{ color: settings.darkMode ? "#fff" : "#111" }}
                  >
                    My Gym
                  </span>
                </div>

                {/* Nav items */}
                {["Overview", "Members", "Revenue", "Website"].map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={
                      i === 0
                        ? { background: `${primary}20`, color: primary }
                        : { color: settings.darkMode ? "#9ca3af" : "#6b7280" }
                    }
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ background: i === 0 ? primary : "currentColor", opacity: i === 0 ? 1 : 0.3 }}
                    />
                    {item}
                  </div>
                ))}

                {/* CTA button preview */}
                <div className="mt-2 pt-3 border-t" style={{ borderColor: settings.darkMode ? "#ffffff15" : "#f0f0f0" }}>
                  <div
                    className="w-full py-2 rounded-lg text-white text-xs font-semibold text-center"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                  >
                    Sample Button
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Preview updates as you type
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
