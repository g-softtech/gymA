import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagingPanel from "@/components/member/MessagingPanel";

export default async function MemberMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const { slug } = await params;
  const { userId: selectedUserId } = await searchParams;
  const session = await getAuthSession();

  if (!session?.user?.id) redirect(`/api/auth/signin`);

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) redirect(`/gym/${slug}/dashboard/member`);

  const memberProfile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      bookings: {
        where: { status: { not: "CANCELLED" } },
        include: {
          trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      },
    },
  });

  const contactMap = new Map<string, { userId: string; name: string; email: string }>();
  memberProfile?.bookings.forEach((b) => {
    const uid = b.trainer.user.id;
    if (!contactMap.has(uid)) {
      contactMap.set(uid, {
        userId: uid,
        name: b.trainer.user.name ?? b.trainer.user.email ?? "Trainer",
        email: b.trainer.user.email ?? "",
      });
    }
  });
  const contacts = Array.from(contactMap.values());

  const messages = selectedUserId
    ? await prisma.message.findMany({
        where: {
          tenantId: tenant.id,
          OR: [
            { senderId: session.user.id, receiverId: selectedUserId },
            { senderId: selectedUserId, receiverId: session.user.id },
          ],
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  if (selectedUserId) {
    await prisma.message.updateMany({
      where: {
        tenantId: tenant.id,
        senderId: selectedUserId,
        receiverId: session.user.id,
        read: false,
      },
      data: { read: true },
    });
  }

  const unreadCounts: Record<string, number> = {};
  for (const contact of contacts) {
    unreadCounts[contact.userId] = await prisma.message.count({
      where: {
        tenantId: tenant.id,
        senderId: contact.userId,
        receiverId: session.user.id,
        read: false,
      },
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">Chat with your trainers</p>
      </div>
      <MessagingPanel
        currentUserId={session.user.id}
        currentUserName={session.user.name ?? session.user.email ?? "Member"}
        tenantId={tenant.id}
        contacts={contacts}
        contactLabel="TRAINERS"
        selectedUserId={selectedUserId}
        messages={messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          content: m.content,
          read: m.read,
          createdAt: m.createdAt.toISOString(),
        }))}
        unreadCounts={unreadCounts}
      />
    </div>
  );
}
