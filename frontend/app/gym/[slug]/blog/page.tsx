import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { settings: true },
  });
  if (!tenant) return { title: "Blog Not Found" };

  const s = tenant.settings;
  return {
    title: `Blog — ${s?.metaTitle ?? tenant.name}`,
    description: `Fitness tips, gym news, and member stories from ${tenant.name}.`,
    icons: { icon: s?.faviconUrl ?? "/favicon.ico" },
  };
}

export default async function PublicBlogListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      settings: true,
      blogPosts: {
        where: { published: true },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!tenant) notFound();

  const s = tenant.settings;
  const primary = s?.primaryColor ?? "#6366F1";
  const secondary = s?.secondaryColor ?? "#8B5CF6";
  const gradient = `linear-gradient(135deg, ${primary}, ${secondary})`;

  const posts = tenant.blogPosts;

  return (
    <TenantThemeProvider settings={s}>
      <div className="min-h-screen bg-white">

        {/* Nav */}
        <nav
          className="sticky top-0 z-50 border-b backdrop-blur-md"
          style={{ background: "rgba(255,255,255,0.92)", borderColor: `${primary}20` }}
        >
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href={`/gym/${slug}`} className="flex items-center gap-3">
              {s?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt={tenant.name} className="h-8 object-contain" />
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black uppercase"
                    style={{ background: gradient }}
                  >
                    {tenant.name[0]}
                  </div>
                  <span className="font-bold text-gray-900">{tenant.name}</span>
                </>
              )}
            </Link>
            <Link
              href={`/gym/${slug}`}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="py-16 px-6 text-center" style={{ background: `${primary}08` }}>
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={{ background: `${primary}15`, color: primary }}
          >
            Blog
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Fitness Tips & Insights</h1>
          <p className="text-gray-500 text-lg">
            Expert advice, member stories, and gym news from {tenant.name}.
          </p>
        </div>

        {/* Posts grid */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📝</p>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h2>
              <p className="text-gray-500">Check back soon for fitness tips and gym updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/gym/${slug}/blog/${post.slug}`}
                  id={`blog-${post.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-48 flex items-center justify-center text-4xl"
                      style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}20)` }}
                    >
                      📝
                    </div>
                  )}
                  <div className="p-5">
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${primary}12`, color: primary }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t py-8 px-6 text-center text-sm text-gray-400">
          <Link href={`/gym/${slug}`} style={{ color: primary }} className="hover:underline font-medium">
            ← Back to {tenant.name}
          </Link>
        </footer>
      </div>
    </TenantThemeProvider>
  );
}
