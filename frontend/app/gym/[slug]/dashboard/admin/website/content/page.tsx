"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stat { value: string; label: string }
interface Service { icon?: string; title: string; description: string; imageUrl?: string }
interface GalleryItem { imageUrl: string; caption?: string }
interface Testimonial { name: string; role?: string; quote: string; avatarUrl?: string; rating?: number }
interface FeatureItem { icon?: string; title: string; description: string }

type ActiveTab = "stats" | "features" | "services" | "testimonials" | "gallery";

export default function ContentEditorPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("stats");
  const [stats, setStats] = useState<Stat[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings;
        if (s) {
          if (s.statsData) setStats(s.statsData);
          if (s.featuresData) setFeatures(s.featuresData);
          if (s.servicesData) setServices(s.servicesData);
          if (s.testimonialData) setTestimonials(s.testimonialData);
          if (s.galleryData) setGallery(s.galleryData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statsData: stats,
          featuresData: features,
          servicesData: services,
          testimonialData: testimonials,
          galleryData: gallery,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  const TABS: { id: ActiveTab; label: string; icon: string }[] = [
    { id: "stats", label: "Stats", icon: "📊" },
    { id: "features", label: "Features", icon: "⚡" },
    { id: "services", label: "Services", icon: "🏋️" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "gallery", label: "Gallery", icon: "🖼️" },
  ];

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const removeBtnCls = "shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 text-sm font-bold transition-colors";
  const addBtnCls = "flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors mt-2";

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Page Content</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage the sections that appear on your public gym page — stats, services, testimonials, and more.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center"
            style={
              activeTab === tab.id
                ? { background: "white", color: "#4F46E5", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                : { color: "#6b7280" }
            }
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Stats ── */}
      {activeTab === "stats" && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">Social Proof Numbers</h2>
            <p className="text-xs text-gray-400">e.g. &ldquo;500+ Members&rdquo;, &ldquo;10 Expert Trainers&rdquo;. Shown in a bold strip below the hero.</p>
          </div>
          {stats.map((stat, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  id={`stat-value-${i}`}
                  className={inputCls}
                  placeholder="500+"
                  value={stat.value}
                  onChange={(e) => {
                    const updated = [...stats];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setStats(updated);
                  }}
                />
                <input
                  id={`stat-label-${i}`}
                  className={inputCls}
                  placeholder="Happy Members"
                  value={stat.label}
                  onChange={(e) => {
                    const updated = [...stats];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setStats(updated);
                  }}
                />
              </div>
              <button
                className={removeBtnCls}
                onClick={() => setStats(stats.filter((_, j) => j !== i))}
                type="button"
                aria-label="Remove stat"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            id="add-stat-btn"
            className={addBtnCls}
            onClick={() => setStats([...stats, { value: "", label: "" }])}
          >
            + Add Stat
          </button>
        </div>
      )}

      {/* ── Features ── */}
      {activeTab === "features" && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">Feature Highlights</h2>
            <p className="text-xs text-gray-400">Short benefits/USPs shown in a grid. E.g. &ldquo;24/7 Access&rdquo;, &ldquo;AI Coach&rdquo;, &ldquo;Modern Equipment&rdquo;.</p>
          </div>
          {features.map((feat, i) => (
            <div key={i} className="flex gap-3 items-start border-b border-gray-50 pb-4 last:border-0 last:pb-0">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id={`feat-icon-${i}`}
                    className={inputCls}
                    placeholder="🏋️ (emoji icon)"
                    value={feat.icon ?? ""}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[i] = { ...updated[i], icon: e.target.value };
                      setFeatures(updated);
                    }}
                  />
                  <input
                    id={`feat-title-${i}`}
                    className={inputCls}
                    placeholder="Feature title"
                    value={feat.title}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[i] = { ...updated[i], title: e.target.value };
                      setFeatures(updated);
                    }}
                  />
                </div>
                <textarea
                  id={`feat-desc-${i}`}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Short description of this feature…"
                  value={feat.description}
                  onChange={(e) => {
                    const updated = [...features];
                    updated[i] = { ...updated[i], description: e.target.value };
                    setFeatures(updated);
                  }}
                />
              </div>
              <button
                type="button"
                className={removeBtnCls}
                onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                aria-label="Remove feature"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            id="add-feature-btn"
            className={addBtnCls}
            onClick={() => setFeatures([...features, { icon: "", title: "", description: "" }])}
          >
            + Add Feature
          </button>
        </div>
      )}

      {/* ── Services ── */}
      {activeTab === "services" && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">Services / Programmes</h2>
            <p className="text-xs text-gray-400">Displayed as cards with optional images. E.g. &ldquo;Personal Training&rdquo;, &ldquo;Group Fitness&rdquo;.</p>
          </div>
          {services.map((svc, i) => (
            <div key={i} className="flex gap-3 items-start border-b border-gray-50 pb-5 last:border-0 last:pb-0">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id={`svc-icon-${i}`}
                    className={inputCls}
                    placeholder="🏋️ (emoji icon)"
                    value={svc.icon ?? ""}
                    onChange={(e) => {
                      const updated = [...services];
                      updated[i] = { ...updated[i], icon: e.target.value };
                      setServices(updated);
                    }}
                  />
                  <input
                    id={`svc-title-${i}`}
                    className={inputCls}
                    placeholder="Service name"
                    value={svc.title}
                    onChange={(e) => {
                      const updated = [...services];
                      updated[i] = { ...updated[i], title: e.target.value };
                      setServices(updated);
                    }}
                  />
                </div>
                <textarea
                  id={`svc-desc-${i}`}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Brief description…"
                  value={svc.description}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i] = { ...updated[i], description: e.target.value };
                    setServices(updated);
                  }}
                />
                <input
                  id={`svc-img-${i}`}
                  className={inputCls}
                  placeholder="Image URL (optional)"
                  value={svc.imageUrl ?? ""}
                  onChange={(e) => {
                    const updated = [...services];
                    updated[i] = { ...updated[i], imageUrl: e.target.value };
                    setServices(updated);
                  }}
                />
              </div>
              <button
                type="button"
                className={removeBtnCls}
                onClick={() => setServices(services.filter((_, j) => j !== i))}
                aria-label="Remove service"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            id="add-service-btn"
            className={addBtnCls}
            onClick={() => setServices([...services, { icon: "", title: "", description: "" }])}
          >
            + Add Service
          </button>
        </div>
      )}

      {/* ── Testimonials ── */}
      {activeTab === "testimonials" && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">Member Testimonials</h2>
            <p className="text-xs text-gray-400">Display social proof quotes from your happiest members.</p>
          </div>
          {testimonials.map((t, i) => (
            <div key={i} className="flex gap-3 items-start border-b border-gray-50 pb-5 last:border-0 last:pb-0">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id={`test-name-${i}`}
                    className={inputCls}
                    placeholder="Member name"
                    value={t.name}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setTestimonials(updated);
                    }}
                  />
                  <input
                    id={`test-role-${i}`}
                    className={inputCls}
                    placeholder="Role / title (e.g. Member since 2023)"
                    value={t.role ?? ""}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[i] = { ...updated[i], role: e.target.value };
                      setTestimonials(updated);
                    }}
                  />
                </div>
                <textarea
                  id={`test-quote-${i}`}
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Their testimonial quote…"
                  value={t.quote}
                  onChange={(e) => {
                    const updated = [...testimonials];
                    updated[i] = { ...updated[i], quote: e.target.value };
                    setTestimonials(updated);
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id={`test-avatar-${i}`}
                    className={inputCls}
                    placeholder="Avatar image URL (optional)"
                    value={t.avatarUrl ?? ""}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[i] = { ...updated[i], avatarUrl: e.target.value };
                      setTestimonials(updated);
                    }}
                  />
                  <select
                    id={`test-rating-${i}`}
                    className={inputCls}
                    value={t.rating ?? ""}
                    onChange={(e) => {
                      const updated = [...testimonials];
                      updated[i] = { ...updated[i], rating: e.target.value ? parseInt(e.target.value) : undefined };
                      setTestimonials(updated);
                    }}
                  >
                    <option value="">Rating (optional)</option>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{"★".repeat(r)} ({r}/5)</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className={removeBtnCls}
                onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}
                aria-label="Remove testimonial"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            id="add-testimonial-btn"
            className={addBtnCls}
            onClick={() => setTestimonials([...testimonials, { name: "", quote: "" }])}
          >
            + Add Testimonial
          </button>
        </div>
      )}

      {/* ── Gallery ── */}
      {activeTab === "gallery" && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">Photo Gallery</h2>
            <p className="text-xs text-gray-400">Add image URLs to build a masonry gallery of your gym facilities.</p>
          </div>
          {gallery.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  id={`gallery-url-${i}`}
                  className={inputCls}
                  placeholder="Image URL"
                  value={item.imageUrl}
                  onChange={(e) => {
                    const updated = [...gallery];
                    updated[i] = { ...updated[i], imageUrl: e.target.value };
                    setGallery(updated);
                  }}
                />
                <input
                  id={`gallery-caption-${i}`}
                  className={inputCls}
                  placeholder="Caption (optional)"
                  value={item.caption ?? ""}
                  onChange={(e) => {
                    const updated = [...gallery];
                    updated[i] = { ...updated[i], caption: e.target.value };
                    setGallery(updated);
                  }}
                />
              </div>
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100"
                />
              )}
              <button
                type="button"
                className={removeBtnCls}
                onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
                aria-label="Remove gallery image"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            id="add-gallery-btn"
            className={addBtnCls}
            onClick={() => setGallery([...gallery, { imageUrl: "" }])}
          >
            + Add Image
          </button>
        </div>
      )}

      {/* Save button */}
      <button
        id="save-content-btn"
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Content Changes"}
      </button>
    </div>
  );
}
