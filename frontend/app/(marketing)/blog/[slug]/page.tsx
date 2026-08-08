import { notFound } from "next/navigation";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { generateStandardMetadata } from "@/lib/seo/metadata";
import { buildArticleSchema } from "@/lib/seo/jsonld";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { BlogArticleTracker } from "@/components/marketing/BlogArticleTracker";

export const revalidate = 3600; // Cache for 1 hour

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const post = await prisma.marketingBlog.findUnique({
    where: { slug: params.slug },
  });

  if (!post || !post.published) {
    return {};
  }

  return generateStandardMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    url: `https://fit.thecortexsystems.com/blog/${post.slug}`,
    image: post.coverImage || "https://fit.thecortexsystems.com/og-image.jpg",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await prisma.marketingBlog.findUnique({
    where: { slug: params.slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  const jsonLd = buildArticleSchema({
    title: post.metaTitle || post.title,
    image: post.coverImage || "https://fit.thecortexsystems.com/og-image.jpg",
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
    author: "Cortex Systems",
  });

  return (
    <>
      <BlogArticleTracker slug={post.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-white min-h-screen pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/blog" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full">
                {post.category}
              </span>
              {post.readTime && (
                <span className="text-gray-400 text-sm font-medium">{post.readTime} min read</span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
              {post.title}
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              {post.excerpt}
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400 border-t border-gray-100 pt-6">
              <span className="mr-6">Cortex Systems Team</span>
              <span>{post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : ""}</span>
            </div>
          </header>
        </div>

        {post.coverImage && (
          <div className="max-w-5xl mx-auto px-6 mb-16">
            <div
              className="w-full h-[400px] md:h-[500px] bg-cover bg-center rounded-2xl shadow-sm"
              style={{ backgroundImage: `url(${post.coverImage})` }}
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6">
          <article className="prose prose-lg prose-indigo max-w-none text-gray-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </article>
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-20 pt-16 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-3xl p-10 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Loved this article?</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Join 500+ gym owners getting our best tips delivered straight to their inbox.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>
    </>
  );
}
