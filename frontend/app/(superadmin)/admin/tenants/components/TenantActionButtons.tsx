"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { resetSandboxAction, deleteSandboxAction } from "../../actions/sandbox";
import { Loader2, RefreshCcw, Trash2 } from "lucide-react";

export default function TenantActionButtons({ tenantId, currentStatus, isDemo }: { tenantId: string, currentStatus: string, isDemo?: boolean }) {
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

  async function handleSandboxAction(action: "reset" | "delete") {
    if (!confirm(`Are you sure you want to ${action} this sandbox? This cannot be undone.`)) return;
    
    setLoading(true);
    try {
      if (action === "reset") {
        await resetSandboxAction(tenantId);
      } else {
        await deleteSandboxAction(tenantId);
      }
    } catch (err: any) {
      alert(err.message || `Failed to ${action} sandbox`);
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

      {isDemo && (
        <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
          <button
            onClick={() => handleSandboxAction("reset")}
            disabled={loading}
            title="Reset Sandbox Data"
            className="p-1.5 rounded-md text-amber-500 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSandboxAction("delete")}
            disabled={loading}
            title="Delete Sandbox"
            className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
