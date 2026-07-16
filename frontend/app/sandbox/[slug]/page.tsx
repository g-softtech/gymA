import React from "react";
import { SandboxProvider } from "@/lib/sandbox/context";
import { sandboxTenant, sandboxPlans, sandboxMembers, generateSandboxRevenue } from "@/lib/sandbox/mockData";
import { redirect } from "next/navigation";
import { SandboxClientDashboard } from "./SandboxClientDashboard";

export default async function SandboxPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug !== "eco-fitness-hub") {
    // For now, only Eco Fitness Hub is mocked
    redirect("/auth/signin");
  }

  const { mrr, outstanding } = generateSandboxRevenue();

  return (
    <SandboxProvider isSandbox={true}>
      <SandboxClientDashboard 
        tenant={sandboxTenant}
        plans={sandboxPlans}
        members={sandboxMembers}
        mrr={mrr}
        outstanding={outstanding}
      />
    </SandboxProvider>
  );
}
