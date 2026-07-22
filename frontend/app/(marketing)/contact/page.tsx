import ContactForm from "@/components/marketing/ContactForm";

export default function ContactPage() {
  const contactInfo = [
    { icon: "📧", label: "Email", value: "info@thecortexsystems.com", href: "mailto:info@thecortexsystems.com" },
    { icon: "📱", label: "WhatsApp", value: "07013981891", href: "https://wa.me/2347013981891" },
    { icon: "📞", label: "Phone", value: "07013981891", href: "tel:+2347013981891" },
    { icon: "📍", label: "Office", value: "Victoria Island, Lagos, Nigeria", href: null },
    { icon: "⏰", label: "Support Hours", value: "Mon–Sat, 8AM–8PM WAT", href: null },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4">Get in Touch</h1>
          <p className="text-xl text-indigo-200">
            Have questions? We would love to hear from you. Send us a message and we will respond within 24 hours.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>
            <div className="space-y-5">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-indigo-600 hover:underline mt-0.5 block">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 bg-indigo-600 rounded-2xl p-6 text-white">
              <p className="font-bold text-lg mb-2">🚀 Ready to get started?</p>
              <p className="text-indigo-200 text-sm mb-4">
                Try our demo gym with full access to all features — no credit card required.
              </p>
              <a
                href="/gym/cortexfit"
                className="inline-block bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition"
              >
                Try Demo Free →
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
