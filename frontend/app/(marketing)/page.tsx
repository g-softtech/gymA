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

          {/* Hero Section Mockup (MacBook/iPad simulation) */}
          <div className="mt-16 mx-auto max-w-4xl relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden aspect-[16/9] flex flex-col">
              {/* Browser/Device Header */}
              <div className="bg-gray-800/80 px-4 py-3 flex items-center gap-2 border-b border-gray-700/50 backdrop-blur-sm">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto bg-gray-900/50 rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-gray-700/50">
                  admin.cortexfit.app
                </div>
              </div>
              
              {/* Dashboard Content Mockup */}
              <div className="flex-1 p-6 grid grid-cols-12 gap-6 relative overflow-hidden bg-gray-900">
                {/* Sidebar */}
                <div className="col-span-3 space-y-4">
                  <div className="h-8 w-24 bg-indigo-500/20 rounded-md mb-8 border border-indigo-500/30"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-4 rounded-md ${i === 0 ? 'bg-indigo-500/40 w-full' : 'bg-gray-800 w-3/4'}`}></div>
                  ))}
                </div>
                {/* Main Content */}
                <div className="col-span-9 space-y-6">
                  {/* Top nav */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-6 w-32 bg-gray-800 rounded-md"></div>
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-800"></div>
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
                    </div>
                  </div>
                  {/* Chart Area */}
                  <div className="h-40 rounded-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 p-4 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                      <div key={i} className="w-full bg-indigo-500/50 rounded-t-sm" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                  {/* Metrics Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 rounded-xl bg-gray-800/50 border border-gray-700/50 p-4 flex flex-col justify-between">
                        <div className="h-3 w-16 bg-gray-700 rounded"></div>
                        <div className="h-6 w-24 bg-gray-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              <div className="relative flex justify-center lg:justify-end">
                {/* Glow behind phone */}
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-3xl"></div>
                
                {/* Phone mockup */}
                <div className="relative w-[280px] h-[560px] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-xl w-32 mx-auto z-20"></div>
                  
                  {/* Chat UI Header */}
                  <div className="bg-indigo-600 pt-8 pb-4 px-6 text-center shadow-md z-10">
                    <p className="text-white font-bold text-sm">Gemini Fitness Coach</p>
                    <p className="text-indigo-200 text-xs">Online</p>
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="flex-1 bg-gray-900 p-4 overflow-hidden flex flex-col gap-4 text-sm relative">
                    <div className="self-end bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                      <p>Can you suggest a high-protein Nigerian meal plan?</p>
                    </div>
                    
                    <div className="self-start bg-gray-800 text-gray-100 p-3 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm border border-gray-700/50">
                      <p className="mb-2">Absolutely! Here is a macro-optimized meal for your goals:</p>
                      <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700/50">
                        <p className="font-bold text-emerald-400 mb-1">Dinner: Chicken Suya & Salad</p>
                        <ul className="space-y-1 text-xs text-gray-300">
                          <li className="flex justify-between"><span>Calories:</span> <span className="font-mono">450 kcal</span></li>
                          <li className="flex justify-between"><span>Protein:</span> <span className="font-mono">55g</span></li>
                          <li className="flex justify-between"><span>Carbs:</span> <span className="font-mono">15g</span></li>
                          <li className="flex justify-between"><span>Fat:</span> <span className="font-mono">20g</span></li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="self-start bg-gray-800 text-gray-100 p-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm border border-gray-700/50 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      <p className="text-xs text-gray-400 italic">Generating workout routine...</p>
                    </div>
                  </div>
                  
                  {/* Input area */}
                  <div className="bg-gray-800 p-4 border-t border-gray-700/50">
                    <div className="bg-gray-900 rounded-full px-4 py-2 text-gray-400 text-xs border border-gray-700">
                      Message Gemini...
                    </div>
                  </div>
                </div>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Everything you need to scale your fitness business, all in one plan.
            </p>
          </div>
          
          <div className="max-w-md mx-auto relative group">
            {/* Glow behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="relative bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl flex flex-col text-center">
              <div className="inline-block mx-auto bg-indigo-500/20 text-indigo-300 font-semibold px-4 py-1.5 rounded-full text-sm mb-6 border border-indigo-500/30">
                Scale-Up Enterprise Plan
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">₦35,000</span>
                <span className="text-gray-400 font-medium"> / month</span>
              </div>
              
              <ul className="space-y-4 mb-10 text-left">
                {[
                  "Up to 500 Active Members",
                  "Paystack & Flutterwave Automation",
                  "Unlimited Gemini AI Coaching",
                  "Custom Domain & Branding Builder",
                  "Dynamic QR Access Control"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="/onboarding"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition shadow-lg shadow-indigo-500/25 block"
              >
                Start 14-Day Free Trial
              </Link>
              <p className="text-gray-500 text-xs mt-4">Cancel anytime. No hidden fees.</p>
            </div>
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
