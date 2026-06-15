import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MemberBookingsClient from "@/components/member/MemberBookingsClient";

export const metadata = {
  title: "My Schedule | Member Dashboard",
};

export default async function MemberBookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();



  if (!session?.user) return null;
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile) {
    redirect(`/gym/${slug}/dashboard/member`);
  }

  const bookings = await prisma.booking.findMany({
    where: { memberId: profile.id },
    include: {
      trainer: { include: { user: { select: { name: true, image: true } } } },
      classSession: { include: { instructor: { include: { user: { select: { name: true, image: true } } } } } },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-500 mt-1">Manage your upcoming classes and trainer sessions.</p>
        </div>
      </div>

      <MemberBookingsClient bookings={bookings} />
    </div>
  );
}
