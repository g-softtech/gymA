import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { MembershipPlan } from "@prisma/client";

export default async function GymPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { membershipPlans: true },
  });

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-indigo-700 text-white py-20 px-6 text-center">
        <h1 className="text-5xl font-extrabold mb-4">
          {tenant.name}
        </h1>

        <p className="text-xl text-indigo-200 max-w-xl mx-auto">
          Join our gym and transform your fitness journey.
          Choose a plan below to get started.
        </p>
      </div>

      {/* Membership Plans */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
          Membership Plans
        </h2>

        {tenant.membershipPlans.length === 0 ? (
          <p className="text-center text-gray-500">
            No plans available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tenant.membershipPlans.map((plan: MembershipPlan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col justify-between hover:shadow-xl transition-shadow"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>

                  <p className="text-gray-500 text-sm mb-6">
                    {plan.durationDays} day
                    {plan.durationDays > 1 ? "s" : ""} access
                  </p>

                  <p className="text-4xl font-extrabold text-indigo-600 mb-1">
                    &#8358;{plan.price.toLocaleString()}
                  </p>
                </div>

                <Link
                  href={`/gym/${slug}/checkout/${plan.id}`}
                  className="mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold py-3 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-indigo-50 border-t border-indigo-100 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Member login */}
          <div className="text-center sm:text-left">
            <p className="text-gray-600 mb-2 font-medium">
              Already a member?
            </p>

            <Link
              href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`}
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Member Sign In
            </Link>
          </div>

          {/* Admin login */}
          <div className="text-center sm:text-right">
            <p className="text-gray-400 text-sm mb-2">
              Gym staff?
            </p>

            <Link
              href={`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/trainer`}
              className="inline-block px-5 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
            >
              Admin / Trainer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
