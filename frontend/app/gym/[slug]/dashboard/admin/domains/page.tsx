import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DomainManagerClient } from "./DomainManagerClient";
import { verifyTenantEntitlement } from "@/lib/tenant";
import { LockedFeatureOverlay } from "@/components/admin/LockedFeatureOverlay";

export default async function DomainManagementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();



  const settings = await prisma.tenantSettings.findFirst({
    where: { tenant: { slug } },
    select: {
      customDomain: true,
      domainVerified: true,
      verificationToken: true,
      dnsVerifiedAt: true,
      subscriptionPlan: true,
      tenantId: true,
    },
  });

  if (!settings) {
    redirect(`/gym/${slug}/dashboard/admin`);
  }

  const isLocked = await verifyTenantEntitlement(settings.tenantId, "hasCustomDomain");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {isLocked ? (
        <LockedFeatureOverlay featureName="Custom Domains" />
      ) : (
        <DomainManagerClient 
          slug={slug} 
          initialData={{
            customDomain: settings.customDomain,
            domainVerified: settings.domainVerified,
            verificationToken: settings.verificationToken,
            dnsVerifiedAt: settings.dnsVerifiedAt?.toISOString() || null,
          }} 
        />
      )}
    </div>
  );
}
