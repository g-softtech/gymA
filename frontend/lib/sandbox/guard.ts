import { prisma } from "@/lib/prisma";

/**
 * Ensures the specified tenant is NOT in read-only Demo Mode.
 * Call this at the top of any Server Action or API Route that mutates the database.
 * 
 * @example
 * // Inside app/api/members/route.ts
 * export async function POST(req: Request) {
 *   const session = await getAuthSession();
 *   await verifyWriteAccess(session.user.tenantId);
 *   // ... safe to mutate database ...
 * }
 */
export async function verifyWriteAccess(tenantId: string | undefined | null) {
  if (!tenantId) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isDemo: true },
  });

  if (tenant?.isDemo) {
    throw new Error("DEMO_MODE_ACTIVE");
  }
}
