"use client";

import { useState } from "react";
import { resetDemoEnvironment } from "../actions/demo";

export function DemoResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async () => {
    if (!confirm("Are you sure you want to completely wipe and rebuild the Live Demo environment? This cannot be undone.")) return;
    
    setIsResetting(true);
    setStatus("idle");
    
    try {
      const result = await resetDemoEnvironment();
      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setErrorMsg(result.error || "Unknown error occurred.");
      }
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <button 
        onClick={handleReset}
        disabled={isResetting}
        className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {isResetting ? "Reseeding Database..." : "Reset Demo Environment"}
      </button>
      
      {status === "success" && <p className="text-emerald-500 text-xs mt-2 font-medium">Demo successfully rebuilt!</p>}
      {status === "error" && <p className="text-destructive text-xs mt-2 font-medium">{errorMsg}</p>}
    </div>
  );
}
