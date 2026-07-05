import React from "react";
import { PlatformPlanConfig } from "@/lib/billing/pricing.config";

interface PricingCardProps {
  plan: PlatformPlanConfig;
  renderAction?: (plan: PlatformPlanConfig) => React.ReactNode;
}

export function PricingCard({ plan, renderAction }: PricingCardProps) {
  // Format the price. Assuming we are using the first pricing entry and it is NGN yearly.
  const priceConfig = plan.pricing[0];
  const amountStr = priceConfig 
    ? (priceConfig.amountSubunits / 100).toLocaleString() 
    : "0";
  const currencySymbol = priceConfig?.currency === "NGN" ? "₦" : "$";
  const interval = priceConfig?.interval === "year" ? "year" : "month";

  const isMostPopular = plan.ui.isMostPopular;

  return (
    <div
      className={`relative bg-card text-card-foreground rounded-3xl p-8 flex flex-col transition-all ${
        isMostPopular
          ? "border-2 border-primary shadow-xl shadow-primary/20 md:-translate-y-2"
          : "border border-border shadow-sm hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      {isMostPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
          Most Popular
        </div>
      )}

      <h3 className="text-xl font-bold text-foreground mb-2">{plan.ui.displayName}</h3>
      <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{plan.ui.description}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-extrabold text-foreground">{currencySymbol}{amountStr}</span>
        <span className="text-muted-foreground text-sm"> / {interval}</span>
      </div>

      <ul className="space-y-4 mb-8 flex-1 text-sm text-muted-foreground">
        {plan.ui.features.map((feature, i) => (
          <li key={`feature-${i}`} className="flex gap-3">
            <span className="text-indigo-600 font-bold">✓</span> {feature}
          </li>
        ))}
        {plan.ui.notIncluded.map((feature, i) => (
          <li key={`not-included-${i}`} className="flex gap-3 text-gray-400 opacity-70">
            <span className="text-gray-300 font-bold">✗</span> {feature}
          </li>
        ))}
      </ul>

      {renderAction && (
        <div className="mt-auto">
          {renderAction(plan)}
        </div>
      )}
    </div>
  );
}
