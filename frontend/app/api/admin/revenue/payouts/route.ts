import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { getTenantContextFromSession, requireAdmin, noTenantContext } from "@/lib/tenant";
import { listBanks, resolveAccountNumber, createPaystackSubaccount } from "@/lib/paystack";
import { requireRecentAuth, StepUpRequiredError } from "@/lib/auth/requireRecentAuth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const banks = await listBanks();
    return NextResponse.json(banks);
  } catch (err: any) {
    console.error("[GET /api/admin/revenue/payouts]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const ctx = getTenantContextFromSession(session);
    const roleErr = requireAdmin(ctx);
    if (roleErr) return roleErr;
    if (!ctx?.tenantId) return noTenantContext();

    const { bankCode, bankName, accountNumber } = await req.json();

    if (!bankCode || !bankName || !accountNumber) {
      return NextResponse.json({ error: "Missing bank details" }, { status: 400 });
    }

    // --- STEP UP AUTHENTICATION ---
    try {
      if (!session) throw new Error("Unauthorized");
      await requireRecentAuth(session, 15);
    } catch (e) {
      if (e instanceof StepUpRequiredError) {
        return NextResponse.json({ 
          error: "STEP_UP_REQUIRED", 
          reason: e.reason 
        }, { status: 403 });
      }
      throw e;
    }
    // ------------------------------

    // 1. Resolve Account Name with Paystack
    let accountName = "";
    try {
      const resolution = await resolveAccountNumber(bankCode, accountNumber);
      accountName = resolution.account_name;
    } catch (e: any) {
      return NextResponse.json({ error: `Could not verify account: ${e.message}` }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { name: true }
    });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    // 2. Create Paystack Subaccount (0% commission)
    let subaccountCode = "";
    try {
      const subaccount = await createPaystackSubaccount({
        business_name: tenant.name,
        settlement_bank: bankCode,
        account_number: accountNumber
      });
      subaccountCode = subaccount.subaccount_code;
    } catch (e: any) {
      return NextResponse.json({ error: `Could not create subaccount: ${e.message}` }, { status: 400 });
    }

    // 3. Save to Tenant Settings safely (No plaintext account number)
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: ctx.tenantId },
      create: {
        tenantId: ctx.tenantId,
        paystackSubaccountCode: subaccountCode,
        paystackBankCode: bankCode,
        paystackBankName: bankName,
        paystackAccountNumberLast4: accountNumber.slice(-4),
        paystackAccountName: accountName,
        paystackConnectedAt: new Date(),
        paystackConnectionStatus: "connected"
      },
      update: {
        paystackSubaccountCode: subaccountCode,
        paystackBankCode: bankCode,
        paystackBankName: bankName,
        paystackAccountNumberLast4: accountNumber.slice(-4),
        paystackAccountName: accountName,
        paystackConnectedAt: new Date(),
        paystackConnectionStatus: "connected"
      }
    });

    // 4. Audit Log (No sensitive data)
    await prisma.actionRegistry.create({
      data: {
        tenantId: ctx.tenantId,
        actionType: "PAYOUT_ACCOUNT_CONNECTED",
        targetId: ctx.userId || "system",
        context: JSON.stringify({ bankName, accountName }),
        status: "COMPLETED",
        executedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        paystackSubaccountCode: settings.paystackSubaccountCode,
        paystackBankName: settings.paystackBankName,
        paystackAccountNumberLast4: settings.paystackAccountNumberLast4,
        paystackAccountName: settings.paystackAccountName,
        paystackConnectionStatus: settings.paystackConnectionStatus,
        paystackConnectedAt: settings.paystackConnectedAt
      }
    });

  } catch (err: any) {
    console.error("[POST /api/admin/revenue/payouts]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
