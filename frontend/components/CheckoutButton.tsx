
"use client";

import { usePaystackPayment } from "react-paystack";
import { useRouter } from "next/navigation";

interface CheckoutButtonProps {
  email: string;
  amount: number;
  planName: string;
  planId: string;
  tenantSlug: string;
}

export default function CheckoutButton({
  email,
  amount,
  planName,
  planId,
  tenantSlug,
}: CheckoutButtonProps) {
  const router = useRouter();

  const config = {
    reference: `gym_${new Date().getTime()}`,
    email,
    amount: amount * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      custom_fields: [
        { display_name: "Plan", variable_name: "plan_name", value: planName },
        { display_name: "Plan ID", variable_name: "plan_id", value: planId },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: { reference: string }) => {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.reference, planId, tenantSlug }),
      });

      if (res.ok) {
        router.push(`/gym/${tenantSlug}/dashboard/member?welcome=1`);
      } else {
        const data = await res.json();
        alert(`Payment recorded but activation failed: ${data.error}. Please contact support.`);
      }
    } catch {
      alert("Payment was successful but we could not activate your plan. Please contact support.");
    }
  };

  const onClose = () => {};

  return (
    <button
      onClick={() => initializePayment({ onSuccess, onClose })}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
    >
      Pay ₦{amount.toLocaleString()} with Paystack
    </button>
  );
}