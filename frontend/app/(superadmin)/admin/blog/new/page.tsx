"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send } from "lucide-react";

export default function SuperAdminBlogEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "",
    readTime: "",
    coverImage: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
  });

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  async function fetchPost(postId: string) {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/blog");
      if (!res.ok) throw new Error("Failed to fetch");
      const posts = await res.json();
      const post = posts.find((p: any) => p.id === postId);
      if (post) {
        setFormData({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || "",
          category: post.category || "",
          readTime: post.readTime?.toString() || "",
          coverImage: post.coverImage || "",
          content: post.content || "",
          metaTitle: post.metaTitle || "",
          metaDescription: post.metaDescription || "",
          published: post.published,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleGenerateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = { ...formData, id };
      const method = id ? "PUT" : "POST";

      const res = await fetch("/api/superadmin/blog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save post");

      router.push("/admin/blog");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{id ? "Edit Post" : "New Marketing Post"}</h1>
          <p className="text-sm text-muted-foreground">Draft and publish content to the Cortex Systems platform blog.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4 p-6 bg-card border border-border rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Content</h2>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="The Future of Gym Management"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">URL Slug</label>
                  <button type="button" onClick={handleGenerateSlug} className="text-xs text-primary hover:underline">
                    Generate from title
                  </button>
                </div>
                <input
                  type="text"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="the-future-of-gym-management"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Markdown Body</label>
                <textarea
                  name="content"
                  required
                  rows={20}
                  value={formData.content}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Write your content here using Markdown..."
                />
                <p className="text-xs text-muted-foreground">Supports standard Markdown (headers, lists, links, bold/italic) and GFM tables.</p>
              </div>
            </div>

            <div className="space-y-4 p-6 bg-card border border-border rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">SEO Meta</h2>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex justify-between">
                  Meta Title
                  <span className={formData.metaTitle.length > 60 ? "text-amber-500" : "text-muted-foreground"}>
                    {formData.metaTitle.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  required
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex justify-between">
                  Meta Description
                  <span className={formData.metaDescription.length > 160 ? "text-amber-500" : "text-muted-foreground"}>
                    {formData.metaDescription.length}/160
                  </span>
                </label>
                <textarea
                  name="metaDescription"
                  required
                  rows={3}
                  value={formData.metaDescription}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Publishing</h2>
              
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleCheckbox}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-3 text-sm font-medium text-foreground">Published</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : formData.published ? (
                    <>
                      <Send className="w-4 h-4" /> Publish Now
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Draft
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Details</h2>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select category...</option>
                  <option value="Product Updates">Product Updates</option>
                  <option value="Guides">Guides</option>
                  <option value="Company News">Company News</option>
                  <option value="Industry Insights">Industry Insights</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Read Time (minutes)</label>
                <input
                  type="number"
                  name="readTime"
                  value={formData.readTime}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cover Image URL</label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Excerpt</label>
                <textarea
                  name="excerpt"
                  rows={3}
                  value={formData.excerpt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Short description for blog cards..."
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
