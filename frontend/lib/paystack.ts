import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function initializePaystackTransaction(data: {
  amount: number; // in smallest currency unit (kobo/cents)
  email: string;
  reference: string;
  currency: "NGN" | "USD";
  callback_url?: string;
}) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!result.status) {
    throw new Error(result.message || "Failed to initialize Paystack transaction");
  }

  return result.data; // contains authorization_url, access_code, reference
}

export function verifyPaystackSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) return false;
  
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");
    
  return hash === signature;
}
