import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function initializePaystackTransaction(data: {
  amount: number; // in smallest currency unit (kobo/cents)
  email: string;
  reference: string;
  currency: "NGN" | "USD";
  callback_url?: string;
  metadata?: any;
  subaccount?: string;
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
    body: JSON.stringify({
      ...data,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'eft']
    }),
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

export async function listBanks(country: string = "nigeria") {
  const response = await fetch(`https://api.paystack.co/bank?country=${country}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });
  const result = await response.json();
  if (!result.status) throw new Error(result.message);
  return result.data;
}

export async function resolveAccountNumber(bankCode: string, accountNumber: string) {
  const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });
  const result = await response.json();
  if (!result.status) throw new Error(result.message);
  return result.data; // { account_number, account_name, bank_id }
}

export async function createPaystackSubaccount(data: {
  business_name: string;
  settlement_bank: string;
  account_number: string;
}) {
  const response = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      percentage_charge: 0, // CortexFit platform takes 0% commission
    }),
  });
  const result = await response.json();
  if (!result.status) throw new Error(result.message);
  return result.data; // { subaccount_code, ... }
}
