import Link from "next/link";
import { ArrowRight, Building, User, Users } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function DemoLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="mb-6 inline-block">
            <span className="bg-indigo-500/30 text-indigo-100 text-sm font-semibold px-4 py-1.5 rounded-full border border-indigo-400/30 shadow-inner">
              CortexFit Live Demo
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-8">
            Transform Your Gym Operations With <span className="text-indigo-300">Intelligent Automation</span>
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100/90 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            CortexFit helps gyms automate check-ins, subscription billing, trainer bookings, member engagement and fitness management from one secure platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <a
              href="#demo-selector"
              className="bg-white text-indigo-900 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 hover:scale-105 transition-all text-lg shadow-xl shadow-indigo-900/50 flex items-center justify-center gap-2"
            >
              Experience CortexFit Live Demo <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/signup"
              className="bg-indigo-800/50 border border-indigo-400/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-800 transition-all text-lg shadow-lg"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* 2. ECOSYSTEM / FEATURE SECTIONS */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">One Connected Ecosystem</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">See how CortexFit seamlessly connects owners, trainers, and members into a unified operating system.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Gym Owner */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="bg-indigo-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Building className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Gym Owner Experience</h3>
            <p className="text-indigo-600 font-medium mb-4">"Run your entire fitness business"</p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-2">✓ Member management</li>
              <li className="flex items-center gap-2">✓ Subscription billing</li>
              <li className="flex items-center gap-2">✓ Revenue analytics</li>
              <li className="flex items-center gap-2">✓ Attendance tracking</li>
              <li className="flex items-center gap-2">✓ Gym insights</li>
            </ul>
          </div>

          {/* Trainer */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="bg-emerald-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <User className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Trainer Experience</h3>
            <p className="text-emerald-600 font-medium mb-4">"Help members achieve better results"</p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-2">✓ Client management</li>
              <li className="flex items-center gap-2">✓ Workout plans</li>
              <li className="flex items-center gap-2">✓ Booking management</li>
              <li className="flex items-center gap-2">✓ Progress tracking</li>
            </ul>
          </div>

          {/* Member */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="bg-rose-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Member Experience</h3>
            <p className="text-rose-600 font-medium mb-4">"Keep members engaged beyond workouts"</p>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-2">✓ Trainer booking</li>
              <li className="flex items-center gap-2">✓ AI fitness assistant</li>
              <li className="flex items-center gap-2">✓ Community</li>
              <li className="flex items-center gap-2">✓ Fitness progress</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. DEMO SELECTOR */}
      <section id="demo-selector" className="bg-indigo-50 py-24 px-6 border-t border-indigo-100/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Choose Your Experience</h2>
          <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
            Select a role below to explore the Live Demo. You will be authenticated automatically as a predefined demo user.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Owner Auth Form */}
            <form action="/api/demo/impersonate" method="POST" className="flex flex-col">
              <input type="hidden" name="role" value="ADMIN" />
              <input type="hidden" name="email" value="owner@demo.cortexfit.com" />
              <button 
                type="submit" 
                className="group relative flex-1 bg-white hover:bg-indigo-600 transition-colors rounded-2xl p-8 shadow-md hover:shadow-xl border-2 border-transparent hover:border-indigo-600 text-left overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                <div className="bg-indigo-100 group-hover:bg-indigo-500 w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <Building className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-white mb-2 transition-colors">Explore as Gym Owner</h3>
                <p className="text-sm text-slate-500 group-hover:text-indigo-100 transition-colors">Manage CortexFit Elite Performance Center, view analytics, members, and billing.</p>
              </button>
            </form>

            {/* Trainer Auth Form */}
            <form action="/api/demo/impersonate" method="POST" className="flex flex-col">
              <input type="hidden" name="role" value="TRAINER" />
              <input type="hidden" name="email" value="daniel.okoro@demo.cortexfit.com" />
              <button 
                type="submit" 
                className="group relative flex-1 bg-white hover:bg-emerald-600 transition-colors rounded-2xl p-8 shadow-md hover:shadow-xl border-2 border-transparent hover:border-emerald-600 text-left overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="bg-emerald-100 group-hover:bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <User className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-white mb-2 transition-colors">Explore as Trainer</h3>
                <p className="text-sm text-slate-500 group-hover:text-emerald-100 transition-colors">Log in as Daniel Okoro, manage your clients, view bookings, and create workout plans.</p>
              </button>
            </form>

            {/* Member Auth Form */}
            <form action="/api/demo/impersonate" method="POST" className="flex flex-col">
              <input type="hidden" name="role" value="MEMBER" />
              <input type="hidden" name="email" value="member1@demo.cortexfit.com" />
              <button 
                type="submit" 
                className="group relative flex-1 bg-white hover:bg-rose-600 transition-colors rounded-2xl p-8 shadow-md hover:shadow-xl border-2 border-transparent hover:border-rose-600 text-left overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10 group-hover:bg-rose-500/20 transition-colors"></div>
                <div className="bg-rose-100 group-hover:bg-rose-500 w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <Users className="w-6 h-6 text-rose-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-white mb-2 transition-colors">Explore as Member</h3>
                <p className="text-sm text-slate-500 group-hover:text-rose-100 transition-colors">Log in as a gym member, view your subscription, book classes, and check AI nutrition.</p>
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>© {new Date().getFullYear()} CortexFit Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
