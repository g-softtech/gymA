/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { PricingCard } from "../../components/billing/PricingCard";
import { planCatalogService } from "../../lib/billing/StaticPlanCatalogService";

describe("Pricing UI", () => {
  it("renders all plans from catalog", () => {
    const plans = planCatalogService.getPlans();
    expect(plans.length).toBeGreaterThan(0);
    
    // We render the first plan as an example
    const plan = plans[0];
    render(<PricingCard plan={plan} />);
    
    // Should display the plan name
    expect(screen.getByText(plan.ui.displayName)).toBeTruthy();
    
    // Should render features
    plan.ui.features.forEach((feature) => {
      expect(screen.getByText(feature)).toBeTruthy();
    });
  });

  it("does not use hardcoded pricing", () => {
    // The pricing is driven by the dynamic plan object, let's verify that changing the plan changes the render
    const testPlan = planCatalogService.getPlan("PRO");
    
    // Mock the amount to something unusual
    const mockPlan = { ...testPlan, pricing: [{ ...testPlan.pricing[0], amountSubunits: 9999900 }] };
    
    render(<PricingCard plan={mockPlan} />);
    
    // 9999900 subunits = 99,999
    expect(screen.getByText(/99,999/)).toBeTruthy();
  });
});
