import Link from "next/link";

export default function AboutPage() {
  const team = [
    { name: "Emeka Obi", role: "CEO & Co-founder", bio: "Former gym owner with 10 years in the fitness industry across Lagos and Abuja.", avatar: "E" },
    { name: "Amaka Nwosu", role: "CTO", bio: "Software engineer passionate about building technology that empowers African businesses.", avatar: "A" },
    { name: "Tunde Adeyemi", role: "Head of Product", bio: "Product leader focused on creating intuitive tools for gym owners and fitness professionals.", avatar: "T" },
    { name: "Ngozi Okeke", role: "Head of Nutrition", bio: "Registered dietitian specialising in Nigerian dietary patterns and sports nutrition.", avatar: "N" },
  ];

  const values = [
    { icon: "🇳🇬", title: "Built for Africa", desc: "We understand African gym culture, Nigerian cuisine, and local payment methods. Everything is designed for the African market." },
    { icon: "🤖", title: "AI-First", desc: "We leverage cutting-edge AI to give every gym member access to world-class personalised coaching at an affordable price." },
    { icon: "🔒", title: "Privacy & Security", desc: "Your members' data is encrypted, isolated per gym, and never sold. We take data protection seriously." },
    { icon: "🚀", title: "Continuous Innovation", desc: "We ship new features every week based on feedback from our gym community across Nigeria and Africa." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-6">Our Mission</h1>
          <p className="text-xl text-indigo-200 leading-relaxed">
            To empower every gym in Africa with world-class management technology — making professional fitness tools accessible to every gym owner, trainer, and member on the continent.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  CortexFit was born out of frustration. Our founder Emeka ran a gym in Lagos for 8 years using spreadsheets, WhatsApp groups, and manual receipts. When he looked for a modern gym management solution, everything he found was built for American or European gyms — no Paystack integration, no Nigerian foods, no understanding of how African gyms actually operate.
                </p>
                <p>
                  So he built CortexFit. Starting with a simple member tracking tool, the platform has grown into a complete fitness business operating system — complete with AI coaching powered by Google Gemini, Nigerian food databases, Paystack payment integration, and multi-tenant support for gym chains.
                </p>
                <p>
                  Today, CortexFit powers 500+ gyms across Nigeria, Ghana, Kenya, and South Africa, helping gym owners focus on what they do best — transforming lives through fitness.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { year: "2021", event: "CortexFit founded in Lagos, Nigeria" },
                { year: "2022", event: "Paystack integration launched, 100 gyms onboarded" },
                { year: "2023", event: "Trainer module and booking system launched" },
                { year: "2024", event: "AI Coach powered by Google Gemini launched" },
                { year: "2025", event: "500+ gyms, expanding across Africa" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="text-sm font-bold text-indigo-600 w-12 shrink-0">{item.year}</span>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                    <p className="text-sm text-gray-600">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm text-indigo-600 font-medium mt-0.5">{member.role}</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Join the CortexFit family</h2>
          <p className="text-indigo-200 mb-8">Start your free trial today — no credit card required.</p>
          <Link
            href="/gym/cortexfit"
            className="inline-block bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
