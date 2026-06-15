import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MemberAttendancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      attendances: {
        orderBy: { checkInTime: "desc" },
      },
    },
  });
  if (!memberProfile) return null;

  const records = memberProfile?.attendances ?? [];

  // Stats
  const now = new Date();
  const thisMonth = records.filter((r) => {
    const d = new Date(r.checkInTime);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const thisWeek = records.filter((r) => {
    const d = new Date(r.checkInTime);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  // Streak calculation
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const uniqueDays = [...new Set(records.map((r) => {
    const d = new Date(r.checkInTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }))].sort((a, b) => b - a);

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = today.getTime() - i * 24 * 60 * 60 * 1000;
    if (uniqueDays[i] === expected) streak++;
    else break;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-500 mt-1">Track your gym visit consistency</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Visits", value: records.length, icon: "📋", color: "bg-indigo-50 text-indigo-700" },
          { label: "This Month", value: thisMonth, icon: "📅", color: "bg-blue-50 text-blue-700" },
          { label: "This Week", value: thisWeek, icon: "📆", color: "bg-green-50 text-green-700" },
          { label: "Day Streak", value: streak, icon: "🔥", color: "bg-orange-50 text-orange-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Visit Log</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {records.length === 0 ? (
            <p className="px-6 py-10 text-center text-gray-400">No attendance records yet.</p>
          ) : (
            records.map((r) => (
              <div key={r.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-base">
                    ✅
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(r.checkInTime).toLocaleDateString("en-NG", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(r.checkInTime).toLocaleTimeString("en-NG", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
