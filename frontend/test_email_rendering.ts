import { renderEmail } from "./lib/email/emailRenderer";
import { CORTEXFIT_BRAND, EmailType } from "./lib/email/types";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const outDir = path.join(__dirname, ".email_preview");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  const tests: { type: EmailType; payload: any; filename: string }[] = [
    {
      type: "MAGIC_LINK",
      payload: {
        recipientName: "Gbemi",
        magicUrl: "https://cortexfit.vercel.app/api/auth/callback/email?token=123",
        isNewSignup: true,
      },
      filename: "magic_link_signup.html",
    },
    {
      type: "MEMBER_WELCOME",
      payload: {
        memberId: "usr_123",
        memberName: "Sarah O.",
        gymName: "Titan Fitness",
        gymSlug: "titan-fitness",
        magicUrl: "https://cortexfit.vercel.app/api/auth/callback/email?token=456",
        planName: "Premium Membership",
      },
      filename: "member_welcome.html",
    },
    {
      type: "GYM_OWNER_WELCOME",
      payload: {
        ownerName: "John Doe",
        gymName: "Iron Forge",
        gymSlug: "iron-forge",
        dashboardUrl: "https://cortexfit.vercel.app/gym/iron-forge/dashboard/admin",
      },
      filename: "gym_owner_welcome.html",
    },
    {
      type: "PAYMENT_RECEIPT",
      payload: {
        memberName: "Alex Morgan",
        receiptNumber: "RCPT-88291",
        transactionReference: "txn_77281",
        planName: "Annual Pass",
        amountFormatted: "₦ 120,000",
        paymentDate: "Oct 25, 2025",
        subscriptionStart: "Oct 25, 2025",
        subscriptionEnd: "Oct 25, 2026",
        gymName: "Titan Fitness",
      },
      filename: "payment_receipt.html",
    }
  ];

  for (const test of tests) {
    try {
      const html = renderEmail(test.type, test.payload, CORTEXFIT_BRAND);
      fs.writeFileSync(path.join(outDir, test.filename), html, "utf-8");
      console.log(`✅ Rendered ${test.type} -> ${test.filename}`);
    } catch (err: any) {
      console.error(`❌ Failed to render ${test.type}:`, err.message);
    }
  }
}

main().catch(console.error);
