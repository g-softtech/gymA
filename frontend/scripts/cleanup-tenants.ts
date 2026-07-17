import "dotenv/config";
import { prisma } from "../lib/prisma";

const SLUGS_TO_DELETE = [
  // Category 1
  "dr-test-gym-1783188046478",
  "test-tenant-safety",
  "hardening-test-gym",
  "other-gym-1782129089229",
  "other-gym-1782129149252",
  // Category 2
  "gym-test-a2",
  "body-fix-studio",
  "ibj",
  "apex-performance",
  "forensic-test-gym",
  "tenant-b-audit",
  "audit-gym-1782129069553",
  "teegym",
  "audit-gym-1782129135763"
];

async function cleanupTenants() {
  console.log(`Starting cleanup of ${SLUGS_TO_DELETE.length} tenants...`);

  for (const slug of SLUGS_TO_DELETE) {
    console.log(`\nProcessing: ${slug}`);
    
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant) {
      console.log(`❌ Tenant not found: ${slug}`);
      continue;
    }

    try {
      // Delete child records first to satisfy foreign key constraints
      // Prisma handles some cascade deletes if configured in schema, but it's safer to manually delete them if we don't know the exact cascade configuration
      
      // Delete Memberships/Subscriptions and Profiles
      const users = await prisma.user.findMany({ where: { tenantId: tenant.id }, select: { id: true } });
      const userIds = users.map(u => u.id);

      const memberProfiles = await prisma.memberProfile.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
      const trainerProfiles = await prisma.trainerProfile.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
      
      const memberIds = memberProfiles.map(m => m.id);
      const trainerIds = trainerProfiles.map(t => t.id);

      if (memberIds.length > 0) {
        await prisma.attendance.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.workoutPlan.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.booking.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.subscription.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.progressRecord.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.receipt.deleteMany({ where: { memberId: { in: memberIds } } });
        await prisma.transaction.deleteMany({ where: { memberId: { in: memberIds } } });
      }

      if (trainerIds.length > 0) {
        await prisma.classSession.deleteMany({ where: { instructorId: { in: trainerIds } } });
      }

      if (userIds.length > 0) {
        // Delete things associated with users
        await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] } });
        await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.memberProfile.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.trainerProfile.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.badge.deleteMany({ where: { userId: { in: userIds } } });
      }

      // Delete Tenant relations
      await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.membershipPlan.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.blogPost.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.attendanceEvent.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.entitlementLog.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.tenantSettings.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.tenantIntelligenceMetrics.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.saaSInvoice.deleteMany({ where: { tenantId: tenant.id } });

      // Finally delete the tenant
      await prisma.tenant.delete({
        where: { id: tenant.id }
      });

      console.log(`✅ Successfully deleted tenant: ${slug}`);
    } catch (err) {
      console.error(`❌ Failed to delete tenant: ${slug}`);
      console.error(err);
    }
  }
}

cleanupTenants()
  .then(() => {
    console.log("\nCleanup completed.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
