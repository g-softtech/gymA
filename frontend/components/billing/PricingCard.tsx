import React from "react";
import { PlatformPlanConfig } from "@/lib/billing/pricingConfig";

interface PricingCardProps {
  plan: PlatformPlanConfig;
  renderAction?: (plan: PlatformPlanConfig) => React.ReactNode;
}

export function PricingCard({ plan, renderAction }: PricingCardProps) {
  const amountStr = plan.yearlyPrice.toLocaleString();
  const currencySymbol = "₦";
  const interval = "year";
  const isMostPopular = plan.recommended;

  return (
    <div
      className={`relative bg-card text-card-foreground rounded-3xl p-8 flex flex-col transition-all h-full ${
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

      <h3 className="text-xl font-bold text-foreground mb-2">{plan.displayName}</h3>
      <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{plan.marketingDescription}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-extrabold text-foreground">{currencySymbol}{amountStr}</span>
        <span className="text-muted-foreground text-sm"> / {interval}</span>
      </div>

      <ul className="space-y-4 mb-8 flex-1 text-sm text-muted-foreground">
        {plan.comparisonFeatures.map((feature, i) => (
          <li key={`feature-${i}`} className={`flex gap-3 ${!feature.included ? 'text-gray-400 opacity-70' : ''}`}>
            {feature.included ? (
              <span className="text-indigo-600 font-bold">✓</span>
            ) : (
              <span className="text-gray-300 font-bold">✗</span>
            )}
            <span>
              {feature.name} {feature.text && <span className="font-semibold block text-xs mt-0.5">{feature.text}</span>}
            </span>
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
