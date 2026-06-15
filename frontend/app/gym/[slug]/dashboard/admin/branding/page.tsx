import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

import BrandingManagerClient from "./BrandingManagerClient";

export const metadata = {
  title: "Branding | Admin",
};

export default async function BrandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getAuthSession();



  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant!.id },
  });

  const brandingData = {
    brandName: settings?.brandName || tenant!.name,
    logoUrl: settings?.logoUrl || "",
    primaryColor: settings?.primaryColor || "#6366F1",
    secondaryColor: settings?.secondaryColor || "#8B5CF6",
    accentColor: settings?.accentColor || "#14B8A6",
    whiteLabelEnabled: settings?.whiteLabelEnabled || false,
    subscriptionPlan: settings?.subscriptionPlan || "FREE",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">White-Label Branding</h1>
        <p className="text-gray-500 text-sm mt-1">
          Customize how your gym looks to your members. Make the platform truly yours.
        </p>
      </div>

      <BrandingManagerClient slug={slug} initialData={brandingData} />
    </div>
  );
}
