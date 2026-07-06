import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { RecommendationService } from "@/lib/intelligence/recommendationService";
import { systemClock } from "@/lib/time/SystemClock";
import IntelligenceClient from "./IntelligenceClient";

export default async function IntelligenceDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();

  if (!session?.user) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) notFound();

  // Generate actionable intent objects
  const service = new RecommendationService(systemClock);
  const recommendations = await service.generateAllRecommendations(tenant.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Intelligence <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs tracking-widest uppercase font-bold">Beta</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Proactive recommendations based on member behavior and billing health.
        </p>
      </div>

      <IntelligenceClient 
        tenantId={tenant.id} 
        tenantSlug={slug}
        initialRecommendations={recommendations} 
      />
    </div>
  );
}
