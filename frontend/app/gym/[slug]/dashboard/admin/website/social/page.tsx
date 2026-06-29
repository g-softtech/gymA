"use client";

import { useState, useEffect } from "react";

interface SocialSettings {
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
}

const SOCIAL_FIELDS: {
  key: keyof SocialSettings;
  label: string;
  icon: string;
  placeholder: string;
  prefix?: string;
}[] = [
  {
    key: "instagramUrl",
    label: "Instagram",
    icon: "📸",
    placeholder: "https://instagram.com/yourgym",
  },
  {
    key: "facebookUrl",
    label: "Facebook",
    icon: "📘",
    placeholder: "https://facebook.com/yourgym",
  },
  {
    key: "twitterUrl",
    label: "Twitter / X",
    icon: "🐦",
    placeholder: "https://twitter.com/yourgym",
  },
  {
    key: "tiktokUrl",
    label: "TikTok",
    icon: "🎵",
    placeholder: "https://tiktok.com/@yourgym",
  },
  {
    key: "whatsappNumber",
    label: "WhatsApp Number",
    icon: "💬",
    placeholder: "+234 801 234 5678",
  },
  {
    key: "youtubeUrl",
    label: "YouTube",
    icon: "▶️",
    placeholder: "https://youtube.com/@yourgym",
  },
];

export default function SocialLinksPage() {
  const [social, setSocial] = useState<SocialSettings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSocial({
            instagramUrl: data.settings.instagramUrl ?? "",
            facebookUrl: data.settings.facebookUrl ?? "",
            twitterUrl: data.settings.twitterUrl ?? "",
            tiktokUrl: data.settings.tiktokUrl ?? "",
            whatsappNumber: data.settings.whatsappNumber ?? "",
            youtubeUrl: data.settings.youtubeUrl ?? "",
          });
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
        body: JSON.stringify(social),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  const filledCount = Object.values(social).filter(Boolean).length;

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Social Media</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add links to your gym&apos;s social profiles. They&apos;ll appear on your public page.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <div className="flex-1">
          <p className="text-sm font-semibold text-indigo-900">
            {filledCount} of {SOCIAL_FIELDS.length} profiles connected
          </p>
          <div className="mt-2 h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${(filledCount / SOCIAL_FIELDS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden divide-y divide-border">
          {SOCIAL_FIELDS.map(({ key, label, icon, placeholder }) => (
            <div key={key} className="flex items-center gap-4 px-5 py-4">
              <span className="text-2xl shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <label htmlFor={`social-${key}`} className="block text-sm font-medium text-foreground mb-1">
                  {label}
                </label>
                <input
                  id={`social-${key}`}
                  type={key === "whatsappNumber" ? "tel" : "url"}
                  value={social[key] ?? ""}
                  onChange={(e) => setSocial((s) => ({ ...s, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {social[key] && (
                <a
                  href={key === "whatsappNumber" ? `https://wa.me/${social[key]?.replace(/\D/g, "")}` : social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                >
                  Preview →
                </a>
              )}
            </div>
          ))}
        </div>

        <button
          id="save-social-btn"
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Social Links"}
        </button>
      </form>
    </div>
  );
}
