import "dotenv/config";
import { prisma } from "../lib/prisma";

const SANDBOXES = [
  {
    slug: "bodyline-fitness",
    primaryColor: "#0284c7", // Sky blue/Premium blue
    tagline: "Premium Fitness Experience",
    address: "502 Oladipo Diya St, Gudu, Abuja",
    phone: "+234 800 BODYLINE",
    email: "info@bodylinefitness.demo",
    instagramUrl: "https://instagram.com/bodylinefitnessng_demo",
    tiktokUrl: "",
    heroData: {
      headline: "The Ultimate Wellness Destination",
      subheadline: "Experience luxury fitness with state-of-the-art equipment, swimming pools, and dedicated personal trainers in Abuja.",
      ctaText: "Join Bodyline",
      ctaLink: "/pricing",
      backgroundImage: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop", // Luxury gym
    },
    servicesData: [
      { title: "Premium Gym Floor", description: "Top-tier Techno-Gym equipment.", icon: "🏋️" },
      { title: "Spa & Recovery", description: "Sauna, steam room, and massage.", icon: "🧖‍♂️" },
      { title: "Swimming Pool", description: "Olympic size swimming pool.", icon: "🏊‍♂️" },
      { title: "Personal Training", description: "Bespoke 1-on-1 coaching.", icon: "⭐" }
    ]
  },
  {
    slug: "bodyrox-fitness",
    primaryColor: "#dc2626", // Red/Black theme
    tagline: "Savage House",
    address: "Silverbird Entertainment Center, Central Business District, Abuja",
    phone: "+234 800 BODYROX",
    email: "contact@bodyrox.demo",
    instagramUrl: "https://instagram.com/bodyrox_demo",
    tiktokUrl: "https://tiktok.com/@bodyrox_demo",
    heroData: {
      headline: "Elevate Your Fitness",
      subheadline: "Join the most dynamic and high-tech fitness studio in the heart of Abuja's CBD.",
      ctaText: "Start Training",
      ctaLink: "/pricing",
      backgroundImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop", // CrossFit/High intensity
    },
    servicesData: [
      { title: "Group Classes", description: "High-energy HIIT and spin classes.", icon: "🔥" },
      { title: "Strength Training", description: "Heavy weights and lifting platforms.", icon: "💪" },
      { title: "Cardio Zone", description: "Modern treadmills and ellipticals.", icon: "🏃‍♂️" },
      { title: "Smoothie Bar", description: "Post-workout recovery drinks.", icon: "🥤" }
    ]
  },
  {
    slug: "ifitness-abuja",
    primaryColor: "#16a34a", // iFitness signature green
    tagline: "Fitness for Everyone",
    address: "Wuse 2, Abuja",
    phone: "+234 800 IFITNESS",
    email: "hello@ifitness.demo",
    instagramUrl: "https://instagram.com/ifitnessng_demo",
    tiktokUrl: "",
    heroData: {
      headline: "Nigeria's Fastest Growing Fitness Chain",
      subheadline: "Accessible, affordable, and world-class fitness facilities right in your neighborhood.",
      ctaText: "Become a Member",
      ctaLink: "/contact",
      backgroundImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop", // Modern gym
    },
    servicesData: [
      { title: "Cardio & Weights", description: "Extensive range of free weights and machines.", icon: "🏢" },
      { title: "Group Fitness", description: "Zumba, Yoga, and Aerobics classes.", icon: "🎵" },
      { title: "Multi-branch Access", description: "Access any of our branches nationwide.", icon: "🌍" },
      { title: "Certified Trainers", description: "Professional guidance for your goals.", icon: "🎯" }
    ]
  }
];

async function main() {
  console.log("Updating Sandbox Tenant Settings...");

  for (const data of SANDBOXES) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.slug }
    });

    if (!tenant) {
      console.log(`Tenant ${data.slug} not found, skipping.`);
      continue;
    }

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        primaryColor: data.primaryColor,
        tagline: data.tagline,
        address: data.address,
        phone: data.phone,
        email: data.email,
        instagramUrl: data.instagramUrl,
        tiktokUrl: data.tiktokUrl,
        heroData: data.heroData,
        servicesData: data.servicesData,
      },
      update: {
        primaryColor: data.primaryColor,
        tagline: data.tagline,
        address: data.address,
        phone: data.phone,
        email: data.email,
        instagramUrl: data.instagramUrl,
        tiktokUrl: data.tiktokUrl,
        heroData: data.heroData,
        servicesData: data.servicesData,
      }
    });

    console.log(`✅ Updated ${tenant.name} (${data.slug})`);
  }
  
  console.log("All sandbox settings updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
