"use client";

import { useState, useEffect } from "react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Day = (typeof DAYS)[number];

interface OpeningHours {
  [key: string]: { open: string; close: string; closed?: boolean };
}

interface InfoSettings {
  name?: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  mapEmbedUrl?: string;
  openingHours?: OpeningHours;
}

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: "06:00", close: "22:00" },
  tuesday: { open: "06:00", close: "22:00" },
  wednesday: { open: "06:00", close: "22:00" },
  thursday: { open: "06:00", close: "22:00" },
  friday: { open: "06:00", close: "22:00" },
  saturday: { open: "08:00", close: "18:00" },
  sunday: { open: "08:00", close: "14:00", closed: false },
};

export default function BusinessInfoPage() {
  const [info, setInfo] = useState<InfoSettings>({ country: "Nigeria" });
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const { openingHours, ...rest } = data.settings;
          setInfo((prev) => ({ ...prev, ...rest }));
          if (openingHours) setHours(openingHours);
        }
        if (data.tenant?.name) {
          setInfo((prev) => ({ ...prev, name: data.tenant.name }));
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
        body: JSON.stringify({ ...info, openingHours: hours }),
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
    key: keyof InfoSettings,
    label: string,
    opts?: { placeholder?: string; type?: string; multiline?: boolean }
  ) => (
    <div key={key}>
      <label htmlFor={`field-${key}`} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </label>
      {opts?.multiline ? (
        <textarea
          id={`field-${key}`}
          rows={4}
          value={(info[key] as string) ?? ""}
          onChange={(e) => setInfo((s) => ({ ...s, [key]: e.target.value }))}
          placeholder={opts.placeholder}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      ) : (
        <input
          id={`field-${key}`}
          type={opts?.type ?? "text"}
          value={(info[key] as string) ?? ""}
          onChange={(e) => setInfo((s) => ({ ...s, [key]: e.target.value }))}
          placeholder={opts?.placeholder}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Business Info</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This information appears on your public gym page and in member communications.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity */}
        <section className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Identity</h2>
          {field("name", "Gym Name", { placeholder: "Iron Forge Fitness" })}
          {field("tagline", "Tagline", { placeholder: "Forge your best self" })}
          {field("description", "About / Description", {
            placeholder: "Tell your story — who you are, what you offer, and why members love training here.",
            multiline: true,
          })}
        </section>

        {/* Contact */}
        <section className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            {field("phone", "Phone Number", { placeholder: "+234 801 234 5678" })}
            {field("email", "Email Address", { type: "email", placeholder: "info@yourgym.com" })}
          </div>
        </section>

        {/* Location */}
        <section className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Location</h2>
          {field("address", "Street Address", { placeholder: "12 Fitness Avenue, Victoria Island" })}
          <div className="grid grid-cols-2 gap-4">
            {field("city", "City", { placeholder: "Lagos" })}
            {field("state", "State", { placeholder: "Lagos State" })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field("country", "Country", { placeholder: "Nigeria" })}
            {field("mapEmbedUrl", "Google Maps Embed URL", { placeholder: "https://maps.google.com/embed?..." })}
          </div>
        </section>

        {/* Opening Hours */}
        <section className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Opening Hours</h2>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <span className="text-sm font-medium text-foreground capitalize">{day}</span>
                </div>
                <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                  <input
                    id={`closed-${day}`}
                    type="checkbox"
                    checked={hours[day]?.closed ?? false}
                    onChange={(e) =>
                      setHours((h) => ({ ...h, [day]: { ...h[day], closed: e.target.checked } }))
                    }
                    className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                  />
                  Closed
                </label>
                {!hours[day]?.closed && (
                  <>
                    <input
                      id={`open-${day}`}
                      type="time"
                      value={hours[day]?.open ?? "06:00"}
                      onChange={(e) =>
                        setHours((h) => ({ ...h, [day]: { ...h[day], open: e.target.value } }))
                      }
                      className="border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-muted-foreground text-sm">–</span>
                    <input
                      id={`close-${day}`}
                      type="time"
                      value={hours[day]?.close ?? "22:00"}
                      onChange={(e) =>
                        setHours((h) => ({ ...h, [day]: { ...h[day], close: e.target.value } }))
                      }
                      className="border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </>
                )}
                {hours[day]?.closed && (
                  <span className="text-muted-foreground text-sm italic">Closed all day</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <button
          id="save-info-btn"
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Business Info"}
        </button>
      </form>
    </div>
  );
}
