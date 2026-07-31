"use client";

import { useState } from "react";

interface StepUpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actionName: string;
  returnUrl: string;
}

export function StepUpModal({ isOpen, onOpenChange, actionName, returnUrl }: StepUpModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendMagicLink = async () => {
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/step-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, returnUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification link");
      }

      setEmailSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border shadow-2xl rounded-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">Confirm your identity</h2>
          <p className="text-muted-foreground text-sm mb-6">
            For your security, please verify your identity before continuing with this sensitive action.
          </p>
          
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm mb-4 border border-red-500/20">
              {error}
            </div>
          )}

          {emailSent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✉️
              </div>
              <h3 className="text-lg font-medium">Check your email</h3>
              <p className="text-muted-foreground text-sm">
                We've sent a secure verification link to your email address. Click it to continue.
              </p>
              <button 
                onClick={() => onOpenChange(false)}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition"
                disabled={isSending}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendMagicLink} 
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send Verification Link"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
