"use client";

export default function ImpersonateBanner({ userName }: { userName: string }) {
  const handleRevert = async () => {
    try {
      await fetch("/api/sandbox/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revert" }),
      });
      window.location.reload();
    } catch (e) {
      console.error("Failed to revert", e);
    }
  };

  return (
    <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-50">
      <p className="text-sm font-medium">
        🎭 You are currently impersonating <strong>{userName}</strong>.
      </p>
      <button 
        onClick={handleRevert}
        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-semibold transition"
      >
        Return to Admin
      </button>
    </div>
  );
}
