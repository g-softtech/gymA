"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface BlogPostData {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  published: boolean;
}

interface BlogEditorProps {
  initial?: Partial<BlogPostData>;
  mode: "new" | "edit";
}

export default function BlogEditor({ initial, mode }: BlogEditorProps) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [form, setForm] = useState<BlogPostData>({
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    coverImage: initial?.coverImage ?? "",
    tags: Array.isArray(initial?.tags) ? (initial.tags as unknown as string[]).join(", ") : (initial?.tags ?? ""),
    published: initial?.published ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  async function handleSave(publishNow?: boolean) {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        published: publishNow ?? form.published,
      };

      const url = mode === "edit" && initial?.id ? `/api/blog/${initial.id}` : "/api/blog";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save post.");
        return;
      }

      router.push(`/gym/${slug}/dashboard/admin/blog`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  // Very simple markdown-like preview (converts line breaks + basic headings)
  const renderPreview = (text: string) =>
    text
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-black text-foreground mb-4 mt-6">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold text-foreground mb-3 mt-5">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-bold text-foreground mb-2 mt-4">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-foreground mb-2">{line.slice(2, -2)}</p>;
        if (line === "") return <div key={i} className="mb-2" />;
        return <p key={i} className="text-foreground leading-relaxed mb-2">{line}</p>;
      });

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "new" ? "New Blog Post" : "Edit Post"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "new"
              ? "Write and publish content that improves your SEO and engages members."
              : "Update post content, cover image, or publish status."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="save-draft-btn"
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || !form.title || !form.content}
            className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            id="publish-btn"
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !form.title || !form.content}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors"
          >
            {saving ? "Publishing…" : form.published ? "Update" : "Publish →"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm">
            <input
              id="post-title"
              type="text"
              placeholder="Post title…"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full text-2xl font-bold text-foreground placeholder-gray-300 border-0 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Write / Preview tabs */}
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b border-border">
              {(["write", "preview"] as const).map((tab) => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className="px-5 py-3 text-sm font-medium capitalize transition-colors"
                  style={
                    activeTab === tab
                      ? { color: "#4F46E5", borderBottom: "2px solid #4F46E5" }
                      : { color: "#9ca3af" }
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "write" ? (
              <textarea
                id="post-content"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder={`Write your post here...\n\nMarkdown headings are supported:\n# Heading 1\n## Heading 2\n### Heading 3`}
                className="w-full h-96 px-5 py-4 text-sm text-foreground leading-relaxed resize-none focus:outline-none font-mono"
              />
            ) : (
              <div className="px-5 py-4 min-h-96 prose max-w-none">
                {form.content
                  ? renderPreview(form.content)
                  : <p className="text-muted-foreground italic text-sm">Nothing to preview yet.</p>}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Excerpt <span className="text-muted-foreground font-normal">(shown in blog listing & SEO description)</span>
            </label>
            <textarea
              id="post-excerpt"
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="A short summary of this post…"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Status</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{form.published ? "Published" : "Draft"}</span>
              <button
                id="toggle-published-btn"
                type="button"
                onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.published ? "bg-emerald-500" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-card text-card-foreground shadow transition-transform ${
                    form.published ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cover image */}
          <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Cover Image</h2>
            <input
              id="post-cover-image"
              type="url"
              value={form.coverImage}
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
              placeholder="https://images.unsplash.com/…"
              className={inputCls}
            />
            {form.coverImage && (
              <div className="mt-3 rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  className="w-full h-28 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-1 uppercase tracking-wide">Tags</h2>
            <p className="text-xs text-muted-foreground mb-2">Comma-separated</p>
            <input
              id="post-tags"
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="fitness, nutrition, motivation"
              className={inputCls}
            />
            {form.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SEO note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">SEO tip:</span> Use keywords in the title and write a compelling excerpt. Each published post creates a unique indexed URL on your gym&apos;s public website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
