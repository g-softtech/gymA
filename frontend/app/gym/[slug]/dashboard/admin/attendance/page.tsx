
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceManager from "@/components/admin/AttendanceManager";
import type { Attendance, MemberProfile, User } from "@prisma/client";

type AttendanceWithMember = Attendance & {
  member: MemberProfile & {
    user: Pick<User, "name" | "email">;
  };
};

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();


  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    return <p className="p-6 text-red-600">Access Denied.</p>;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      users: {
        where: { role: "MEMBER" },
        include: { memberProfile: true },
      },
    },
  });
  if (!tenant) return null;

  if (!tenant) return <p>Gym not found.</p>;

  const recentAttendance = await prisma.attendance.findMany({
    where: { tenantId: tenant.id },
    include: {
      member: {
        include: { user: { select: { name: true, email: true } } },
      },
      events: {
        orderBy: { timestamp: "desc" },
        take: 1
      }
    },
    orderBy: { checkInTime: "desc" },
    take: 100,
  }) as any[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = recentAttendance.filter(
    (a: any) => new Date(a.checkInTime) >= today
  ).length;

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const weekCount = recentAttendance.filter(
    (a: any) => new Date(a.checkInTime) >= thisWeek
  ).length;

  const members = tenant.users
    .filter((u) => u.memberProfile)
    .map((u) => ({
      id: u.memberProfile!.id,
      name: u.name ?? u.email ?? "Unknown",
    }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Tracking</h1>
        <p className="text-muted-foreground mt-1">Monitor and record member check-ins</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today", value: todayCount, icon: "📅", color: "bg-primary/10 text-primary" },
          { label: "This Week", value: weekCount, icon: "📆", color: "bg-primary/10 text-primary" },
          { label: "Total Records", value: recentAttendance.length, icon: "📋", color: "bg-success/10 text-success" },
          { label: "Active Members", value: members.length, icon: "👥", color: "bg-secondary/10 text-secondary" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <AttendanceManager
        tenantId={tenant.id}
        members={members}
        initialRecords={recentAttendance.map((a: any) => ({
          id: a.id,
          memberName: a.member.user.name ?? a.member.user.email ?? "Unknown",
          checkInTime: a.checkInTime.toISOString(),
          notes: a.events?.[0]?.notes ?? "",
        }))}
      />
    </div>
  );
}
