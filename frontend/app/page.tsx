// Global Landing Page

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
      <h1 className="text-5xl font-extrabold text-slate-900 mb-6">Smart Gym SaaS</h1>
      <p className="text-xl text-slate-600 mb-8 max-w-2xl">
        The ultimate platform for gym owners to manage memberships, trainers, and classes.
      </p>
      <a href="/gym/ironforge" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
        View Demo Gym (Iron Forge)
      </a>
    </div>
  );
}