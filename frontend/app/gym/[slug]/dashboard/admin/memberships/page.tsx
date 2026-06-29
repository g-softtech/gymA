"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  durationDays: number;
  isActive: boolean;
  features: string[];
  featured: boolean;
}

export default function MembershipsPage({ params }: { params: { slug: string } }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", currency: "NGN", durationDays: "30",
    isActive: true, featured: false, features: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const res = await fetch("/api/admin/memberships/plans");
    const data = await res.json();
    if (res.ok) {
      setPlans(data.plans || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      durationDays: parseInt(formData.durationDays),
      features: formData.features.split(",").map(f => f.trim()).filter(f => f)
    };

    const res = await fetch("/api/admin/memberships/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setShowModal(false);
      fetchPlans();
    } else {
      alert("Error saving plan");
    }
    setSubmitting(false);
  };

  const toggleActive = async (planId: string, currentStatus: boolean) => {
    await fetch(`/api/admin/memberships/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    fetchPlans();
  };

  if (loading) return <div className="p-8">Loading plans...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Membership Plans</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className={`p-6 border rounded-lg shadow-sm ${!plan.isActive ? 'opacity-50' : 'bg-card text-card-foreground'}`}>
            <h3 className="text-xl font-semibold mb-2">{plan.name} {plan.featured && '⭐'}</h3>
            <p className="text-muted-foreground mb-4 h-12 overflow-hidden">{plan.description}</p>
            <div className="text-2xl font-bold mb-4">{plan.currency} {plan.price}</div>
            <div className="text-sm text-muted-foreground mb-4">Duration: {plan.durationDays} days</div>
            
            <button
              onClick={() => toggleActive(plan.id, plan.isActive)}
              className={`w-full py-2 rounded-md ${plan.isActive ? 'bg-destructive/10 text-destructive hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
            >
              {plan.isActive ? "Disable Plan" : "Enable Plan"}
            </button>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted rounded-lg">
            No membership plans found. Create one to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Membership Plan</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <input required type="text" className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full border rounded p-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input required type="number" step="0.01" className="w-full border rounded p-2" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select className="w-full border rounded p-2" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (Days)</label>
                <input required type="number" className="w-full border rounded p-2" value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Features (comma separated)</label>
                <input type="text" className="w-full border rounded p-2" placeholder="Gym Access, Pool, Classes" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="featured" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} />
                <label htmlFor="featured" className="text-sm font-medium">Highlight as Featured Plan</label>
              </div>
              <div className="flex gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-md hover:bg-muted">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
