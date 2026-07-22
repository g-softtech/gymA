"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  email: string;
  amount: number;
  planName: string;
  planId: string;
  tenantSlug: string;
  userId: string;
}

export default function CheckoutButton({
  email,
  amount,
  planId,
  tenantSlug,
  userId,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    // Sandbox Simulation Bypass
    if (userId.startsWith("guest-")) {
      setTimeout(() => {
        alert("Sandbox Mode: Simulated successful payment!");
        window.location.href = `/sandbox/${tenantSlug}/member?welcome=1`;
      }, 800);
      return;
    }

    try {
      const initRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(window.location.pathname.startsWith("/sandbox/") ? { "x-guest-session-tenant-slug": tenantSlug } : {})
        },
        body: JSON.stringify({ itemType: "MEMBERSHIP", itemId: planId }),
      });
      let data;
      try {
        data = await initRes.json();
      } catch (e) {
        throw new Error(`Server returned an invalid response (Status: ${initRes.status})`);
      }

      if (!initRes.ok || !data.accessCode) {
        alert(data?.error || "Failed to initialize payment");
        setLoading(false);
        return;
      }

      // 2. Open Paystack Popup using access_code
      let PaystackPop;
      try {
        // @ts-ignore
        const PaystackModule = await import("@paystack/inline-js");
        PaystackPop = PaystackModule.default || (PaystackModule as any).PaystackPop;
      } catch (err) {
        console.warn("Failed to dynamically import paystack, falling back to window", err);
        PaystackPop = (window as any).PaystackPop;
      }

      if (typeof PaystackPop === "undefined" || !PaystackPop) {
        alert("Payment system is still loading. Please check your internet connection or disable adblockers, then try again.");
        setLoading(false);
        return;
      }

      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!paystackKey) {
        alert("Payment gateway is not configured. Please contact the gym administrator.");
        setLoading(false);
        return;
      }

      const safeEmail = (email && email.includes("@")) ? email.trim() : `guest_${userId.substring(0, 8)}@sandbox.local`;
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: paystackKey,
        access_code: data.accessCode,
        reference: data.reference,
        email: safeEmail,
        amount: Math.round(amount * 100),
        onSuccess: async (transaction: any) => {
          // 3. Verify server-side
          try {
            const isSandbox = window.location.pathname.startsWith("/sandbox/");
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                ...(isSandbox ? { "x-guest-session-tenant-slug": tenantSlug } : {})
              },
              body: JSON.stringify({
                reference: transaction.reference,
                planId, // kept for backward compatibility, but fulfillment relies on reference
                tenantSlug,
              }),
            });

            const baseRedirectUrl = isSandbox ? `/sandbox/${tenantSlug}` : `/gym/${tenantSlug}`;

            if (verifyRes.ok) {
              window.location.href = `${baseRedirectUrl}/dashboard/member?welcome=1`;
            } else {
              const errData = await verifyRes.json().catch(() => ({}));
              alert(`Payment verification failed: ${errData.error || 'Please contact support.'}`);
              window.location.href = `${baseRedirectUrl}/dashboard/member?notice=payment_processing`;
            }
          } catch (err: any) {
            alert(`Payment processing error: ${err.message || 'Please contact support.'}`);
            window.location.href = `/gym/${tenantSlug}/dashboard/member?notice=payment_processing`;
          }
        },
        onCancel: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      console.error("Payment setup error:", err);
      const errString = err instanceof Error ? err.message : JSON.stringify(err);
      alert(`Payment Error Details: ${errString}`);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        id="paystack-checkout-btn"
        disabled={loading}
        onClick={handlePayment}
        className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:opacity-70 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-150 mt-2 shadow-md hover:shadow-lg"
      >
        {loading ? "Starting secure checkout..." : `Pay ₦${amount.toLocaleString()} securely`}
      </button>
    </>
  );
}