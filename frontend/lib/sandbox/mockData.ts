import { MembershipStatus } from "@prisma/client";

export const sandboxTenant = {
  id: "sandbox-eco-fitness",
  slug: "eco-fitness-hub",
  name: "Eco Fitness Hub",
  logoUrl: "https://via.placeholder.com/150", // A real logo could be used here
  currency: "NGN",
};

export const sandboxPlans = [
  {
    id: "plan-eco-lite",
    name: "Eco Lite",
    description: "Basic access to gym equipment",
    price: 15000,
    durationDays: 30,
    isActive: true,
  },
  {
    id: "plan-eco-standard",
    name: "Eco Standard",
    description: "Gym + Group Classes",
    price: 25000,
    durationDays: 30,
    isActive: true,
  },
  {
    id: "plan-eco-premium",
    name: "Eco Premium",
    description: "All access + 1 Trainer Session",
    price: 40000,
    durationDays: 30,
    isActive: true,
  },
  {
    id: "plan-vip-elite",
    name: "VIP Elite Club",
    description: "All access + Personal Coach + Spa",
    price: 75000,
    durationDays: 30,
    isActive: true,
  },
];

// Generate dates relative to today
const today = new Date();
const subtractDays = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
const addDays = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

// Active members (9)
const activeMembers = [
  { name: "Chidi Okafor", email: "chidi@example.com", planId: "plan-eco-lite", status: "ACTIVE" as MembershipStatus, daysLeft: 12 },
  { name: "Yinka Balogun", email: "yinka@example.com", planId: "plan-eco-standard", status: "ACTIVE" as MembershipStatus, daysLeft: 20 },
  { name: "Amara Egwu", email: "amara@example.com", planId: "plan-eco-premium", status: "ACTIVE" as MembershipStatus, daysLeft: 5 },
  { name: "Tunde Bakare", email: "tunde@example.com", planId: "plan-vip-elite", status: "ACTIVE" as MembershipStatus, daysLeft: 28 },
  { name: "Ngozi Adeleke", email: "ngozi@example.com", planId: "plan-eco-standard", status: "ACTIVE" as MembershipStatus, daysLeft: 15 },
  { name: "Emeka Uzo", email: "emeka@example.com", planId: "plan-eco-lite", status: "ACTIVE" as MembershipStatus, daysLeft: 2 },
  { name: "Fatima Yusuf", email: "fatima@example.com", planId: "plan-eco-premium", status: "ACTIVE" as MembershipStatus, daysLeft: 25 },
  { name: "Dayo Ojo", email: "dayo@example.com", planId: "plan-eco-standard", status: "ACTIVE" as MembershipStatus, daysLeft: 18 },
  { name: "Kemi Adeyemi", email: "kemi@example.com", planId: "plan-vip-elite", status: "ACTIVE" as MembershipStatus, daysLeft: 10 },
];

// Expired members (4) with outstanding dues
const expiredMembers = [
  { name: "Bayo Olatunji", email: "bayo@example.com", planId: "plan-eco-standard", status: "EXPIRED" as MembershipStatus, daysExpired: 5 },
  { name: "Chioma Nwosu", email: "chioma@example.com", planId: "plan-eco-lite", status: "EXPIRED" as MembershipStatus, daysExpired: 12 },
  { name: "Obinna Eze", email: "obinna@example.com", planId: "plan-eco-premium", status: "EXPIRED" as MembershipStatus, daysExpired: 2 },
  { name: "Zainab Bello", email: "zainab@example.com", planId: "plan-eco-standard", status: "EXPIRED" as MembershipStatus, daysExpired: 20 },
];

// Suspended members (2) - High churn risk
const suspendedMembers = [
  { name: "Ifeanyi Okoro", email: "ifeanyi@example.com", planId: "plan-vip-elite", status: "SUSPENDED" as MembershipStatus, reason: "Multiple failed payments" },
  { name: "Simi Makinde", email: "simi@example.com", planId: "plan-eco-premium", status: "SUSPENDED" as MembershipStatus, reason: "Zero attendance for 3 months" },
];

export const sandboxMembers = [
  ...activeMembers.map((m, i) => {
    const plan = sandboxPlans.find((p) => p.id === m.planId)!;
    return {
      id: `sandbox-member-active-${i}`,
      user: { name: m.name, email: m.email, id: `user-active-${i}` },
      memberProfile: {
        id: `profile-active-${i}`,
        subscriptions: [
          {
            id: `sub-active-${i}`,
            planId: plan.id,
            plan,
            status: m.status,
            startDate: subtractDays(30 - m.daysLeft),
            endDate: addDays(m.daysLeft),
          },
        ],
        // Mock attendance for heatmaps
        attendances: Array.from({ length: Math.floor(Math.random() * 15) + 5 }).map((_, j) => ({
          checkInTime: subtractDays(j * 2),
        })),
        churnScore: Math.floor(Math.random() * 30), // Low risk
      },
      outstandingDues: 0,
    };
  }),
  ...expiredMembers.map((m, i) => {
    const plan = sandboxPlans.find((p) => p.id === m.planId)!;
    return {
      id: `sandbox-member-expired-${i}`,
      user: { name: m.name, email: m.email, id: `user-expired-${i}` },
      memberProfile: {
        id: `profile-expired-${i}`,
        subscriptions: [
          {
            id: `sub-expired-${i}`,
            planId: plan.id,
            plan,
            status: m.status,
            startDate: subtractDays(30 + m.daysExpired),
            endDate: subtractDays(m.daysExpired),
          },
        ],
        attendances: [],
        churnScore: Math.floor(Math.random() * 40) + 50, // Medium/High risk
      },
      outstandingDues: plan.price,
    };
  }),
  ...suspendedMembers.map((m, i) => {
    const plan = sandboxPlans.find((p) => p.id === m.planId)!;
    return {
      id: `sandbox-member-suspended-${i}`,
      user: { name: m.name, email: m.email, id: `user-suspended-${i}` },
      memberProfile: {
        id: `profile-suspended-${i}`,
        subscriptions: [
          {
            id: `sub-suspended-${i}`,
            planId: plan.id,
            plan,
            status: m.status,
            startDate: subtractDays(60),
            endDate: subtractDays(30),
          },
        ],
        attendances: [],
        churnScore: 95, // Very High risk
        suspensionReason: m.reason,
      },
      outstandingDues: m.reason.includes("payment") ? plan.price * 2 : 0,
    };
  }),
];

export const generateSandboxRevenue = () => {
  let mrr = 0;
  let outstanding = 0;

  sandboxMembers.forEach((m) => {
    const sub = m.memberProfile.subscriptions[0];
    if (sub.status === "ACTIVE") {
      mrr += sub.plan.price;
    }
    if (m.outstandingDues) {
      outstanding += m.outstandingDues;
    }
  });

  return { mrr, outstanding };
};
