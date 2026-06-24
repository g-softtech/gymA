"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TenantActionButtons({ tenantId, currentStatus }: { tenantId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Are you sure you want to change this gym's status to ${newStatus}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/tenants/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "PENDING" && (
        <>
          <button
            onClick={() => handleStatusChange("APPROVED")}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            id={`approve-gym-${tenantId}`}
          >
            Approve
          </button>
          <button
            onClick={() => handleStatusChange("REJECTED")}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}

      {currentStatus === "APPROVED" && (
        <button
          onClick={() => handleStatusChange("SUSPENDED")}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          Suspend
        </button>
      )}

      {(currentStatus === "SUSPENDED" || currentStatus === "REJECTED") && (
        <button
          onClick={() => handleStatusChange("APPROVED")}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  );
}
