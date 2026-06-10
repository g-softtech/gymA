"use client";

import { usePaystackPayment } from "react-paystack";
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
  planName,
  planId,
  tenantSlug,
  userId,
}: CheckoutButtonProps) {
  const router = useRouter();

  const config = {
    reference: `gym_${planId}_${new Date().getTime()}`,
    email,
    amount: amount * 100, // Paystack uses kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      /**
       * custom_fields are forwarded to Paystack webhook events.
       * The webhook handler (/api/payments/webhook) reads plan_id and user_id
       * to activate the subscription server-to-server — reliable even if the
       * browser closes before the onSuccess callback fires.
       */
      custom_fields: [
        { display_name: "Plan", variable_name: "plan_name", value: planName },
        { display_name: "Plan ID", variable_name: "plan_id", value: planId },
        { display_name: "User ID", variable_name: "user_id", value: userId },
      ],
    },
  };

  const initializePayment = usePaystackPayment(config);

  /**
   * onSuccess is the client-side fast path.
   * Even if this fails, the Paystack webhook will eventually activate
   * the subscription server-to-server.
   */
  const onSuccess = async (reference: { reference: string }) => {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.reference,
          planId,
          tenantSlug,
        }),
      });

      if (res.ok) {
        router.push(`/gym/${tenantSlug}/dashboard/member?welcome=1`);
      } else {
        // Subscription will be activated by webhook — inform user and redirect
        router.push(
          `/gym/${tenantSlug}/dashboard/member?notice=payment_processing`
        );
      }
    } catch {
      // Same — webhook will handle it
      router.push(
        `/gym/${tenantSlug}/dashboard/member?notice=payment_processing`
      );
    }
  };

  const onClose = () => {
    // User closed the popup without completing payment — do nothing
  };

  return (
    <button
      id="paystack-checkout-btn"
      onClick={() => initializePayment({ onSuccess, onClose })}
      className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-150 mt-2 shadow-md hover:shadow-lg"
    >
      Pay ₦{amount.toLocaleString()} with Paystack
    </button>
  );
}