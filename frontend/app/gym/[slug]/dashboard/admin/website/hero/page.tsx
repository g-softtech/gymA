"use client";

import { useState, useEffect } from "react";

interface HeroData {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  bgImageUrl?: string;
  overlayOpacity?: number;
}

export default function HeroEditorPage() {
  const [hero, setHero] = useState<HeroData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setHero((h) => ({ ...h, bgImageUrl: data.url }));
      } else {
        alert("Image upload failed");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.heroData) {
          setHero(data.settings.heroData as HeroData);
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
        body: JSON.stringify({ heroData: hero }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  const field = (
    key: keyof HeroData,
    label: string,
    opts?: { placeholder?: string; type?: string; hint?: string; multiline?: boolean }
  ) => (
    <div key={key}>
      <label htmlFor={`field-${key}`} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {opts?.hint && <p className="text-xs text-gray-400 mb-1.5">{opts.hint}</p>}
      {opts?.multiline ? (
        <textarea
          id={`field-${key}`}
          rows={3}
          value={(hero[key] as string) ?? ""}
          onChange={(e) => setHero((h) => ({ ...h, [key]: e.target.value }))}
          placeholder={opts.placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      ) : (
        <input
          id={`field-${key}`}
          type={opts?.type ?? "text"}
          value={(hero[key] as string | number) ?? ""}
          onChange={(e) => {
            const val = opts?.type === "number" ? parseFloat(e.target.value) : e.target.value;
            setHero((h) => ({ ...h, [key]: val }));
          }}
          placeholder={opts?.placeholder}
          step={opts?.type === "number" ? "0.05" : undefined}
          min={opts?.type === "number" ? "0" : undefined}
          max={opts?.type === "number" ? "1" : undefined}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hero Section</h1>
        <p className="text-gray-500 text-sm mt-1">
          Customize the first thing visitors see on your public gym page.
        </p>
      </div>

      {/* Live preview */}
      <div
        className="rounded-2xl overflow-hidden mb-8 shadow-lg border border-gray-100"
        style={{ minHeight: 180 }}
      >
        <div
          className="relative flex flex-col items-center justify-center p-10 text-center"
          style={
            hero.bgImageUrl
              ? {
                  backgroundImage: `url(${hero.bgImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }
          }
        >
          {hero.bgImageUrl && (
            <div
              className="absolute inset-0"
              style={{ background: `rgba(0,0,0,${hero.overlayOpacity ?? 0.55})` }}
            />
          )}
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white drop-shadow mb-2">
              {hero.headline || "Your Gym Headline Here"}
            </h2>
            <p className="text-white/80 text-sm mb-4">
              {hero.subheadline || "Your subheadline or tagline goes here"}
            </p>
            <span className="inline-block px-5 py-2 bg-white/20 border border-white/30 text-white text-sm font-semibold rounded-xl backdrop-blur-sm">
              {hero.ctaText || "Get Started Today"} →
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Copy</h2>
          {field("headline", "Main Headline", {
            placeholder: "Forge Your Best Self",
            hint: "The large bold text at the top of the hero section.",
          })}
          {field("subheadline", "Subheadline / Tagline", {
            placeholder: "Premium fitness training in the heart of Lagos.",
            multiline: true,
          })}
          {field("ctaText", "Call-to-Action Button Text", {
            placeholder: "Join Today",
          })}
        </section>

        <section className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Background</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Image
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Upload an image to use as the hero background. Leave blank to use a gradient background from your brand colors.
            </p>
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
              {hero.bgImageUrl && !uploadingImage && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600 font-medium">✓ Uploaded</span>
                  <button
                    type="button"
                    onClick={() => setHero((h) => ({ ...h, bgImageUrl: undefined }))}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          {hero.bgImageUrl && (
            <div>
              <label htmlFor="field-overlayOpacity" className="block text-sm font-medium text-gray-700 mb-1">
                Dark Overlay Strength
              </label>
              <p className="text-xs text-gray-400 mb-1.5">
                Controls how dark the overlay is over your background image. 0 = fully transparent, 1 = fully black.
              </p>
              <input
                id="field-overlayOpacity"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={hero.overlayOpacity ?? 0.55}
                onChange={(e) =>
                  setHero((h) => ({ ...h, overlayOpacity: parseFloat(e.target.value) }))
                }
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Lighter</span>
                <span className="font-medium text-gray-600">{((hero.overlayOpacity ?? 0.55) * 100).toFixed(0)}%</span>
                <span>Darker</span>
              </div>
            </div>
          )}
        </section>

        <button
          id="save-hero-btn"
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Hero Section"}
        </button>
      </form>
    </div>
  );
}
