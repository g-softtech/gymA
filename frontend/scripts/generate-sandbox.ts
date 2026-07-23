import "dotenv/config";
import { prisma } from "../lib/prisma";
import readline from "readline";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// --- 1. Production Execution Guard ---
if (process.env.NODE_ENV === "production") {
  console.error("❌ Sandbox generation is strictly disabled in production environments.");
  process.exit(1);
}

if (process.env.ALLOW_SANDBOX_GENERATION !== "true") {
  console.error("❌ Missing ALLOW_SANDBOX_GENERATION=true in environment variables.");
  console.error("Please explicitly allow sandbox generation to proceed.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n==============================================");
  console.log("   AUTOMATED SANDBOX GENERATOR (DEV/DEMO)   ");
  console.log("==============================================\n");

  // --- 2. Database Safety Check ---
  const dbUrl = process.env.DATABASE_URL || "unknown";
  // Extract just the host/db part to not leak credentials in terminal
  const dbTarget = dbUrl.split("@")[1] || dbUrl;
  
  console.log(`⚠️  TARGET DATABASE: ${dbTarget}`);
  const dbConfirm = await question("Proceed with data creation? (yes/no): ");
  if (dbConfirm.toLowerCase() !== "yes") {
    console.log("Aborted.");
    process.exit(0);
  }

  // Collect Inputs
  const gymName = await question("\nEnter Gym Name (e.g. Titan Fitness): ");
  const logoUrl = await question("Enter Logo URL (or press enter for default): ");
  const primaryColor = await question("Enter Primary Hex Color (e.g. #FF0000): ");

  if (!gymName) {
    console.error("Gym name is required.");
    process.exit(1);
  }

  // --- 6. Slug Collision Handling ---
  let baseSlug = gymName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let isUnique = false;
  
  while (!isUnique) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) {
      isUnique = true;
    } else {
      const suffix = crypto.randomBytes(2).toString("hex");
      slug = `${baseSlug}-demo-${suffix}`;
    }
  }

  console.log(`\nGenerating sandbox for slug: ${slug}...`);

  const tempPassword = crypto.randomBytes(6).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const adminEmail = `admin@${slug}.test`;
  const trainerEmail = `trainer@${slug}.test`;

  try {
    // --- 3. Use Transaction Boundary ---
    await prisma.$transaction(async (tx) => {
      // --- 7. Seed Data Marking (isDemo: true) ---
      const tenant = await tx.tenant.create({
        data: {
          name: gymName,
          slug,
          isDemo: true, // EXTREMELY IMPORTANT
          status: "APPROVED",
          settings: {
            create: {
              logoUrl: logoUrl || "/sandbox-logos/default.png",
              primaryColor: primaryColor || "#3b82f6",
              description: `A premier automated sandbox environment for ${gymName}.`,
            }
          }
        }
      });

      // Admin User
      await tx.user.create({
        data: {
          name: `${gymName} Admin`,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          tenantId: tenant.id,
        }
      });

      // Trainer User
      const trainer = await tx.user.create({
        data: {
          name: `Coach ${gymName.split(" ")[0]}`,
          email: trainerEmail,
          password: hashedPassword,
          role: "TRAINER",
          tenantId: tenant.id,
        }
      });

      await tx.trainerProfile.create({
        data: {
          userId: trainer.id,
          specialties: ["CrossFit", "Strength"],
          availability: {
            monday: ["06:00-10:00", "16:00-20:00"],
            wednesday: ["06:00-10:00", "16:00-20:00"],
            friday: ["06:00-12:00"]
          },
          hourlyRate: 15000,
          showOnWebsite: true,
        }
      });

      // Membership Plans
      const standardPlan = await tx.membershipPlan.create({
        data: {
          tenantId: tenant.id,
          name: "Standard Monthly",
          price: 25000,
          currency: "NGN",
          durationDays: 30,
          isActive: true,
          features: ["Access to gym floor", "Locker room access"],
        }
      });

      await tx.membershipPlan.create({
        data: {
          tenantId: tenant.id,
          name: "Annual VIP",
          price: 250000,
          currency: "NGN",
          durationDays: 365,
          isActive: true,
          features: ["All classes included", "Free towel service", "Guest pass"],
        }
      });

      // Class Sessions
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(18, 0, 0, 0);

      await tx.classSession.createMany({
        data: [
          {
            tenantId: tenant.id,
            title: "Morning HIIT",
            instructorId: trainer.id,
            startTime: tomorrow,
            durationMins: 45,
            capacity: 20,
          },
          {
            tenantId: tenant.id,
            title: "Evening Strength",
            instructorId: trainer.id,
            startTime: nextWeek,
            durationMins: 60,
            capacity: 15,
          }
        ]
      });

      // Dummy Members
      for (let i = 1; i <= 3; i++) {
        const memberUser = await tx.user.create({
          data: {
            name: `Test Member ${i}`,
            email: `member${i}@${slug}.test`,
            password: hashedPassword,
            role: "MEMBER",
            tenantId: tenant.id,
          }
        });

        const profile = await tx.memberProfile.create({
          data: {
            userId: memberUser.id,
          }
        });

        // 5. Subscription Creation (Classified as authorized sandbox seed operation)
        await tx.subscription.create({
          data: {
            memberId: profile.id,
            planId: standardPlan.id,
            tenantId: tenant.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        });
      }
    });

    console.log("\n✅ Sandbox Generated Successfully!");
    console.log("======================================");
    console.log(`Tenant Slug: ${slug}`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Trainer Email: ${trainerEmail}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log("======================================");
    console.log("⚠️  Please change the password immediately upon login.");

  } catch (error) {
    console.error("\n❌ Transaction failed. Rollback complete.");
    console.error(error);
  } finally {
    rl.close();
  }
}

main();
