import Link from "next/link";
import { planCatalogService } from "@/lib/billing/StaticPlanCatalogService";
import { PricingCard } from "@/components/billing/PricingCard";

export default function PricingPage() {
  const faqs = [
    { q: "Is there a free trial?", a: "Yes! You can try our demo gym at cortexfit with full access to all features. No credit card required." },
    { q: "Which payment methods are supported?", a: "We integrate with Paystack which supports cards, bank transfers, USSD, and mobile money across Nigeria and Africa." },
    { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle." },
    { q: "Is my data safe?", a: "Yes. Each gym's data is completely isolated. We use encryption at rest and in transit, and never share your data." },
    { q: "Do you support multiple currencies?", a: "Currently we support NGN (Naira) natively. GHS, KES, and ZAR support is coming soon." },
    { q: "What is the AI Coach powered by?", a: "Our AI features are powered by Google Gemini, Google's most capable AI model. It understands Nigerian culture, local foods, and fitness needs — delivering smart, personalised coaching at scale." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-indigo-200">
            No hidden fees. No surprises. Just powerful gym management tools at fair Nigerian prices.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-6 items-start">
            {planCatalogService.getPlans().map((plan) => (
              <PricingCard 
                key={plan.code} 
                plan={plan} 
                renderAction={(p) => (
                  <Link 
                    href={p.code === "APEX" ? "/contact" : `/onboarding?plan=${p.code.toLowerCase()}`} 
                    className={`w-full font-bold px-6 py-3 rounded-xl transition text-center block ${
                      p.ui.isMostPopular 
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200" 
                        : p.code === "APEX" 
                          ? "bg-gray-900 text-white hover:bg-gray-800" 
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    {p.code === "APEX" ? "Talk to Sales" : "Get Started"}
                  </Link>
                )} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="font-semibold text-gray-900 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Not sure which plan is right for you?</h2>
          <p className="text-indigo-200 mb-8">
            Talk to our team and we will help you find the perfect fit for your gym.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition">
              Talk to Sales
            </Link>
            <Link href="/onboarding" className="border-2 border-white/40 font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
