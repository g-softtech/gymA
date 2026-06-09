import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "₦15,000",
      period: "/month",
      desc: "Perfect for small gyms just getting started",
      color: "border-gray-200",
      buttonStyle: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
      features: [
        "Up to 50 members",
        "1 trainer account",
        "Member management",
        "Paystack payments",
        "Basic attendance tracking",
        "Member dashboard",
        "Email support",
      ],
      notIncluded: ["AI Coach", "Community features", "Advanced analytics", "Multiple locations"],
    },
    {
      name: "Professional",
      price: "₦35,000",
      period: "/month",
      desc: "For growing gyms that need more power",
      color: "border-indigo-500 ring-2 ring-indigo-500",
      buttonStyle: "bg-indigo-600 text-white hover:bg-indigo-700",
      badge: "Most Popular",
      features: [
        "Up to 250 members",
        "5 trainer accounts",
        "Everything in Starter",
        "AI Fitness Coach",
        "AI Nutrition Coach (Nigerian foods)",
        "Progress tracking & analytics",
        "Community & challenges",
        "Trainer booking system",
        "Revenue reports",
        "Priority support",
      ],
      notIncluded: ["Multiple locations"],
    },
    {
      name: "Enterprise",
      price: "₦80,000",
      period: "/month",
      desc: "For gym chains and serious fitness businesses",
      color: "border-gray-200",
      buttonStyle: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
      features: [
        "Unlimited members",
        "Unlimited trainers",
        "Everything in Professional",
        "Multiple gym locations",
        "Multi-tenant management",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "SLA guarantee (99.9% uptime)",
        "Phone & WhatsApp support",
      ],
      notIncluded: [],
    },
  ];

  const faqs = [
    { q: "Is there a free trial?", a: "Yes! You can try our demo gym at ironforge with full access to all features. No credit card required." },
    { q: "Which payment methods are supported?", a: "We integrate with Paystack which supports cards, bank transfers, USSD, and mobile money across Nigeria and Africa." },
    { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle." },
    { q: "Is my data safe?", a: "Yes. Each gym's data is completely isolated. We use encryption at rest and in transit, and never share your data." },
    { q: "Do you support multiple currencies?", a: "Currently we support NGN (Naira) natively. GHS, KES, and ZAR support is coming soon." },
    { q: "What is the AI Coach powered by?", a: "Our AI features are powered by Claude, Anthropic's AI assistant. It understands Nigerian culture and nutrition." },
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
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl border-2 p-7 relative ${plan.color}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>

                <Link
                  href="/contact"
                  className={`block w-full text-center font-bold py-3 rounded-xl transition mb-6 text-sm ${plan.buttonStyle}`}
                >
                  Get Started
                </Link>

                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 shrink-0 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-400 line-through">
                      <span className="shrink-0 mt-0.5">✗</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
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
            <Link href="/gym/ironforge" className="border-2 border-white/40 font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition">
              Try Demo Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
