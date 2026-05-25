
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MemberDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/dashboard/member`);
  }

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
    },
  });

  const activeSub = memberProfile?.subscriptions[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {welcome === "1" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium">
          🎉 Welcome! Your membership has been activated successfully.
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name || session.user.email}!
        </h1>
        <p className="text-gray-500 mt-1">Here is your membership overview.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Status</h2>
        {activeSub ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium text-gray-900">{activeSub.plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expires</span>
              <span className="font-medium text-gray-900">
                {new Date(activeSub.endDate).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">You have no active membership plan.</p>
            <Link
              href={`/gym/${slug}`}
              className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Browse Plans
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Workout Plans", note: "Coming soon" },
          { label: "AI Coach", note: "Coming soon" },
          { label: "Book a Trainer", note: "Coming soon" },
          { label: "Attendance History", note: "Coming soon" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-400"
          >
            <p className="font-medium">{item.label}</p>
            <p className="text-sm mt-1">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}