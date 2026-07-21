import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const INCREMENTAL_SANDBOXES = [
  {
    slug: "gallery-wellness-hub",
    name: "Gallery Wellness Hub",
    description: "Our Vision: To be the ultimate destination for wellness and premium fitness in River Park Estate.\nOur Mission: To foster a holistic lifestyle by blending fitness, recovery, and luxury in a world-class facility.",
    logoUrl: "/sandbox-logos/gallery-wellness.png",
    primaryColor: "#556b2f",
    secondaryColor: "#e6c229",
  },
  {
    slug: "crunch-fitness",
    name: "Crunch Fitness Gym",
    description: "Our Vision: To be the most energetic and result-oriented gym community in Lugbe.\nOur Mission: To empower every individual to crush their fitness goals through high-energy classes and state-of-the-art equipment.",
    logoUrl: "/sandbox-logos/crunch-fitness.png",
    primaryColor: "#ff4500",
    secondaryColor: "#000000",
  },
  {
    slug: "fit-studio",
    name: "Fit Studio",
    description: "Our Vision: To redefine modern studio fitness through innovation and high intensity.\nOur Mission: To provide an electrifying environment that pushes limits and builds unshakeable strength.",
    logoUrl: "/sandbox-logos/fit-studio.png",
    primaryColor: "#00bfff",
    secondaryColor: "#111111",
  }
];

async function main() {
  console.log("Starting incremental seed...");

  for (const sb of INCREMENTAL_SANDBOXES) {
    console.log(`Processing sandbox: ${sb.name} (${sb.slug})...`);
    
    // Check if tenant already exists
    let tenant = await prisma.tenant.findUnique({ where: { slug: sb.slug } });
    
    // Always delete orphaned users by email just in case previous runs failed midway
    await prisma.user.deleteMany({
      where: { email: { endsWith: `@${sb.slug}.com` } }
    });

    if (tenant) {
      console.log(`  Tenant ${sb.slug} already exists. Deleting it to start fresh...`);
      await prisma.tenant.delete({ where: { slug: sb.slug } });
    }
    
    console.log(`  Creating new tenant ${sb.slug}...`);
    tenant = await prisma.tenant.create({
        data: {
          name: sb.name,
          slug: sb.slug,
          settings: {
            create: {
              description: sb.description,
              logoUrl: sb.logoUrl,
              primaryColor: sb.primaryColor,
              secondaryColor: sb.secondaryColor,
            }
          }
        }
      });

      console.log(`  Creating Admin, Trainer, and Members for ${sb.slug}...`);
      
      const password = await bcrypt.hash("password123", 10);
      
      // Admin
      await prisma.user.create({
        data: {
          email: `admin@${sb.slug}.com`,
          name: `${sb.name} Admin`,
          password,
          role: "ADMIN",
          tenantId: tenant.id,
        }
      });

      // Trainer
      const trainer = await prisma.user.create({
        data: {
          email: `trainer@${sb.slug}.com`,
          name: `Coach ${sb.name.split(' ')[0]}`,
          password,
          role: "TRAINER",
          tenantId: tenant.id,
        }
      });

      // IMPORTANT: Explicitly create trainer profile with showOnWebsite: true
      await prisma.trainerProfile.create({
        data: {
          userId: trainer.id,
          specialties: ["HIIT", "Strength"],
          bio: `Lead coach at ${sb.name}. Let's crush those goals!`,
          yearsOfExperience: 5,
          showOnWebsite: true,
          availability: [],
        }
      });

      // Plans
      const goldPlan = await prisma.membershipPlan.create({
        data: {
          tenantId: tenant.id,
          name: "Gold Plan",
          description: "All access membership",
          price: 15000,
          durationDays: 30,
          features: ["24/7 Access", "Group Classes"],
          isActive: true
        }
      });

      // Members
      for (let i = 1; i <= 3; i++) {
        const member = await prisma.user.create({
          data: {
            email: `member${i}@${sb.slug}.com`,
            name: `Test Member ${i}`,
            password,
            role: "MEMBER",
            tenantId: tenant.id,
          }
        });
        
        await prisma.memberProfile.create({
          data: {
            userId: member.id,
            subscriptions: {
              create: {
                plan: { connect: { id: goldPlan.id } },
                tenant: { connect: { id: tenant.id } },
                status: "ACTIVE",
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
              }
            }
          }
        });
      }
  }

  console.log("Incremental seed completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
