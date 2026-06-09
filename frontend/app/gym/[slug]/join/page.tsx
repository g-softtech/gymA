import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function GymJoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=/gym/${slug}/join`);
  }

  // If they already have a tenantId, redirect them to their dashboard
  if (session.user.tenantId) {
    redirect(`/gym/${slug}/dashboard/member`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { settings: true },
  });

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          {/* Gym Logo / Initial */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            {tenant.settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.settings.logoUrl}
                alt={tenant.name}
                className="w-14 h-14 object-contain rounded-xl"
              />
            ) : (
              <span className="text-3xl font-black text-white uppercase">
                {tenant.name[0]}
              </span>
            )}
          </div>

          {/* Text */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Join {tenant.name}
          </h1>
          {tenant.settings?.tagline && (
            <p className="text-indigo-300 text-sm mb-1">
              {tenant.settings.tagline}
            </p>
          )}
          <p className="text-slate-400 text-sm mt-3 mb-8 leading-relaxed">
            You&apos;re about to become a member of{" "}
            <span className="text-white font-semibold">{tenant.name}</span>.
            This will link your account to this gym permanently.
          </p>

          {/* Info box */}
          <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-xl p-4 mb-8 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-green-400">✓</span>
              Access your personalised dashboard
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-green-400">✓</span>
              Book sessions with trainers
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-green-400">✓</span>
              Track workouts, nutrition &amp; progress
            </div>
          </div>

          {/* CTA */}
          <form action={`/api/gym/${slug}/join`} method="POST">
            <button
              type="submit"
              id="confirm-join-btn"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/25 text-sm"
            >
              Join {tenant.name} →
            </button>
          </form>

          <Link
            href="/"
            className="block mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Powered by SmartGym · Your account will be linked to this gym
        </p>
      </div>
    </div>
  );
}
