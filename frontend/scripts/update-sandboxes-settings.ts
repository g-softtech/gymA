import "dotenv/config";
import { prisma } from "../lib/prisma";

const SANDBOXES = [
  {
    slug: "zenith-yoga-studio",
    primaryColor: "#8b5cf6", // Vibrant Purple
    tagline: "Find Your Center",
    address: "14 Serenity Lane, Victoria Island, Lagos",
    phone: "+234 800 ZEN YOGA",
    email: "namaste@zenithyoga.demo",
    instagramUrl: "https://instagram.com/zenithyoga_demo",
    tiktokUrl: "",
    heroData: {
      headline: "Elevate Your Mind & Body",
      subheadline: "Join our community of mindful practitioners for daily yoga, pilates, and meditation sessions.",
      ctaText: "Book a Class",
      ctaLink: "/schedule",
      backgroundImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1520&auto=format&fit=crop", // Yoga studio
    },
    servicesData: [
      { title: "Vinyasa Flow", description: "Dynamic movements synchronized with breath.", icon: "🌊" },
      { title: "Restorative Yoga", description: "Deep relaxation and prolonged holds for recovery.", icon: "🧘‍♀️" },
      { title: "Pilates Reformer", description: "Core strength and flexibility training.", icon: "💪" },
      { title: "Sound Bath", description: "Meditative acoustic sound healing sessions.", icon: "🎵" }
    ]
  },
  {
    slug: "iron-forge-crossfit",
    primaryColor: "#dc2626", // Intense Red
    tagline: "Forged in Sweat",
    address: "Block B, Industrial Estate, Ikeja, Lagos",
    phone: "+234 800 CROSSFIT",
    email: "wod@ironforge.demo",
    instagramUrl: "https://instagram.com/ironforge_demo",
    tiktokUrl: "https://tiktok.com/@ironforge_demo",
    heroData: {
      headline: "Unleash Your Inner Athlete",
      subheadline: "High-intensity functional training, expert coaching, and an unbreakable community.",
      ctaText: "Drop In Today",
      ctaLink: "/pricing",
      backgroundImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop", // CrossFit box
    },
    servicesData: [
      { title: "WOD Classes", description: "Daily varied high-intensity workouts.", icon: "🔥" },
      { title: "Olympic Lifting", description: "Technical barbell training and strength building.", icon: "🏋️‍♂️" },
      { title: "Endurance", description: "Long-duration aerobic capacity building.", icon: "🏃‍♂️" },
      { title: "Personal Coaching", description: "1-on-1 personalized programming.", icon: "🎯" }
    ]
  },
  {
    slug: "elite-wellness-club",
    primaryColor: "#0f172a", // Premium Dark Navy / Black
    tagline: "The Pinnacle of Wellness",
    address: "The Penthouse, Eko Towers, Victoria Island, Lagos",
    phone: "+234 800 ELITE 01",
    email: "concierge@elitewellness.demo",
    instagramUrl: "https://instagram.com/elitewellness_demo",
    tiktokUrl: "",
    heroData: {
      headline: "Exclusive Fitness Experience",
      subheadline: "A private members club featuring state-of-the-art equipment, luxury spa treatments, and executive amenities.",
      ctaText: "Apply for Membership",
      ctaLink: "/contact",
      backgroundImage: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop", // Luxury gym
    },
    servicesData: [
      { title: "Executive Gym", description: "Technogym equipment with panoramic city views.", icon: "🏢" },
      { title: "Luxury Spa", description: "Sauna, steam room, and bespoke massage therapy.", icon: "🧖‍♂️" },
      { title: "Private Trainers", description: "Elite coaches dedicated to your goals.", icon: "⭐" },
      { title: "Nutrition Concierge", description: "Personalized meal prep and dietary planning.", icon: "🥗" }
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
