import 'dotenv/config';
import { prisma } from '../lib/prisma';
import os from 'os';

async function bootstrapSuperAdmin() {
  console.log("🚀 Starting ID-Based Governance SUPERADMIN Bootstrap...");

  // 1. Environment Guard
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️ Running in non-production environment");
  }

  const args = process.argv.slice(2);
  const confirmFlag = args.includes("--confirm-bootstrap");

  if (!confirmFlag) {
    console.error("❌ ERROR: Missing confirmation flag.");
    console.error("Usage: npx tsx scripts/bootstrap-superadmin.ts --confirm-bootstrap");
    process.exit(1);
  }

  const canonicalAdminId = process.env.SUPERADMIN_USER_ID;

  if (!canonicalAdminId) {
    console.error("❌ ERROR: SUPERADMIN_USER_ID is not defined in .env");
    console.error("You must explicitly define the immutable canonical owner in environment variables.");
    process.exit(1);
  }

  try {
    // 2. Locate Canonical Admin
    console.log(`🔍 Locating canonical identity ID: '${canonicalAdminId}'...`);
    const canonicalUser = await prisma.user.findUnique({
      where: { id: canonicalAdminId }
    });

    if (!canonicalUser) {
      console.error(`❌ FATAL ERROR: User ID '${canonicalAdminId}' does not exist in the database.`);
      console.error(`Aborting. No demotions or changes were made to prevent lockout.`);
      process.exit(1);
    }

    console.log(`✅ Canonical user found: ${canonicalUser.email} (Role: ${canonicalUser.role})`);

    // 3. Demote any ROGUE admins
    console.log(`\n🧹 Sweeping for rogue superadmins...`);
    
    // Find all users who are currently SUPERADMIN but are NOT the canonical ID
    const rogueAdmins = await prisma.user.findMany({
      where: {
        role: "SUPERADMIN",
        id: { not: canonicalAdminId }
      }
    });

    if (rogueAdmins.length > 0) {
      console.warn(`⚠️ Found ${rogueAdmins.length} rogue SUPERADMIN accounts. Demoting them to MEMBER...`);
      for (const rogue of rogueAdmins) {
        await prisma.user.update({
          where: { id: rogue.id },
          data: { role: "MEMBER" }
        });
        console.log(`   ⬇️ Demoted: ${rogue.email} (${rogue.id}) -> MEMBER`);
      }
    } else {
      console.log(`✅ No rogue superadmins found.`);
    }

    // 4. Promote Canonical Admin (if not already)
    if (canonicalUser.role !== "SUPERADMIN") {
      console.log(`\n⬆️ Promoting canonical user to SUPERADMIN...`);
      await prisma.user.update({
        where: { id: canonicalAdminId },
        data: { role: "SUPERADMIN" }
      });
      console.log(`✅ Promotion successful.`);
    } else {
      console.log(`✅ Canonical user is already SUPERADMIN. No action needed.`);
    }

    // 5. Final Audit Log
    console.log(`\n========================================`);
    console.log(`🛡️ IDENTITY GOVERNANCE ENFORCED`);
    console.log(`========================================`);
    console.log(`🕒 Timestamp:    ${new Date().toISOString()}`);
    console.log(`👑 Platform Owner: ${canonicalUser.email} (ID: ${canonicalUser.id})`);
    console.log(`🌍 Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`🖥️ Executed By:  ${process.env.USER || os.userInfo().username || 'unknown'} @ ${os.hostname()}`);
    console.log(`\nSystem is fully secured under a single canonical identity.`);

  } catch (error: any) {
    console.error(`❌ ERROR: Failed to enforce identity governance:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapSuperAdmin();
