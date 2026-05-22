// import { prisma } from "../../../../../lib/prisma";
// import { notFound, redirect } from "next/navigation";
// import { getAuthSession } from "../../../../../lib/auth";
// import CheckoutButton from "../../../../../CheckoutButton";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import CheckoutButton from "@/components/CheckoutButton";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ tenant: string; planId: string }>;
}) {
  const resolvedParams = await params;
  const session = await getAuthSession();

  if (!session || !session.user) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${resolvedParams.tenant}/checkout/${resolvedParams.planId}`);
  }

  // Fetch the specific plan being purchased
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: resolvedParams.planId },
    include: { tenant: true },
  });

  if (!plan || plan.tenant.slug !== resolvedParams.tenant) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">{plan.tenant.name}</h2>
          <p className="text-2xl text-gray-900 mt-1 font-medium">{plan.name}</p>
          <p className="text-4xl font-extrabold text-gray-900 mt-4">${plan.price}</p>
        </div>
        <CheckoutButton 
          email={session.user.email!} 
          amount={plan.price} 
          planName={plan.name} 
          tenantSlug={plan.tenant.slug} 
        />
      </div>
    </div>
  );
}