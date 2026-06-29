import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutButton from "@/components/CheckoutButton";

import { RENEWAL_WINDOW_DAYS } from "@/lib/billing/pricingConfig";

export default async function MemberBillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) notFound();

  // Fetch Member Profile
  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!memberProfile) return null;

  // 1. Fetch current active subscription
  const currentActiveSub = await prisma.subscription.findFirst({
    where: {
      memberId: memberProfile.id,
      tenantId: tenant.id,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: { endDate: "desc" },
  });

  // 2. Fetch all active membership plans for this gym
  const availablePlans = await prisma.membershipPlan.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    orderBy: { price: "asc" },
  });

  const activePlanId = currentActiveSub?.planId;
  const activePlanPrice = currentActiveSub?.plan.price ? Number(currentActiveSub.plan.price) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manage Subscription</h1>
        <p className="mt-2 text-muted-foreground">View your current plan and explore upgrades.</p>
      </div>

      {/* Current Subscription Status */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-black text-foreground">
                {currentActiveSub ? currentActiveSub.plan.name : "None"}
              </h2>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${currentActiveSub ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {currentActiveSub ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            {currentActiveSub && (
              <p className="text-sm text-muted-foreground mt-2">
                Expires on: {new Date(currentActiveSub.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans for Upgrade */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const planPrice = Number(plan.price);
            const isCurrent = plan.id === activePlanId;
            const isUpgrade = planPrice > activePlanPrice;
            const isDowngrade = planPrice < activePlanPrice;
            const isLateral = !isCurrent && !isUpgrade && !isDowngrade;
            
            // Check if near expiry based on configurable window
            let isNearExpiry = false;
            if (currentActiveSub) {
              const daysLeft = (new Date(currentActiveSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              isNearExpiry = daysLeft <= RENEWAL_WINDOW_DAYS;
            }

            const canUpgrade = isUpgrade;
            const canRenew = (isCurrent || isLateral) && isNearExpiry;

            return (
              <div 
                key={plan.id} 
                className={`bg-card text-card-foreground rounded-2xl p-6 border-2 transition-all ${isCurrent ? "border-indigo-600 shadow-md shadow-indigo-100" : "border-border hover:border-border shadow-sm"}`}
              >
                {isCurrent && (
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4">
                    CURRENT PLAN
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-foreground">₦{planPrice.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">/{plan.durationDays} days</span>
                </div>
                
                {/* Features List (Truncated for simplicity, ideally we use getEntitlementFeatures here) */}
                <ul className="mt-4 space-y-2 mb-6">
                  {(plan.features as string[])?.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 shrink-0">✓</span> {f}
                    </li>
                  ))}
                  {((plan.features as string[])?.length > 3) && (
                    <li className="text-xs text-muted-foreground italic">...and more</li>
                  )}
                </ul>

                <div className="mt-auto pt-4">
                  {isCurrent && !canRenew ? (
                    <button disabled className="w-full py-2.5 rounded-lg bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed">
                      Active Plan
                    </button>
                  ) : isDowngrade ? (
                    <button disabled className="w-full py-2.5 rounded-lg border-2 border-border text-muted-foreground font-bold text-sm cursor-not-allowed">
                      Downgrade Unavailable
                    </button>
                  ) : isLateral && !canRenew ? (
                    <button disabled className="w-full py-2.5 rounded-lg border-2 border-border text-muted-foreground font-bold text-sm cursor-not-allowed">
                      Lateral Move Blocked
                    </button>
                  ) : (
                    <CheckoutButton
                      email={session.user.email!}
                      amount={planPrice}
                      planName={plan.name}
                      planId={plan.id}
                      tenantSlug={tenant.slug}
                      userId={session.user.id}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
