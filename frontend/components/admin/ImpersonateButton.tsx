"use client";

import { usePathname } from "next/navigation";

export default function ImpersonateButton({ userId }: { userId: string }) {
  const pathname = usePathname();
  const isSandbox = pathname.startsWith("/sandbox");

  if (!isSandbox) return null;

  const handleImpersonate = async () => {
    try {
      await fetch("/api/sandbox/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      window.location.reload();
    } catch (e) {
      console.error("Failed to impersonate", e);
    }
  };

  return (
    <button
      onClick={handleImpersonate}
      className="text-xs text-indigo-600 font-semibold hover:underline bg-indigo-50 px-2 py-1 rounded"
    >
      Login as User
    </button>
  );
}
