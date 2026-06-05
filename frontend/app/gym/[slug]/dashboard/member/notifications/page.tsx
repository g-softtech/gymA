import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationsPanel from "@/components/admin/NotificationsPanel";

export default async function MemberNotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) redirect(`/api/auth/signin`);

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) redirect(`/gym/${slug}/dashboard/member`);

  const notifications = await prisma.notification.findMany({
    where: {
      tenantId: tenant.id,
      OR: [{ userId: session.user.id }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
        </p>
      </div>
      <NotificationsPanel
        tenantId={tenant.id}
        initialNotifications={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
