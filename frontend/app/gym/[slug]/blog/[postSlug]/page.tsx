import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { slug, postSlug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug: postSlug, tenant: { slug }, published: true },
    select: { title: true, excerpt: true, coverImage: true },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { name: true, settings: { select: { faviconUrl: true, metaTitle: true } } },
  });

  if (!post || !tenant) return { title: "Post Not Found" };

  return {
    title: `${post.title} — ${tenant.settings?.metaTitle ?? tenant.name}`,
    description: post.excerpt ?? `Read this post from ${tenant.name}.`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
    icons: { icon: tenant.settings?.faviconUrl ?? "/favicon.ico" },
  };
}

export default async function PublicBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = await params;

  const [tenant, post] = await Promise.all([
    prisma.tenant.findUnique({
      where: { slug },
      include: { settings: true },
    }),
    prisma.blogPost.findFirst({
      where: { slug: postSlug, tenant: { slug }, published: true },
    }),
  ]);

  if (!tenant || !post) notFound();

  const s = tenant.settings;
  const primary = s?.primaryColor ?? "#6366F1";
  const secondary = s?.secondaryColor ?? "#8B5CF6";
  const gradient = `linear-gradient(135deg, ${primary}, ${secondary})`;

  // Simple paragraph renderer — splits on double newlines for paragraph breaks
  const paragraphs = post.content.split(/\n{2,}/).filter(Boolean);

  const renderLine = (line: string, i: number) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-black text-gray-900 mt-10 mb-5">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.slice(4)}</h3>;
    return <p key={i} className="text-gray-700 leading-8 text-lg mb-5">{line}</p>;
  };

  return (
    <TenantThemeProvider settings={s}>
      <div className="min-h-screen bg-white">

        {/* Nav */}
        <nav
          className="sticky top-0 z-50 border-b backdrop-blur-md"
          style={{ background: "rgba(255,255,255,0.92)", borderColor: `${primary}20` }}
        >
          <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
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
              href={`/gym/${slug}/blog`}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← All Posts
            </Link>
          </div>
        </nav>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-6 py-14">
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                  style={{ background: `${primary}12`, color: primary }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-5">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-500 leading-relaxed mb-8 border-l-4 pl-5" style={{ borderColor: primary }}>
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mb-10 pb-8 border-b border-gray-100">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: gradient }}
            >
              {tenant.name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{tenant.name}</p>
              <p className="text-xs text-gray-400">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </p>
            </div>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Body */}
          <div className="prose-content">
            {paragraphs.map((para, i) => renderLine(para, i))}
          </div>

          {/* CTA */}
          <div
            className="mt-16 rounded-2xl p-8 text-center text-white"
            style={{ background: gradient }}
          >
            <p className="text-xl font-bold mb-2">Ready to start your fitness journey?</p>
            <p className="text-white/80 text-sm mb-5">Join {tenant.name} today and transform your life.</p>
            <Link
              href={`/gym/${slug}/join`}
              className="inline-block px-6 py-3 bg-white font-bold text-sm rounded-xl hover:bg-white/90 transition-colors"
              style={{ color: primary }}
            >
              Join Now →
            </Link>
          </div>
        </article>

        {/* Footer */}
        <footer className="border-t py-8 px-6 text-center text-sm text-gray-400">
          <Link href={`/gym/${slug}/blog`} style={{ color: primary }} className="hover:underline font-medium">
            ← More posts from {tenant.name}
          </Link>
        </footer>
      </div>
    </TenantThemeProvider>
  );
}
