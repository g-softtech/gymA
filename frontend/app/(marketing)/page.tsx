import Link from "next/link";
import { AnimatedNumber } from "@/components/ui/AnimatedStats";
import { planCatalogService } from "@/lib/billing/StaticPlanCatalogService";
import { PricingCard } from "@/components/billing/PricingCard";
export default function HomePage() {
  const features = [
    { icon: "🔒", title: "Leakproof Access Control", desc: "Tracking strict plan expiration dates automatically." },
    { icon: "💰", title: "Integrated Cash & Digital Revenue Ledgers", desc: "Consolidated multi-gateway billing management." },
    { icon: "🏋️", title: "Trainer Deployment Portal", desc: "Assign and manage trainers, schedules, and clients." },
    { icon: "📝", title: "Built-in Gym Blog Management Feed", desc: "Publish news, updates, and articles directly to your members." },
    { icon: "🌐", title: "White-Label No-Code Website Configuration", desc: "Launch a custom branded domain in seconds." },
    { icon: "🤖", title: "Interactive AI Fitness Coach", desc: "24/7 personalized Gemini workouts." },
    { icon: "🥗", title: "Dynamic Nutrition & Meal Tracking", desc: "Log calories and macros with regional African foods." },
    { icon: "📅", title: "Class & Trainer Booking Calendars", desc: "Seamlessly reserve slots with favorite instructors." },
    { icon: "📈", title: "Personal Milestone Progress Loggers", desc: "Track weight, body fat, and strength gains." },
    { icon: "📲", title: "Frictionless QR Code Attendance Generation", desc: "One-tap check-in directly at the front desk." },
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

          {/* Hero Section Mockup (Software Meets Steel Concept) */}
          <div className="mt-16 mx-auto max-w-5xl relative group px-4 sm:px-0">
            {/* Background Image Layer */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
              <div 
                className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center"
              />
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]"></div>
              
              {/* Floating UI Layer */}
              <div className="relative p-6 sm:p-12">
                <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col">
                  {/* Browser Header */}
                  <div className="bg-gray-800/60 px-4 py-3 flex items-center gap-2 border-b border-gray-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="mx-auto bg-gray-900/50 rounded-md px-3 py-1 text-xs text-gray-400 font-mono border border-gray-700/50">
                      admin.cortexfit.app
                    </div>
                  </div>
                  
                  {/* High-Density Data Dashboard */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                    {/* Sidebar */}
                    <div className="hidden md:block col-span-3 space-y-3">
                      <div className="h-8 w-24 bg-indigo-500/20 rounded-md mb-6 border border-indigo-500/30"></div>
                      {['Overview', 'Members', 'Finances', 'Schedule', 'Settings'].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === 0 ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
                          <div className={`w-4 h-4 rounded ${i===0?'bg-indigo-400':'bg-gray-500'}`}></div>
                          <span className="text-sm font-medium">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Main Content */}
                    <div className="col-span-1 md:col-span-9 space-y-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
                          <p className="text-sm text-gray-400">Welcome back, Superadmin</p>
                        </div>
                      </div>

                      {/* Top Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Revenue Card */}
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
                          <p className="text-sm text-gray-400 mb-1">Revenue (Active)</p>
                          <div className="flex items-end justify-between">
                            <p className="text-2xl font-bold text-white">₦1,420,000</p>
                            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-1 rounded-md">
                              +12% <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            </span>
                          </div>
                        </div>

                        {/* Members Card */}
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm text-gray-400">Total Members</p>
                            <span className="text-xs text-indigo-400 font-medium">Active Subscriptions: 468</span>
                          </div>
                          <p className="text-2xl font-bold text-white mb-2">482</p>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: '97%' }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Activity Feed */}
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
                        <p className="text-sm font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Live Activity Feed</p>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-sm">📲</div>
                            <div>
                              <p className="text-sm font-medium text-blue-300">Live Alert: QR Check-in verified at main desk 1 min ago.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-sm">👤</div>
                            <div>
                              <p className="text-sm text-gray-200">Member: Awodiya • Plan: Gold Pro • Status: <span className="text-emerald-400 font-bold">Active</span> • Expires: 23 Jul 2026</p>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-indigo-600 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-white">
                <AnimatedNumber value={s.value} />
              </p>
              <p className="text-indigo-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-foreground mb-4">
              Everything your gym needs
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From member check-ins to AI-powered coaching — CortexFit has every feature a modern African gym needs to thrive.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card text-card-foreground rounded-2xl p-6 border border-border hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section id="ai" className="py-24 px-6 bg-background">
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
                  href="/onboarding"
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
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-extrabold text-foreground text-center mb-16">
            Loved by gym owners across Nigeria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card text-card-foreground rounded-2xl p-6 border border-border shadow-sm">
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for gyms of all sizes. Billed annually to give you 2 months free.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-6">
            {/* Dynamic Plans */}
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
                    {p.code === "APEX" ? "Talk to Sales" : "Start Free Trial"}
                  </Link>
                )} 
              />
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
