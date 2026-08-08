"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export default function SuperAdminBlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/blog");
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(post: BlogPost) {
    try {
      const res = await fetch("/api/superadmin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, published: !post.published }),
      });
      if (!res.ok) throw new Error("Failed to update post");
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Error updating post status");
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/superadmin/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Error deleting post");
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Marketing Blog</h1>
          <p className="text-muted-foreground mt-2">Manage the platform marketing content.</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No posts found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Dates</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{post.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle className="w-4 h-4" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-500">
                          <XCircle className="w-4 h-4" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div>Updated: {format(new Date(post.updatedAt), "MMM d, yyyy")}</div>
                      {post.publishedAt && (
                        <div>Published: {format(new Date(post.publishedAt), "MMM d, yyyy")}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => togglePublish(post)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
                        >
                          {post.published ? "Unpublish" : "Publish"}
                        </button>
                        <Link
                          href={`/admin/blog/new?id=${post.id}`}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
