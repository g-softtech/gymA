"use client";

import { usePaystackPayment } from "react-paystack";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SaaSCheckoutButtonProps {
  email: string;
  amount: number;
  planName: string;
  tenantId: string;
  className?: string;
  children: React.ReactNode;
}

export default function SaaSCheckoutButton({
  email,
  amount,
  planName,
  tenantId,
  className = "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition",
  children,
}: SaaSCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const config = {
    reference: `saas_${planName.toLowerCase()}_${new Date().getTime()}`,
    email,
    amount: amount * 100, // Paystack uses kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      custom_fields: [
        { display_name: "Payment Type", variable_name: "payment_type", value: "saas" },
        { display_name: "Plan Name", variable_name: "plan_name", value: planName },
        { display_name: "Tenant ID", variable_name: "tenant_id", value: tenantId },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (paymentRef: { reference: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/verify-saas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: paymentRef.reference }),
      });
      if (res.ok) {
        alert("Payment successful! Your upgrade is complete.");
      } else {
        alert("Payment processing... The dashboard will update shortly.");
      }
    } catch {
      alert("Payment processing... The dashboard will update shortly.");
    }
    router.refresh();
    setLoading(false);
  };

  const onClose = () => {
    // User closed the popup without completing payment — do nothing
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        initializePayment({ onSuccess, onClose });
      }}
      disabled={loading}
      className={className + (loading ? " opacity-50 cursor-not-allowed" : "")}
    >
      {loading ? "Processing..." : children}
    </button>
  );
}
