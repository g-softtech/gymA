import "dotenv/config";
import { prisma } from "../lib/prisma";

const UPDATES = [
  {
    slug: "eco-fitness-hub",
    logoUrl: "/sandbox-logos/eco-fitness.png",
    description: "Our Vision: To be the leading eco-friendly wellness destination in Nigeria. \nOur Mission: To foster a holistic wellness journey blending fitness, leisure, and recovery through state-of-the-art, sustainable facilities. At Eco Fitness Hub, we don't just build bodies; we nurture community and promote healthy, balanced lifestyles for everyone."
  },
  {
    slug: "bodyline-fitness",
    logoUrl: "/sandbox-logos/bodyline.png",
    description: "Our Vision: To redefine luxury fitness in Abuja.\nOur Mission: To provide our members with an unparalleled fitness experience through top-tier equipment, personalized coaching, and premium spa services. Bodyline Fitness & Gym is your ultimate destination for health, wellness, and elite conditioning."
  },
  {
    slug: "bodyrox-fitness",
    logoUrl: "/sandbox-logos/bodyrox.png",
    description: "Our Vision: To be the most dynamic and high-tech fitness studio in the heart of Abuja.\nOur Mission: To elevate your fitness with high-energy HIIT, strength training, and specialized Fight Club classes. Bodyrox Fitness Studio brings world-class equipment and professional trainers together to help you unleash your inner savage."
  },
  {
    slug: "ifitness-abuja",
    logoUrl: "/sandbox-logos/ifitness.png",
    description: "Our Vision: To make health and fitness accessible to every Nigerian.\nOur Mission: As Nigeria's fastest-growing fitness chain, i-Fitness is committed to providing affordable, world-class fitness facilities right in your neighborhood. With over 40 free group classes monthly and multi-branch access, we are here to support your fitness journey every step of the way."
  }
];

async function main() {
  console.log("Updating Custom Data for Sandboxes...");

  for (const data of UPDATES) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.slug }
    });

    if (!tenant) {
      console.log(`Tenant ${data.slug} not found, skipping.`);
      continue;
    }

    const updatePayload: any = { 
      description: data.description,
      logoUrl: data.logoUrl
    };

    await prisma.tenantSettings.update({
      where: { tenantId: tenant.id },
      data: updatePayload
    });

    console.log(`✅ Updated ${tenant.name} (${data.slug})`);
  }
  
  console.log("All custom data updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
