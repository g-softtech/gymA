"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stat { value: string; label: string }
interface Service { icon?: string; title: string; description: string; imageUrl?: string; scheduleInfo?: string; }
interface GalleryItem { imageUrl: string; caption?: string; category?: string; }
interface Testimonial { name: string; role?: string; quote: string; avatarUrl?: string; rating?: number }
interface FeatureItem { icon?: string; title: string; description: string }

type ActiveTab = "layout" | "stats" | "features" | "activities" | "testimonials" | "gallery";

const DEFAULT_LAYOUT = [
  { id: "hero", label: "Hero (Top)" },
  { id: "stats", label: "Stats Bar" },
  { id: "about", label: "About Us" },
  { id: "features", label: "Feature Highlights" },
  { id: "activities", label: "Activities & Programs" },
  { id: "trainers", label: "Our Trainers" },
  { id: "plans", label: "Membership Plans" },
  { id: "testimonials", label: "Testimonials" },
  { id: "gallery", label: "Facility Gallery" },
  { id: "blog", label: "Blog Posts" },
  { id: "contact", label: "Contact & Location" },
];

export default function ContentEditorPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("layout");
  const [stats, setStats] = useState<Stat[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [homepageLayout, setHomepageLayout] = useState<string[]>(DEFAULT_LAYOUT.map(l => l.id));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

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
          if (s.homepageLayout && Array.isArray(s.homepageLayout) && s.homepageLayout.length > 0) {
            setHomepageLayout(s.homepageLayout);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uploadFile = async (file: File): Promise<string> => {
    if (file.size > 4.5 * 1024 * 1024) {
      throw new Error("Image is too large. Please upload an image smaller than 4.5MB.");
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    
    let data;
    try {
      data = await res.json();
    } catch (err) {
      throw new Error("Upload failed. The image might be too large or the server is busy.");
    }
    
    if (!res.ok || !data.url) {
      throw new Error(data?.error || "Upload failed");
    }
    return data.url;
  };

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
          homepageLayout: homepageLayout,
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
    { id: "layout", label: "Layout", icon: "📐" },
    { id: "stats", label: "Stats", icon: "📊" },
    { id: "features", label: "Features", icon: "⚡" },
    { id: "activities", label: "Activities", icon: "🏋️" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "gallery", label: "Gallery", icon: "🖼️" },
  ];

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const removeBtnCls = "shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 text-sm font-bold transition-colors";
  const addBtnCls = "flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors mt-2";

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Page Content</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the sections that appear on your public gym page — stats, services, testimonials, and more.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8 overflow-x-auto">
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

      {/* ── Layout Builder ── */}
      {activeTab === "layout" && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Homepage Layout Builder</h2>
            <p className="text-xs text-muted-foreground">Reorder the sections on your public gym website. Drag and drop is supported (use up/down buttons).</p>
          </div>
          <div className="space-y-2">
            {homepageLayout.map((id, index) => {
              const def = DEFAULT_LAYOUT.find(d => d.id === id) || { id, label: id };
              return (
                <div key={id} className="flex items-center gap-3 bg-muted border border-border p-3 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => {
                        const newLayout = [...homepageLayout];
                        [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
                        setHomepageLayout(newLayout);
                      }}
                      className="text-muted-foreground hover:text-indigo-600 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === homepageLayout.length - 1}
                      onClick={() => {
                        const newLayout = [...homepageLayout];
                        [newLayout[index + 1], newLayout[index]] = [newLayout[index], newLayout[index + 1]];
                        setHomepageLayout(newLayout);
                      }}
                      className="text-muted-foreground hover:text-indigo-600 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 font-medium text-sm text-foreground">
                    {def.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHomepageLayout(homepageLayout.filter(l => l !== id));
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          {DEFAULT_LAYOUT.filter(d => !homepageLayout.includes(d.id)).length > 0 && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Sections</h3>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_LAYOUT.filter(d => !homepageLayout.includes(d.id)).map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setHomepageLayout([...homepageLayout, d.id])}
                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-indigo-100 font-medium"
                  >
                    + Add {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stats ── */}
      {activeTab === "stats" && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Social Proof Numbers</h2>
            <p className="text-xs text-muted-foreground">e.g. &ldquo;500+ Members&rdquo;, &ldquo;10 Expert Trainers&rdquo;. Shown in a bold strip below the hero.</p>
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
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Feature Highlights</h2>
            <p className="text-xs text-muted-foreground">Short benefits/USPs shown in a grid. E.g. &ldquo;24/7 Access&rdquo;, &ldquo;AI Coach&rdquo;, &ldquo;Modern Equipment&rdquo;.</p>
          </div>
          {features.map((feat, i) => (
            <div key={i} className="flex gap-3 items-start border-b border-border pb-4 last:border-0 last:pb-0">
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

      {/* ── Activities / Programs ── */}
      {activeTab === "activities" && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Activities / Programs</h2>
            <p className="text-xs text-muted-foreground">Displayed as cards with optional images. E.g. &ldquo;Strength Training&rdquo;, &ldquo;HIIT Classes&rdquo;.</p>
          </div>
          {services.map((svc, i) => (
            <div key={i} className="flex gap-3 items-start border-b border-border pb-5 last:border-0 last:pb-0">
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
                    placeholder="Activity name"
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
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id={`svc-schedule-${i}`}
                    className={inputCls}
                    placeholder="Schedule info (e.g. Mon/Wed/Fri 6AM)"
                    value={svc.scheduleInfo ?? ""}
                    onChange={(e) => {
                      const updated = [...services];
                      updated[i] = { ...updated[i], scheduleInfo: e.target.value };
                      setServices(updated);
                    }}
                  />
                  <div className="relative">
                    <input
                      type="file"
                      id={`svc-img-file-${i}`}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        if (!e.target.files?.[0]) return;
                        const key = `svc-${i}`;
                        setUploadingImage(key);
                        try {
                          const url = await uploadFile(e.target.files[0]);
                          const updated = [...services];
                          updated[i] = { ...updated[i], imageUrl: url };
                          setServices(updated);
                        } catch (err: any) {
                          alert(err.message || "Failed to upload");
                        } finally {
                          setUploadingImage(null);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className={`${inputCls} flex items-center text-muted-foreground overflow-hidden bg-muted`}>
                      {uploadingImage === `svc-${i}` ? "Uploading..." : svc.imageUrl ? "Image Uploaded ✓" : "Upload Image (Max 4.5MB)"}
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={removeBtnCls}
                onClick={() => setServices(services.filter((_, j) => j !== i))}
                aria-label="Remove activity"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            id="add-activity-btn"
            className={addBtnCls}
            onClick={() => setServices([...services, { icon: "", title: "", description: "" }])}
          >
            + Add Activity
          </button>
        </div>
      )}

      {/* ── Testimonials ── */}
      {activeTab === "testimonials" && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Member Testimonials</h2>
            <p className="text-xs text-muted-foreground">Display social proof quotes from your happiest members.</p>
          </div>
          {testimonials.map((t, i) => (
            <div key={i} className="flex gap-3 items-start border-b border-border pb-5 last:border-0 last:pb-0">
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
                  <div className="relative">
                    <input
                      type="file"
                      id={`test-avatar-file-${i}`}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={async (e) => {
                        if (!e.target.files?.[0]) return;
                        const key = `test-${i}`;
                        setUploadingImage(key);
                        try {
                          const url = await uploadFile(e.target.files[0]);
                          const updated = [...testimonials];
                          updated[i] = { ...updated[i], avatarUrl: url };
                          setTestimonials(updated);
                        } catch (err: any) {
                          alert(err.message || "Failed to upload");
                        } finally {
                          setUploadingImage(null);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className={`${inputCls} flex items-center text-muted-foreground overflow-hidden bg-muted`}>
                      {uploadingImage === `test-${i}` ? "Uploading..." : t.avatarUrl ? "Image Uploaded ✓" : "Upload Avatar (Max 4.5MB)"}
                    </div>
                  </div>
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
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Facility Gallery</h2>
            <p className="text-xs text-muted-foreground">Upload images of your gym facilities and categorize them.</p>
          </div>
          {gallery.map((item, i) => (
            <div key={i} className="flex gap-3 items-center border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative col-span-1">
                  <input
                    type="file"
                    id={`gal-img-file-${i}`}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      const key = `gal-${i}`;
                      setUploadingImage(key);
                      try {
                        const url = await uploadFile(e.target.files[0]);
                        const updated = [...gallery];
                        updated[i] = { ...updated[i], imageUrl: url };
                        setGallery(updated);
                      } catch (err: any) {
                        alert(err.message || "Failed to upload");
                      } finally {
                        setUploadingImage(null);
                        e.target.value = "";
                      }
                    }}
                  />
                  <div className={`${inputCls} flex items-center text-muted-foreground overflow-hidden bg-muted`}>
                    {uploadingImage === `gal-${i}` ? "Uploading..." : item.imageUrl ? "Image Uploaded ✓" : "Upload Image (Max 4.5MB)"}
                  </div>
                </div>
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
                <select
                  id={`gallery-category-${i}`}
                  className={inputCls}
                  value={item.category ?? ""}
                  onChange={(e) => {
                    const updated = [...gallery];
                    updated[i] = { ...updated[i], category: e.target.value };
                    setGallery(updated);
                  }}
                >
                  <option value="">No Category</option>
                  <option value="Weight Area">Weight Area</option>
                  <option value="Cardio Zone">Cardio Zone</option>
                  <option value="Yoga Studio">Yoga Studio</option>
                  <option value="Boxing Area">Boxing Area</option>
                  <option value="General">General</option>
                </select>
              </div>
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border"
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
