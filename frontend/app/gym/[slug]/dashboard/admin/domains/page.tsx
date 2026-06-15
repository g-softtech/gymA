import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DomainManagerClient } from "./DomainManagerClient";

export default async function DomainManagementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect(`/gym/${slug}/dashboard`);
  }

  const settings = await prisma.tenantSettings.findFirst({
    where: { tenant: { slug } },
    select: {
      customDomain: true,
      domainVerified: true,
      verificationToken: true,
      dnsVerifiedAt: true,
      subscriptionPlan: true,
    },
  });

  if (!settings) {
    redirect(`/gym/${slug}/dashboard/admin`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ─────────────────────────────────────────────────────────────────
          PHASE 12 FEATURE GATE ENFORCEMENT
          ───────────────────────────────────────────────────────────────── */}
      {!settings.subscriptionPlan || (settings.subscriptionPlan !== "PRO" && settings.subscriptionPlan !== "ENTERPRISE") ? (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Domains are a Premium Feature</h2>
          <p className="mt-2 text-gray-600 max-w-md mx-auto">
            Upgrade your gym to the PRO plan to connect your own custom domain and build your brand.
          </p>
          <div className="mt-6">
            <a 
              href={`/gym/${slug}/dashboard/admin/billing`}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition"
            >
              Upgrade to PRO
            </a>
          </div>
        </div>
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
