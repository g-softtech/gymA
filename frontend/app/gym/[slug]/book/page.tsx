import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import PublicBookingClient from "@/components/gym/PublicBookingClient";

export const metadata = {
  title: "Book a Session | CortexFit",
};

export default async function GymBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { settings: true },
  });

  if (!tenant) notFound();

  // Fetch upcoming classes (from now until +14 days)
  const now = new Date();
  const nextTwoWeeks = new Date();
  nextTwoWeeks.setDate(now.getDate() + 14);

  const classes = await prisma.classSession.findMany({
    where: {
      tenantId: tenant.id,
      startTime: { gte: now, lte: nextTwoWeeks },
    },
    include: {
      instructor: { include: { user: { select: { name: true, image: true } } } },
      _count: { select: { bookings: { where: { status: { in: ["PENDING", "CONFIRMED"] } } } } },
    },
    orderBy: { startTime: "asc" },
  });

  // Fetch trainers who allow public booking
  const trainers = await prisma.trainerProfile.findMany({
    where: {
      user: { tenantId: tenant.id },
      showOnWebsite: true,
    },
    include: { user: { select: { name: true, image: true } } },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Book a Session
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 sm:mt-4">
            Join a group class or book a 1-on-1 session with our expert trainers at {tenant.name}.
          </p>
        </div>

        <PublicBookingClient 
          tenantId={tenant.id} 
          slug={slug} 
          classes={classes} 
          trainers={trainers} 
          brandColor={tenant.settings?.primaryColor || "#4F46E5"} 
        />
      </div>
    </div>
  );
}
