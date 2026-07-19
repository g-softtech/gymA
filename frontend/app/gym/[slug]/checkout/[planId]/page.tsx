import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import CheckoutButton from "@/components/CheckoutButton";
import { getEntitlementFeatures } from "@/lib/entitlements/registry";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string; planId: string }>;
}) {
  const { slug, planId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/checkout/${planId}`);
  }
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    include: { tenant: true },
  });

  if (!plan || plan.tenant.slug !== slug) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <Link
          href={`/gym/${slug}`}
          className="text-sm text-indigo-600 hover:underline mb-6 inline-block"
        >
          ← Back to plans
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
            {plan.tenant.name}
          </h2>
          <p className="text-2xl text-gray-900 mt-1 font-medium">{plan.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {plan.durationDays} day{plan.durationDays > 1 ? "s" : ""} access
          </p>
          <p className="text-4xl font-extrabold text-gray-900 mt-4">
            ₦{Number(plan.price).toLocaleString()}
          </p>
        </div>

        {(() => {
          const customFeatures = ((plan.features as string[]) || []).map(f => ({ name: f, included: true }));
          const entitlementFeatures = getEntitlementFeatures(plan.entitlements as any);
          const combinedFeatures = [...customFeatures, ...entitlementFeatures];
          
          if (combinedFeatures.length > 0) {
            return (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Included in this plan:</h3>
                <ul className="space-y-2">
                  {combinedFeatures.map((feat, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${feat.included ? "text-gray-600" : "text-gray-400 line-through"}`}>
                      {feat.included ? (
                        <span className="text-indigo-600">✓</span>
                      ) : (
                        <span className="text-gray-300">✗</span>
                      )}
                      {feat.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          return null;
        })()}

        <p className="text-sm text-gray-500 mb-4">
          Paying as:{" "}
          <span className="font-medium text-gray-700">{session.user.email}</span>
        </p>

        {session.user.email === "guest@sandbox.local" ? (
          <form action={async () => {
            "use server";
            redirect(`/sandbox/${slug}/member?welcome=1`);
          }}>
            <button type="submit" className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2">
              <span className="text-lg">💳</span> Simulate Sandbox Payment
            </button>
          </form>
        ) : (
          <CheckoutButton
            email={session.user.email!}
            amount={Number(plan.price)}
            planName={plan.name}
            planId={plan.id}
            tenantSlug={plan.tenant.slug}
            userId={session.user.id!}
          />
        )}
      </div>
    </div>
  );
}