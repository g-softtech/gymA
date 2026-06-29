"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Trainer {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  bio: string;
  hourlyRate: number | null;
  totalBookings: number;
  hasProfile: boolean;
  showOnWebsite: boolean;
  title: string | null;
  yearsOfExperience: number | null;
  publicPhotoUrl: string | null;
}

interface Props {
  tenantId: string;
  trainers: Trainer[];
}

export default function TrainerManager({ tenantId, trainers: initialTrainers }: Props) {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [showPromote, setShowPromote] = useState(false);
  const [email, setEmail] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Public Profile Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trainer>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePromote = async () => {
    setError("");
    setSuccess("");
    if (!email) { setError("Email is required."); return; }
    setLoading(true);
    try {
      // First find the user by email via the existing users debug endpoint won't work in prod
      // We need to promote by email — find user first
      const searchRes = await fetch(`/api/admin/find-user?email=${encodeURIComponent(email)}&secret=${encodeURIComponent("")}`);

      // Use promote endpoint logic
      const res = await fetch("/api/admin/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
          bio,
          hourlyRate: hourlyRate || null,
          tenantId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to promote trainer.");
      } else {
        setSuccess(`${email} has been promoted to Trainer!`);
        setEmail("");
        setSpecialties("");
        setBio("");
        setHourlyRate("");
        setShowPromote(false);
        router.refresh();
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (t: Trainer) => {
    setEditingId(t.id);
    setEditForm({
      showOnWebsite: t.showOnWebsite,
      title: t.title ?? "",
      yearsOfExperience: t.yearsOfExperience ?? null,
      specialties: t.specialties,
      bio: t.bio,
      publicPhotoUrl: t.publicPhotoUrl ?? "",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setEditForm({ ...editForm, publicPhotoUrl: data.url });
      } else {
        alert("Image upload failed");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProfile = async (tId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trainers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tId,
          showOnWebsite: editForm.showOnWebsite,
          title: editForm.title || null,
          yearsOfExperience: editForm.yearsOfExperience ? parseInt(editForm.yearsOfExperience as any) : null,
          specialties: typeof editForm.specialties === "string" 
             ? (editForm.specialties as string).split(",").map(s => s.trim()).filter(Boolean)
             : editForm.specialties,
          bio: editForm.bio || null,
          publicPhotoUrl: editForm.publicPhotoUrl || null,
        }),
      });
      if (res.ok) {
        router.refresh();
        setEditingId(null);
        setSuccess("Trainer profile updated!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        alert("Failed to save profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Promote form */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-foreground">Add Trainer</h2>
          <button
            onClick={() => setShowPromote(!showPromote)}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            {showPromote ? "Cancel" : "+ Add Trainer"}
          </button>
        </div>

        {showPromote && (
          <div className="space-y-4 pt-2">
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Member Email (to promote)</label>
                <input
                  type="email"
                  placeholder="trainer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Hourly Rate (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Weight Training, Cardio, Yoga"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
                <input
                  type="text"
                  placeholder="Short trainer bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handlePromote}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
            >
              {loading ? "Promoting..." : "Promote to Trainer"}
            </button>
          </div>
        )}
      </div>

      {/* Trainers list */}
      {trainers.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="font-medium">No trainers yet</p>
          <p className="text-sm mt-1">Promote existing members to trainer role above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trainers.map((t) => (
            <div key={t.id} className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {t.publicPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.publicPhotoUrl} alt={t.name} className="w-14 h-14 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold uppercase shrink-0">
                      {t.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground text-lg flex items-center gap-2">
                      {t.name}
                      {t.showOnWebsite && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">Public</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.title ?? "Trainer"} • {t.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                  <div className="text-sm text-muted-foreground font-medium">
                    ₦{t.hourlyRate?.toLocaleString() ?? "—"}/hr • {t.totalBookings} booking{t.totalBookings !== 1 ? "s" : ""}
                  </div>
                  <button
                    onClick={() => editingId === t.id ? setEditingId(null) : startEditing(t)}
                    className="text-sm text-indigo-600 font-semibold hover:underline"
                  >
                    {editingId === t.id ? "Cancel Editing" : "Edit Public Profile"}
                  </button>
                </div>
              </div>

              {editingId === t.id && (
                <div className="border-t border-border bg-muted p-5 space-y-4">
                  <h3 className="font-semibold text-foreground mb-2">Public Profile Settings</h3>
                  
                  <div className="flex items-center gap-3 mb-4 bg-card text-card-foreground p-3 rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id={`public-${t.id}`}
                      checked={editForm.showOnWebsite}
                      onChange={(e) => setEditForm({ ...editForm, showOnWebsite: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor={`public-${t.id}`} className="text-sm font-medium text-foreground">
                      Show on Public Website
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Public Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Head Coach, Yoga Instructor"
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Years of Experience</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={editForm.yearsOfExperience || ""}
                        onChange={(e) => setEditForm({ ...editForm, yearsOfExperience: e.target.value as any })}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Specialties (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Strength, HIIT"
                        value={Array.isArray(editForm.specialties) ? editForm.specialties.join(", ") : editForm.specialties || ""}
                        onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value as any })}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Public Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="w-full border border-border bg-card text-card-foreground rounded-lg px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {uploadingImage && <span className="text-xs text-indigo-500 mt-1 block">Uploading...</span>}
                      {editForm.publicPhotoUrl && !uploadingImage && (
                        <span className="text-xs text-emerald-600 mt-1 block">✓ Image uploaded</span>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Public Bio</label>
                      <textarea
                        rows={3}
                        placeholder="Short marketing bio..."
                        value={editForm.bio || ""}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => saveProfile(t.id)}
                      disabled={loading || uploadingImage}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm transition shadow-sm"
                    >
                      {loading ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
