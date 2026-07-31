"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Building, Loader2, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { StepUpModal } from "@/components/security/StepUpModal";

interface Bank {
  name: string;
  code: string;
}

interface PayoutSettings {
  paystackSubaccountCode?: string | null;
  paystackBankName?: string | null;
  paystackAccountNumberLast4?: string | null;
  paystackAccountName?: string | null;
  paystackConnectionStatus?: string | null;
  paystackConnectedAt?: string | null;
}

export default function PayoutSettingsClient({ settings }: { settings: PayoutSettings | null }) {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const isConnected = settings?.paystackConnectionStatus === "connected";
  const [isEditing, setIsEditing] = useState(!isConnected);
  
  // Step-Up Auth State
  const [isStepUpModalOpen, setIsStepUpModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/revenue/payouts")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBanks(data.sort((a, b) => a.name.localeCompare(b.name)));
        }
      })
      .catch(() => setError("Failed to load banks."))
      .finally(() => setLoadingBanks(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!selectedBank || accountNumber.length < 10) {
      setError("Please select a valid bank and enter a 10-digit account number.");
      return;
    }

    setSubmitting(true);
    try {
      const bankName = banks.find(b => b.code === selectedBank)?.name;
      const res = await fetch("/api/admin/revenue/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode: selectedBank, bankName, accountNumber })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === "STEP_UP_REQUIRED") {
          setIsStepUpModalOpen(true);
          return;
        }
        throw new Error(data.error || "Failed to connect account");
      }
      
      setSuccess("Bank account connected successfully!");
      setIsEditing(false);
      router.refresh(); // Refresh server component data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepUpModal 
        isOpen={isStepUpModalOpen} 
        onOpenChange={setIsStepUpModalOpen} 
        actionName="connect_payout_account" 
        returnUrl={typeof window !== "undefined" ? window.location.href : ""} 
      />
      {/* Status Card */}
      <div className={`p-6 rounded-xl border ${isConnected ? 'bg-green-50/50 border-green-200' : 'bg-amber-50/50 border-amber-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isConnected ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {isConnected ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isConnected ? 'text-green-800' : 'text-amber-800'}`}>
              {isConnected ? 'Payouts Active' : 'Payouts Disconnected'}
            </h2>
            <p className={`text-sm mt-1 ${isConnected ? 'text-green-700' : 'text-amber-700'}`}>
              {isConnected 
                ? "Your member payments are currently being routed directly to your connected bank account. CortexFit deducts 0% commission."
                : "You must connect a bank account to receive member payments. Member checkout is blocked until an account is connected."}
            </p>
          </div>
        </div>
      </div>

      {/* Connected Details / Form */}
      <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <h3 className="font-bold flex items-center gap-2">
            <Landmark size={18} className="text-muted-foreground" /> 
            Settlement Account
          </h3>
        </div>
        
        <div className="p-6">
          {!isEditing && isConnected ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Bank Name</p>
                  <p className="font-semibold">{settings.paystackBankName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Account Number</p>
                  <p className="font-semibold">•••• {settings.paystackAccountNumberLast4}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Account Name</p>
                  <p className="font-semibold">{settings.paystackAccountName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Connected On</p>
                  <p className="font-semibold">
                    {settings.paystackConnectedAt ? new Date(settings.paystackConnectedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Change Bank Account
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                  {success}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Bank</label>
                <select 
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  disabled={loadingBanks || submitting}
                  required
                >
                  <option value="">{loadingBanks ? "Loading banks..." : "-- Select Bank --"}</option>
                  {banks.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Account Number</label>
                <input 
                  type="text"
                  maxLength={10}
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0123456789"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3 items-center">
                <button
                  type="submit"
                  disabled={submitting || loadingBanks || !selectedBank || accountNumber.length < 10}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Verifying..." : "Connect Account"}
                </button>
                
                {isConnected && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={submitting}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
