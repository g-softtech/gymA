import Link from "next/link";

const posts = [
  {
    slug: "nigerian-foods-gym",
    title: "The Best Nigerian Foods for Gym Goers",
    excerpt: "Discover how traditional Nigerian foods like Egusi soup, Moin Moin, and Suya can power your workouts and help you hit your fitness goals.",
    category: "Nutrition",
    readTime: "5 min read",
    date: "June 1, 2026",
    icon: "🥗",
  },
  {
    slug: "gym-management-software",
    title: "Why Nigerian Gyms Need Modern Management Software",
    excerpt: "Running a gym in Nigeria with spreadsheets and WhatsApp is costing you time and money. Here is why it is time to upgrade.",
    category: "Business",
    readTime: "7 min read",
    date: "May 25, 2026",
    icon: "💼",
  },
  {
    slug: "ai-personal-trainer",
    title: "AI vs Human Personal Trainer: What is Best for Your Members?",
    excerpt: "AI coaching is becoming more powerful but cannot replace the human connection. Learn how to blend both for the best member experience.",
    category: "AI & Technology",
    readTime: "6 min read",
    date: "May 18, 2026",
    icon: "🤖",
  },
  {
    slug: "jollof-rice-macros",
    title: "Jollof Rice Macros: How to Make It Gym-Friendly",
    excerpt: "Nigeria's favourite dish can be adapted for weight loss, muscle gain, or maintenance. Here are the exact calorie counts and smart swaps.",
    category: "Nutrition",
    readTime: "4 min read",
    date: "May 10, 2026",
    icon: "🍚",
  },
  {
    slug: "retain-gym-members",
    title: "5 Proven Ways to Retain Gym Members in Nigeria",
    excerpt: "Member retention is the biggest challenge for Nigerian gym owners. These strategies have helped 500+ gyms reduce churn by 40%.",
    category: "Business",
    readTime: "8 min read",
    date: "May 3, 2026",
    icon: "📈",
  },
  {
    slug: "weight-loss-lagos",
    title: "The Ultimate Weight Loss Guide for Busy Lagos Professionals",
    excerpt: "Long commutes, late nights, and Mama Put temptations — here is how to stay fit despite Lagos life.",
    category: "Fitness",
    readTime: "10 min read",
    date: "April 28, 2026",
    icon: "🏃",
  },
];

const categories = ["All", "Nutrition", "Business", "AI & Technology", "Fitness"];

export default function BlogPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4">SmartGym Blog</h1>
          <p className="text-xl text-indigo-200">
            Fitness tips, Nigerian nutrition guides, and gym business insights — written for African gym owners and members.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="py-8 px-6 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto flex gap-3 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                cat === "All"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* Featured post */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="text-6xl shrink-0">{posts[0].icon}</div>
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{posts[0].category}</span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1 mb-3">{posts[0].title}</h2>
              <p className="text-gray-500 leading-relaxed mb-4">{posts[0].excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{posts[0].date}</span>
                <span>{posts[0].readTime}</span>
              </div>
            </div>
          </div>

          {/* Rest of posts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post) => (
              <div key={post.slug} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                <div className="text-4xl mb-4">{post.icon}</div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{post.category}</span>
                <h3 className="font-bold text-gray-900 mt-1 mb-2 leading-tight">{post.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-6 bg-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Stay in the loop</h2>
          <p className="text-indigo-200 mb-8">
            Get weekly fitness tips, Nigerian nutrition guides, and gym business insights delivered to your inbox.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition text-sm shrink-0">
              Subscribe
            </button>
          </div>
          <p className="text-indigo-300 text-xs mt-3">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}
