import Link from "next/link";
import { format } from "date-fns";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // Cache for 1 hour, or use on-demand invalidation

export default async function BlogPage() {
  const posts = await prisma.marketingBlog.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4">CortexFit Blog</h1>
          <p className="text-xl text-indigo-200">
            Fitness tips, Nigerian nutrition guides, and gym business insights — written for African gym owners and members.
          </p>
        </div>
      </section>

      {/* Category filter */}
      {categories.length > 1 && (
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
      )}

      {/* Posts */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No articles published yet. Check back soon!
            </div>
          ) : (
            <>
              {/* Featured post */}
              <Link href={`/blog/${posts[0].slug}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8 flex flex-col sm:flex-row group hover:shadow-md transition-shadow cursor-pointer">
                {posts[0].coverImage ? (
                  <div
                    className="w-full sm:w-1/2 h-64 sm:h-auto bg-cover bg-center"
                    style={{ backgroundImage: `url(${posts[0].coverImage})` }}
                  />
                ) : (
                  <div className="w-full sm:w-1/2 h-64 sm:h-auto bg-indigo-100 flex items-center justify-center text-6xl">
                    📝
                  </div>
                )}
                <div className="p-8 w-full sm:w-1/2 flex flex-col justify-center">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{posts[0].category}</span>
                  <h2 className="text-2xl font-extrabold text-gray-900 mt-2 mb-3 group-hover:text-indigo-600 transition-colors">{posts[0].title}</h2>
                  <p className="text-gray-500 leading-relaxed mb-6">{posts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                    <span>{posts[0].publishedAt ? format(new Date(posts[0].publishedAt), "MMMM d, yyyy") : ""}</span>
                    {posts[0].readTime && <span>{posts[0].readTime} min read</span>}
                  </div>
                </div>
              </Link>

              {/* Rest of posts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(1).map((post) => (
                  <Link href={`/blog/${post.slug}`} key={post.slug} className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                    {post.coverImage ? (
                      <div
                        className="h-48 bg-cover bg-center w-full"
                        style={{ backgroundImage: `url(${post.coverImage})` }}
                      />
                    ) : (
                      <div className="h-48 bg-indigo-50 flex items-center justify-center text-4xl">
                        📰
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{post.category}</span>
                      <h3 className="font-bold text-gray-900 mt-2 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">{post.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mt-auto">
                        <span>{post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : ""}</span>
                        {post.readTime && <span>{post.readTime} min</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-6 bg-indigo-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Stay in the loop</h2>
          <p className="text-indigo-100 mb-10 text-lg">
            Get weekly fitness tips, Nigerian nutrition guides, and gym business insights delivered straight to your inbox.
          </p>
          
          <NewsletterForm />
          
          <p className="text-indigo-200 text-xs mt-6 font-medium tracking-wide">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
