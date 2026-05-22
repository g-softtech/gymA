"use client";

import { usePaystackPayment } from "react-paystack";
import { useRouter } from "next/navigation";

export default function CheckoutButton({
  email,
  amount,
  planName,
  tenantSlug,
}: {
  email: string;
  amount: number;
  planName: string;
  tenantSlug: string;
}) {
  const router = useRouter();

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: amount * 100, // Paystack calculates in the lowest currency unit (e.g., kobo/cents)
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    alert(`Payment successful! Reference: ${reference.reference}`);
    // Redirect the user to their member dashboard after payment
    router.push(`/gym/${tenantSlug}/dashboard/member`);
  };

  const onClose = () => {
    alert("Payment cancelled.");
  };

  return (
    <button
      onClick={() => initializePayment(onSuccess, onClose)}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
    >
      Pay with Paystack
    </button>
  );
}