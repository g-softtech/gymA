"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogAdminListPage() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog");
      if (res.ok) setPosts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function togglePublish(post: BlogPost) {
    const res = await fetch(`/api/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) fetchPosts();
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(postId);
    try {
      const res = await fetch(`/api/blog/${postId}`, { method: "DELETE" });
      if (res.ok) fetchPosts();
    } finally {
      setDeleting(null);
    }
  }

  const published = posts.filter((p) => p.published);
  const drafts = posts.filter((p) => !p.published);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-500 text-sm mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""} · {published.length} published · {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/gym/${slug}/dashboard/admin/blog/new`}
          id="new-post-btn"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + New Post
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-4xl mb-4">📝</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            Share fitness tips, member stories, and gym news to improve your SEO.
          </p>
          <Link
            href={`/gym/${slug}/dashboard/admin/blog/new`}
            className="inline-block px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Write Your First Post →
          </Link>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Cover thumbnail */}
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.coverImage}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-indigo-50 flex items-center justify-center text-2xl shrink-0">
                  📝
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      post.published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                {post.excerpt && (
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{post.excerpt}</p>
                )}
                <p className="text-gray-400 text-xs mt-1.5">
                  {post.published && post.publishedAt
                    ? `Published ${new Date(post.publishedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}`
                    : `Updated ${new Date(post.updatedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/gym/${slug}/dashboard/admin/blog/${post.id}`}
                  id={`edit-post-${post.id}`}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
                <button
                  id={`toggle-publish-${post.id}`}
                  onClick={() => togglePublish(post)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    post.published
                      ? "text-amber-700 border border-amber-200 hover:bg-amber-50"
                      : "text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  {post.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  id={`delete-post-${post.id}`}
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting === post.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
