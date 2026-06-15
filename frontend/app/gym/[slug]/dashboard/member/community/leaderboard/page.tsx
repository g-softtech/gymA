import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return null;

  // Attendance leaderboard
  const attendanceRaw = await prisma.attendance.groupBy({
    by: ["memberId"],
    where: { tenantId: tenant.id },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const memberIds = attendanceRaw.map((a) => a.memberId);
  const memberProfiles = await prisma.memberProfile.findMany({
    where: { id: { in: memberIds } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const attendanceLeaderboard = attendanceRaw.map((a, i) => {
    const profile = memberProfiles.find((p) => p.id === a.memberId);
    return {
      rank: i + 1,
      userId: profile?.userId ?? "",
      name: profile?.user.name ?? profile?.user.email ?? "Member",
      score: a._count.id,
      isMe: profile?.userId === session.user.id,
    };
  });

  // Badges leaderboard
  const badgesRaw = await prisma.badge.groupBy({
    by: ["userId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const badgeUserIds = badgesRaw.map((b) => b.userId);
  const badgeUsers = await prisma.user.findMany({
    where: { id: { in: badgeUserIds }, tenantId: tenant.id },
    select: { id: true, name: true, email: true },
  });

  const badgeLeaderboard = badgesRaw
    .map((b, i) => {
      const user = badgeUsers.find((u) => u.id === b.userId);
      if (!user) return null;
      return {
        rank: i + 1,
        userId: b.userId,
        name: user.name ?? user.email ?? "Member",
        score: b._count.id,
        isMe: b.userId === session.user.id,
      };
    })
    .filter(Boolean) as { rank: number; userId: string; name: string; score: number; isMe: boolean }[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/gym/${slug}/dashboard/member/community`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Community
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-500 mt-1">Top performers at {tenant.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Attendance leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">📅 Most Visits</h2>
            <p className="text-xs text-gray-400 mt-0.5">All-time attendance</p>
          </div>
          <div className="divide-y divide-gray-50">
            {attendanceLeaderboard.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No data yet.</p>
            ) : (
              attendanceLeaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`px-6 py-3 flex items-center gap-3 ${entry.isMe ? "bg-indigo-50" : ""}`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    entry.rank === 1 ? "bg-yellow-400 text-white" :
                    entry.rank === 2 ? "bg-gray-300 text-gray-700" :
                    entry.rank === 3 ? "bg-orange-300 text-white" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${entry.isMe ? "text-indigo-700" : "text-gray-900"}`}>
                      {entry.name} {entry.isMe && "(You)"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{entry.score}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Badge leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">🏅 Most Badges</h2>
            <p className="text-xs text-gray-400 mt-0.5">Achievement leaders</p>
          </div>
          <div className="divide-y divide-gray-50">
            {badgeLeaderboard.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No badges earned yet.</p>
            ) : (
              badgeLeaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`px-6 py-3 flex items-center gap-3 ${entry.isMe ? "bg-indigo-50" : ""}`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    entry.rank === 1 ? "bg-yellow-400 text-white" :
                    entry.rank === 2 ? "bg-gray-300 text-gray-700" :
                    entry.rank === 3 ? "bg-orange-300 text-white" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${entry.isMe ? "text-indigo-700" : "text-gray-900"}`}>
                      {entry.name} {entry.isMe && "(You)"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{entry.score} 🏅</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
