import 'dotenv/config';
import { prisma } from '../lib/prisma';
import os from 'os';

async function bootstrapSuperAdmin() {
  console.log("🚀 Starting Production-Hardened SUPERADMIN Bootstrap...");

  // 1. Environment Guard & Confirmation Flag
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️ Running in non-production environment");
  }

  const args = process.argv.slice(2);
  const confirmFlag = args.includes("--confirm-bootstrap");
  const targetEmail = args.find(arg => !arg.startsWith("--"));

  if (!confirmFlag || !targetEmail) {
    console.error("❌ ERROR: Missing confirmation flag or email.");
    console.error("Usage: npx tsx scripts/bootstrap-superadmin.ts <email> --confirm-bootstrap");
    process.exit(1);
  }

  try {
    // 2. Pre-flight User Check (findUnique)
    console.log(`🔍 Pre-flight check: Validating identity for '${targetEmail}'...`);
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!targetUser) {
      console.error(`❌ ERROR: User '${targetEmail}' does not exist.`);
      console.error(`Please sign in via Google first to create your identity before running this script.`);
      process.exit(1);
    }

    const previousRole = targetUser.role;

    if (previousRole === "SUPERADMIN") {
      console.log(`✅ User '${targetEmail}' is already a SUPERADMIN. No action taken.`);
      process.exit(0);
    }

    console.log(`✅ Pre-flight passed. Found User ID: ${targetUser.id} | Current Role: ${previousRole}`);

    // 3. Keep Update Strict (Role enum only)
    const superAdmin = await prisma.user.update({
      where: { id: targetUser.id },
      data: { role: "SUPERADMIN" }, // Hardcoded enum lock
      select: { id: true, email: true, role: true }
    });

    // 4. Add Audit Log Block
    console.log(`\n========================================`);
    console.log(`✅ SUCCESS: RBAC Escalation Complete`);
    console.log(`========================================`);
    console.log(`🕒 Timestamp:    ${new Date().toISOString()}`);
    console.log(`👤 User ID:      ${superAdmin.id}`);
    console.log(`📧 Email:        ${superAdmin.email}`);
    console.log(`🔒 Old Role:     ${previousRole}`);
    console.log(`🔑 New Role:     ${superAdmin.role}`);
    console.log(`🌍 Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`🖥️ Executed By:  ${process.env.USER || os.userInfo().username || 'unknown'} @ ${os.hostname()}`);
    console.log(`\nYour /admin dashboard is now accessible.`);

  } catch (error: any) {
    console.error(`❌ ERROR: Failed to bootstrap SUPERADMIN:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapSuperAdmin();
