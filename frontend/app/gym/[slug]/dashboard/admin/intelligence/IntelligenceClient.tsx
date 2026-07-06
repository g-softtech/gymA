"use client";

import { useState } from "react";
import { ActionableRecommendation, SimulationResult } from "@/lib/intelligence/types";
import { format } from "date-fns";
import { ActionExecutor } from "@/lib/intelligence/actionExecutor";
import { toast } from "react-hot-toast";

export default function IntelligenceClient({
  tenantId,
  tenantSlug,
  initialRecommendations,
}: {
  tenantId: string;
  tenantSlug: string;
  initialRecommendations: ActionableRecommendation[];
}) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [simulations, setSimulations] = useState<Record<string, SimulationResult>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Note: We use a Client-side wrapper around ActionExecutor logic for the demo, 
  // but in a real app these methods would invoke Server Actions.
  // We'll mock the server action here to satisfy the UX requirement without exposing secrets.
  const handleSimulate = async (rec: ActionableRecommendation) => {
    setIsProcessing(rec.id);
    try {
      // Send to server in reality. For Phase 5 Demo, we'll calculate locally since it's heuristic.
      const simRate = rec.actionType === "DISCOUNT" ? 0.4 : rec.actionType === "EMAIL" ? 0.15 : 0.5;
      const successRate = rec.confidenceScore * simRate;
      const expectedMrrRetained = (rec.impact.mrrAtRisk || 0) * successRate;
      const expectedCost = rec.actionType === "DISCOUNT" ? (rec.impact.mrrAtRisk || 0) * 0.2 * successRate : 0;

      const sim: SimulationResult = {
        recommendationId: rec.id,
        projectedSuccessRate: Math.round(successRate * 100) / 100,
        expectedMrrRetained: Math.round(expectedMrrRetained),
        expectedCost: Math.round(expectedCost),
        membersReached: rec.targetMemberIds.length,
        risks: [rec.actionType === "DISCOUNT" ? "May condition users to wait for discounts." : "Low email open rates may reduce impact."],
      };

      // Fake network delay for UX realism
      await new Promise(resolve => setTimeout(resolve, 800));

      setSimulations(prev => ({ ...prev, [rec.id]: sim }));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleApprove = async (rec: ActionableRecommendation) => {
    setIsProcessing(rec.id);
    try {
      // Fake network delay for execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`${rec.actionTemplate} successfully queued for execution!`);
      
      // Remove from list
      setRecommendations(prev => prev.filter(r => r.id !== rec.id));
    } finally {
      setIsProcessing(null);
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
        <span className="text-4xl mb-4 block">✨</span>
        <h3 className="text-xl font-bold mb-2">Your Gym is running optimally!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We constantly monitor your members' billing, attendance, and churn risk. There are currently no critical actions required.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendations.map(rec => {
        const sim = simulations[rec.id];

        return (
          <div key={rec.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Col - Info */}
            <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  rec.actionType === "DISCOUNT" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                  rec.actionType === "EMAIL" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}>
                  {rec.actionType}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round(rec.confidenceScore * 100)}% Confidence
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{rec.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{rec.description}</p>
              
              <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Impact at Risk</p>
                  <p className="text-lg font-bold">₦{(rec.impact.mrrAtRisk || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Recommended Action</p>
                  <p className="text-sm font-semibold">{rec.actionTemplate}</p>
                </div>
              </div>
            </div>

            {/* Right Col - Execution / Simulation */}
            <div className="p-6 md:w-80 bg-muted/10 flex flex-col justify-between">
              {!sim ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <p className="text-sm text-muted-foreground mb-4">Run a simulation to estimate the business impact of this action before approving.</p>
                  <button 
                    onClick={() => handleSimulate(rec)}
                    disabled={isProcessing === rec.id}
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isProcessing === rec.id ? "Simulating..." : "Simulate Impact"}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <h4 className="text-sm font-bold border-b pb-2 mb-3">Simulation Results</h4>
                  
                  <div className="space-y-3 mb-4 flex-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Expected Success</span>
                      <span className="font-semibold text-success">{Math.round(sim.projectedSuccessRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Retained MRR</span>
                      <span className="font-semibold text-success">+ ₦{sim.expectedMrrRetained.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Campaign Cost</span>
                      <span className="font-semibold text-destructive">- ₦{sim.expectedCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleApprove(rec)}
                    disabled={isProcessing === rec.id}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isProcessing === rec.id ? "Executing..." : "Approve & Execute"}
                  </button>
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
