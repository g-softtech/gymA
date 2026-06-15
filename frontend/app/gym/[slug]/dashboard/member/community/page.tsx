import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CommunityFeed from "@/components/community/CommunityFeed";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) redirect(`/api/auth/signin`);

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) redirect(`/gym/${slug}/dashboard/member`);

  const posts = await prisma.post.findMany({
    where: { tenantId: tenant.id },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
      likes: { select: { userId: true } },
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Badges for current user
  const userBadges = await prisma.badge.findMany({
    where: { userId: session.user.id },
  });

  // Auto-award badges
  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      attendances: true,
      bookings: { where: { status: "CONFIRMED" } },
      workouts: true,
    },
  });

  const existingBadgeTypes = userBadges.map((b) => b.type);
  const newBadges: string[] = [];

  if (memberProfile) {
    if (!existingBadgeTypes.includes("FIRST_CHECKIN") && memberProfile.attendances.length > 0) {
      await prisma.badge.create({ data: { userId: session.user.id, type: "FIRST_CHECKIN" } });
      newBadges.push("FIRST_CHECKIN");
    }
    if (!existingBadgeTypes.includes("STREAK_7") && memberProfile.attendances.length >= 7) {
      await prisma.badge.create({ data: { userId: session.user.id, type: "STREAK_7" } });
      newBadges.push("STREAK_7");
    }
    if (!existingBadgeTypes.includes("FIRST_BOOKING") && memberProfile.bookings.length > 0) {
      await prisma.badge.create({ data: { userId: session.user.id, type: "FIRST_BOOKING" } });
      newBadges.push("FIRST_BOOKING");
    }
    if (!existingBadgeTypes.includes("FIRST_WORKOUT") && memberProfile.workouts.length > 0) {
      await prisma.badge.create({ data: { userId: session.user.id, type: "FIRST_WORKOUT" } });
      newBadges.push("FIRST_WORKOUT");
    }
  }

  const allBadges = await prisma.badge.findMany({ where: { userId: session.user.id } });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">Connect with fellow gym members</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/gym/${slug}/dashboard/member/community/challenges`}
            className="text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:border-indigo-400 transition font-medium"
          >
            🏆 Challenges
          </Link>
          <Link
            href={`/gym/${slug}/dashboard/member/community/leaderboard`}
            className="text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:border-indigo-400 transition font-medium"
          >
            📊 Leaderboard
          </Link>
        </div>
      </div>

      {/* Badges row */}
      {allBadges.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {allBadges.map((b) => (
              <BadgeChip key={b.id} type={b.type} />
            ))}
          </div>
        </div>
      )}

      <CommunityFeed
        currentUserId={session.user.id}
        currentUserName={session.user.name ?? session.user.email ?? "Member"}
        tenantId={tenant.id}
        initialPosts={posts.map((p) => ({
          id: p.id,
          content: p.content,
          imageUrl: p.imageUrl ?? null,
          authorId: p.author.id,
          authorName: p.author.name ?? p.author.email ?? "Member",
          likeCount: p.likes.length,
          likedByMe: p.likes.some((l) => l.userId === session.user.id),
          comments: p.comments.map((c) => ({
            id: c.id,
            content: c.content,
            authorId: c.author.id,
            authorName: c.author.name ?? "Member",
            createdAt: c.createdAt.toISOString(),
          })),
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

const BADGE_META: Record<string, { label: string; icon: string; color: string }> = {
  FIRST_CHECKIN: { label: "First Check-in", icon: "✅", color: "bg-green-100 text-green-700" },
  STREAK_7: { label: "7-Day Streak", icon: "🔥", color: "bg-orange-100 text-orange-700" },
  STREAK_30: { label: "30-Day Streak", icon: "⚡", color: "bg-yellow-100 text-yellow-700" },
  FIRST_BOOKING: { label: "First Booking", icon: "📅", color: "bg-blue-100 text-blue-700" },
  FIRST_WORKOUT: { label: "First Workout", icon: "💪", color: "bg-indigo-100 text-indigo-700" },
  CHALLENGE_COMPLETE: { label: "Challenge Champ", icon: "🏆", color: "bg-purple-100 text-purple-700" },
  COMMUNITY_STAR: { label: "Community Star", icon: "⭐", color: "bg-pink-100 text-pink-700" },
  WEIGHT_GOAL: { label: "Weight Goal", icon: "🎯", color: "bg-teal-100 text-teal-700" },
};

function BadgeChip({ type }: { type: string }) {
  const meta = BADGE_META[type] ?? { label: type, icon: "🏅", color: "bg-gray-100 text-gray-600" };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${meta.color}`}>
      <span>{meta.icon}</span>
      {meta.label}
    </div>
  );
}
