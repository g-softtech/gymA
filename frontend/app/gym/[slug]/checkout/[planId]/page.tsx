
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import CheckoutButton from "@/components/CheckoutButton";

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
            ₦{plan.price.toLocaleString()}
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Paying as:{" "}
          <span className="font-medium text-gray-700">{session.user.email}</span>
        </p>
        <CheckoutButton
          email={session.user.email!}
          amount={plan.price}
          planName={plan.name}
          planId={plan.id}
          tenantSlug={plan.tenant.slug}
        />
      </div>
    </div>
  );
}