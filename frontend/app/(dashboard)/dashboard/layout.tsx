import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. AUTH CHECK
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  // 2. FETCH USER
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      tenantId: true,
      role: true,
      tenant: { select: { name: true } },
    },
  });

  if (!user) {
    redirect('/api/auth/signin');
  }

  // 3. ONBOARDING GUARD
  if (!user.tenantId && user.role !== 'SUPERADMIN') {
    redirect('/onboarding');
  }

  const role = user.role;
  const gymName = user.tenant?.name || 'Smart Gym';

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <aside className="flex w-64 flex-col bg-gray-900 text-white">
        <div className="truncate border-b border-gray-800 bg-gray-950 p-6 text-xl font-bold">
          {gymName}
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="block rounded-md px-4 py-2 hover:bg-gray-800">
            Overview
          </Link>

          {role === 'ADMIN' && (
            <>
              <Link href="/dashboard/admin/members" className="block px-4 py-2 hover:bg-gray-800">
                Manage Members
              </Link>
              <Link href="/dashboard/admin/trainers" className="block px-4 py-2 hover:bg-gray-800">
                Manage Trainers
              </Link>
              <Link href="/dashboard/admin/settings" className="block px-4 py-2 hover:bg-gray-800">
                Gym Settings
              </Link>
            </>
          )}

          {role === 'TRAINER' && (
            <Link href="/dashboard/trainer/schedule" className="block px-4 py-2 hover:bg-gray-800">
              My Schedule
            </Link>
          )}

          {(role === 'MEMBER' || role === 'ADMIN') && (
            <Link href="/dashboard/member/workouts" className="block px-4 py-2 hover:bg-gray-800">
              My Workouts
            </Link>
          )}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}