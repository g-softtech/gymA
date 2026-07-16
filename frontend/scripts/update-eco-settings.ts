import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "eco-fitness-hub" }
  });

  if (!tenant) {
    console.log("Tenant not found.");
    return;
  }

  const heroData = {
    headline: "Premier Wellness Destination",
    subheadline: "Experience a holistic wellness journey blending fitness, leisure, and recovery.",
    ctaText: "Join The Hub",
    ctaLink: "/pricing",
    backgroundImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
  };

  const servicesData = [
    {
      title: "State-of-the-Art Gym",
      description: "Premium equipment and functional training zones.",
      icon: "🏋️‍♂️"
    },
    {
      title: "Group Classes",
      description: "Yoga, HIIT, Bootcamp, and Aerobics led by experts.",
      icon: "🧘‍♀️"
    },
    {
      title: "Wellness & Recovery",
      description: "Physiotherapy, massage, and spa lounge access.",
      icon: "💆‍♀️"
    },
    {
      title: "Lifestyle Hub",
      description: "Restaurants, cafe experiences, and karaoke pods.",
      icon: "☕"
    }
  ];

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      logoUrl: "https://ecofitnesshub.com/wp-content/uploads/2026/01/EcoFitness-Logo-1.png",
      primaryColor: "#409915",
      tagline: "Your Holistic Wellness Destination",
      address: "JD Park, Plot 793, Kashim Ibrahim Way, Maitama, Abuja",
      phone: "+234 900 000 0000",
      email: "customerservice@ecofitnesshub.com",
      instagramUrl: "https://instagram.com/EcofitnessHub",
      tiktokUrl: "https://tiktok.com/@EcofitnessHub",
      twitterUrl: "",
      facebookUrl: "",
      heroData: JSON.stringify(heroData),
      servicesData: JSON.stringify(servicesData),
    },
    update: {
      logoUrl: "https://ecofitnesshub.com/wp-content/uploads/2026/01/EcoFitness-Logo-1.png",
      primaryColor: "#409915",
      tagline: "Your Holistic Wellness Destination",
      address: "JD Park, Plot 793, Kashim Ibrahim Way, Maitama, Abuja",
      phone: "+234 900 000 0000", // Placeholder if we didn't find the exact phone
      email: "customerservice@ecofitnesshub.com",
      instagramUrl: "https://instagram.com/EcofitnessHub",
      tiktokUrl: "https://tiktok.com/@EcofitnessHub",
      heroData: JSON.stringify(heroData),
      servicesData: JSON.stringify(servicesData),
    }
  });

  console.log("Updated Eco Fitness Hub settings successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
