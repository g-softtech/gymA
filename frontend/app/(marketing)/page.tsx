import Link from "next/link";

export default function HomePage() {
  const features = [
    { icon: "👥", title: "Member Management", desc: "Track memberships, subscriptions, attendance, and payments in one place." },
    { icon: "🏋️", title: "Trainer Module", desc: "Trainers manage clients, bookings, workout plans, and progress tracking." },
    { icon: "💳", title: "Paystack Payments", desc: "Seamless Nigerian payment integration. Accept cards, bank transfers, and USSD." },
    { icon: "🤖", title: "AI Fitness Coach", desc: "Google Gemini generates personalised workout and Nigerian meal plans for members." },
    { icon: "🥗", title: "Nutrition Planner", desc: "60+ Nigerian foods database with calorie tracking and macro breakdowns." },
    { icon: "🏅", title: "Community & Challenges", desc: "Social feed, fitness challenges, leaderboards, and achievement badges." },
    { icon: "📊", title: "Revenue Analytics", desc: "Real-time revenue charts, subscription tracking, and financial reports." },
    { icon: "📱", title: "Multi-Tenant SaaS", desc: "Run multiple gym locations under one platform with complete data isolation." },
  ];

  const stats = [
    { value: "500+", label: "Gyms Powered" },
    { value: "50,000+", label: "Active Members" },
    { value: "₦2B+", label: "Processed Monthly" },
    { value: "99.9%", label: "Uptime" },
  ];

  const testimonials = [
    {
      name: "Adebayo Okonkwo",
      role: "Owner, CortexFit Fitness Lagos",
      text: "CortexFit transformed how we run our gym. The AI meal planner with Nigerian foods is a game changer for our members.",
      avatar: "A",
    },
    {
      name: "Chidinma Eze",
      role: "Head Trainer, FitZone Abuja",
      text: "Managing 80+ clients used to be chaotic. Now I track everyone's progress, bookings, and workouts from one dashboard.",
      avatar: "C",
    },
    {
      name: "Olumide Fashola",
      role: "CEO, PowerHouse Gym Chain",
      text: "We run 5 locations seamlessly on CortexFit. The multi-tenant system and revenue analytics are exactly what we needed.",
      avatar: "O",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now with AI Fitness Coaching powered by Google Gemini
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            The Complete Gym
            <br />
            <span className="text-indigo-300">Management Platform</span>
            <br />
            for Africa
          </h1>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Manage members, trainers, payments, nutrition, and community — all in one powerful SaaS platform built for Nigerian and African gyms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition text-base shadow-xl shadow-indigo-500/20"
            >
              🚀 Register Your Gym
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition text-base"
            >
              View Pricing →
            </Link>
          </div>
          <p className="text-indigo-300 text-sm mt-6">No credit card required · Set up in 5 minutes</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-600 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-indigo-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Everything your gym needs
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              From member check-ins to AI-powered coaching — CortexFit has every feature a modern African gym needs to thrive.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section id="ai" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-10 text-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm mb-6">
                  🤖 Powered by Google Gemini AI
                </div>
                <h2 className="text-3xl font-extrabold mb-4">
                  AI Fitness Coach that understands Nigerian nutrition
                </h2>
                <p className="text-indigo-200 mb-6 leading-relaxed">
                  Our AI coach generates personalised workout plans and Nigerian meal plans — featuring Jollof Rice, Egusi Soup, Suya, Moin Moin, and 60+ local foods with precise macro breakdowns.
                </p>
                <Link
                  href="/gym/cortexfit/dashboard/member/ai"
                  className="inline-flex bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition"
                >
                  Try AI Coach →
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "💪", text: "Generate personalised workout plans" },
                  { icon: "🥗", text: "Nigerian meal plans with calorie tracking" },
                  { icon: "📊", text: "AI progress analysis and recommendations" },
                  { icon: "💬", text: "24/7 AI chat coach for any fitness question" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-16">
            Loved by gym owners across Nigeria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-indigo-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-6">
            Ready to transform your gym?
          </h2>
          <p className="text-xl text-indigo-200 mb-10">
            Join 500+ gyms already using CortexFit to grow their business and serve their members better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white/40 font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
