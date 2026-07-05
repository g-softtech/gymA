import Link from "next/link";

export default function BillingBlockedPage() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Account Restricted</h1>

      <p style={{ marginTop: 12, maxWidth: 500, marginInline: "auto" }}>
        Your subscription is currently inactive, past due, or suspended.
        Access to the platform has been restricted until billing is restored.
      </p>

      <div style={{ marginTop: 24 }}>
        <Link href="/billing">
          <button style={{ padding: "10px 16px", cursor: "pointer" }}>
            Manage Billing
          </button>
        </Link>
      </div>
    </div>
  );
}
