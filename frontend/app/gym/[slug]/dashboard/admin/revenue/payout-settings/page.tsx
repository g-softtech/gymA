import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PayoutSettingsClient from "./PayoutSettingsClient";

export default async function PayoutSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/gym/${slug}/dashboard/admin/revenue/payout-settings`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      settings: true,
    }
  });

  if (!tenant) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payout Settings</h1>
        <p className="text-muted-foreground mt-1">Connect your bank account to receive member payments directly.</p>
      </div>
      
      <PayoutSettingsClient 
        settings={tenant.settings ? {
          paystackSubaccountCode: tenant.settings.paystackSubaccountCode,
          paystackBankName: tenant.settings.paystackBankName,
          paystackAccountNumberLast4: tenant.settings.paystackAccountNumberLast4,
          paystackAccountName: tenant.settings.paystackAccountName,
          paystackConnectionStatus: tenant.settings.paystackConnectionStatus,
          paystackConnectedAt: tenant.settings.paystackConnectedAt ? tenant.settings.paystackConnectedAt.toISOString() : null,
        } : null}
      />
    </div>
  );
}
