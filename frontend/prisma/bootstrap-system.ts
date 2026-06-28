import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function bootstrap() {
  const correlationId = crypto.randomUUID();
  const TRACE = `[BOOTSTRAP:PLATFORM][${correlationId}]`;

  console.log(`${TRACE} ┌─ INITIATING PLATFORM BOOTSTRAP`);

  // ── 1. Strict Secret Handling ──────────────────────────────────────────
  const email = process.env.PLATFORM_SUPERADMIN_EMAIL;
  const password = process.env.PLATFORM_SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error(`${TRACE} └─ FATAL: Missing PLATFORM_SUPERADMIN_EMAIL or PLATFORM_SUPERADMIN_PASSWORD in environment. Halting to prevent unsafe state.`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error(`${TRACE} └─ FATAL: PLATFORM_SUPERADMIN_PASSWORD must be at least 8 characters. Weak passwords rejected.`);
    process.exit(1);
  }

  try {
    // ── 2. Idempotent Upsert (Platform-Scoped / tenantId = null) ──────────
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, tenantId: true }
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: "SUPERADMIN",
        tenantId: null, // Force detachment from any tenant if previously bound
        password: hashedPassword, // Ensure the new secure hash is always applied
      },
      create: {
        name: "Platform SuperAdmin",
        email: email,
        password: hashedPassword,
        role: "SUPERADMIN",
        tenantId: null, 
      }
    });

    // ── 3. Role Escalation Auditing ─────────────────────────────────────────
    if (!existingUser) {
      console.log(`${TRACE} │  [AUDIT] BOOTSTRAP_USER_CREATED: Platform SuperAdmin initialized.`);
    } else {
      console.log(`${TRACE} │  [AUDIT] BOOTSTRAP_USER_UPDATED: Platform SuperAdmin synchronized.`);
      if (existingUser.role !== "SUPERADMIN") {
        console.warn(`${TRACE} │  [AUDIT:CRITICAL] BOOTSTRAP_ROLE_ESCALATED: User ${existingUser.id} elevated from ${existingUser.role} to SUPERADMIN.`);
      }
      if (existingUser.tenantId !== null) {
        console.warn(`${TRACE} │  [AUDIT:CRITICAL] BOOTSTRAP_TENANT_DETACHED: User ${existingUser.id} detached from tenant ${existingUser.tenantId}.`);
      }
    }

    console.log(`${TRACE} └─ SUCCESS: Platform SuperAdmin is correctly provisioned and ready.`);
  } catch (error) {
    console.error(`${TRACE} └─ FATAL ERROR during bootstrap:`, error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ── 4. Deployment Safety ────────────────────────────────────────────────
// This script executes immediately when run via CLI.
// It should strictly be manually triggered via `npx tsx prisma/bootstrap-system.ts`.
bootstrap();
