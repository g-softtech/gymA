"use client";

import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics/index";

export default function ContactForm() {
  const [submissionId, setSubmissionId] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gymName: "",
    subject: "General Enquiry",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate a unique idempotency ID precisely once when the form mounts.
    // This allows the user to safely double-click or retry on error without causing duplicate emails.
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      setSubmissionId(crypto.randomUUID());
    } else {
      setSubmissionId(Date.now().toString() + Math.random().toString());
    }
  }, []);

  const subjects = [
    "General Enquiry",
    "Sales & Pricing",
    "Technical Support",
    "Partnership",
    "Feature Request",
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/marketing/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submissionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Success
      setSubmitted(true);
      trackEvent("contact_form_submitted", { form_type: "platform" });
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
        <p className="text-green-700 text-sm">
          Thank you for reaching out. We will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-6 space-y-5" aria-label="Contact Form">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name <span className="text-red-500">*</span></label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-border bg-background text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address <span className="text-red-500">*</span></label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-border bg-background text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1.5">Phone Number</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-border bg-background text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label htmlFor="gymName" className="block text-sm font-medium text-muted-foreground mb-1.5">Gym Name</label>
          <input
            id="gymName"
            type="text"
            value={form.gymName}
            onChange={(e) => setForm({ ...form, gymName: e.target.value })}
            className="w-full border border-border bg-background text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-1.5">Subject</label>
        <select
          id="subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full border border-border bg-background text-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
        >
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1.5">Message <span className="text-red-500">*</span></label>
        <textarea
          id="message"
          rows={5}
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-border bg-background text-foreground placeholder-muted-foreground rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-shadow"
          placeholder="How can we help you?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-primary-foreground font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5 text-primary-foreground/70" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Sending Message...
          </>
        ) : "Send Message"}
      </button>
    </form>
  );
}
