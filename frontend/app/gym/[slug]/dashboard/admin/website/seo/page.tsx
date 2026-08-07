import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { generateAIAssistantPrompt } from "@/lib/seo/ai";

export default async function SeoHealthPage({
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

  const settings = tenant.settings;
  
  // Calculate SEO Health Score
  let score = 0;
  const maxScore = 100;
  
  const hasLogo = !!settings?.logoUrl;
  const hasDescription = !!settings?.tagline;
  const descLength = settings?.tagline?.length || 0;
  const hasAddress = !!settings?.address;
  const hasHours = !!settings?.openingHours;
  const hasCustomDomain = !!settings?.customDomain;
  const hasGoogleBusiness = false; // Mocked until we add the field to DB
  
  if (hasLogo) score += 10;
  if (hasDescription && descLength > 150) score += 20;
  else if (hasDescription) score += 10;
  if (hasAddress) score += 20;
  if (hasHours) score += 15;
  if (hasCustomDomain) score += 15;
  if (hasGoogleBusiness) score += 20;
  
  // Determine Tier
  let tier = "Bronze";
  let tierColor = "bg-amber-100 text-amber-800 border-amber-200";
  if (score >= 90) {
    tier = "Gold";
    tierColor = "bg-yellow-100 text-yellow-800 border-yellow-300";
  } else if (score >= 70) {
    tier = "Silver";
    tierColor = "bg-slate-200 text-slate-700 border-slate-300";
  }

  // Get AI Recommendations
  const recommendations = generateAIAssistantPrompt({
    hasLogo,
    descLength,
    hasAddress,
    hasHours,
    hasGoogleBusiness,
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">SEO Health & Visibility</h1>
        <p className="text-muted-foreground mt-2">
          Track how well your gym ranks on Google. Follow the AI recommendations to unlock featured placements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-card-foreground">Optimization Score</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${tierColor}`}>
              {tier} Tier
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={377} 
                  strokeDashoffset={377 - (377 * score) / 100}
                  className="text-primary transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{score}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <p className="text-sm text-card-foreground">
                {score >= 90 ? "Excellent work! Your gym is fully optimized and eligible for the CortexFit Homepage Directory." 
                : score >= 70 ? "Great progress. Complete a few more steps to reach Gold tier and unlock featured listings."
                : "Your public page is live, but missing key information that stops local customers from finding you."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <span className="text-xl">✨</span> AI SEO Assistant
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your current profile, here is what you should do next to rank higher for "Gyms near me".
          </p>
          <ul className="space-y-3">
            {recommendations.length > 0 ? recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary font-bold">→</span>
                <span>{rec}</span>
              </li>
            )) : (
              <li className="text-sm text-emerald-600 font-medium">
                You have completed all AI recommendations! Keep collecting 5-star reviews to maintain your ranking.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-card-foreground">SEO Checklist</h3>
        </div>
        <div className="divide-y divide-border">
          <ChecklistItem label="Upload a High-Quality Logo" completed={hasLogo} />
          <ChecklistItem label="Write a detailed description (150+ words)" completed={hasDescription && descLength > 150} />
          <ChecklistItem label="Add your Physical Address" completed={hasAddress} />
          <ChecklistItem label="Set Opening Hours" completed={hasHours} />
          <ChecklistItem label="Connect a Custom Domain" completed={hasCustomDomain} />
          <ChecklistItem label="Connect Google Business Profile" completed={hasGoogleBusiness} />
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${completed ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
        {completed ? "✓" : ""}
      </div>
      <span className={`text-sm font-medium ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
        {label}
      </span>
    </div>
  );
}
