"use client";

import { useState } from "react";

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  authorName: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: string;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
  tenantId: string;
  initialPosts: Post[];
}

export default function CommunityFeed({
  currentUserId,
  currentUserName,
  tenantId,
  initialPosts,
}: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const handlePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim(), tenantId }),
      });
      if (res.ok) {
        const post = await res.json();
        setPosts((prev) => [
          {
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            authorId: currentUserId,
            authorName: currentUserName,
            likeCount: 0,
            likedByMe: false,
            comments: [],
            createdAt: post.createdAt,
          },
          ...prev,
        ]);
        setNewContent("");
      }
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const { liked, count } = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likedByMe: liked, likeCount: count } : p
        )
      );
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    setSubmittingComment(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const comment = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    {
                      id: comment.id,
                      content: comment.content,
                      authorId: currentUserId,
                      authorName: currentUserName,
                      createdAt: comment.createdAt,
                    },
                  ],
                }
              : p
          )
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/community/posts?postId=${postId}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Post composer */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold uppercase text-sm shrink-0">
            {currentUserName[0]}
          </div>
          <div className="flex-1">
            <textarea
              rows={3}
              placeholder="Share your fitness journey, tips, or motivation..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePost}
                disabled={posting || !newContent.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium text-gray-600">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something with the community!</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Post header */}
            <div className="px-5 py-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold uppercase text-sm">
                    {post.authorName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{post.authorName}</p>
                    <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                  </div>
                </div>
                {post.authorId === currentUserId && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                {post.content}
              </p>

              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="mt-3 rounded-xl max-h-64 object-cover w-full"
                />
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-3 flex items-center gap-4 border-t border-gray-50 pt-3">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1.5 text-sm font-medium transition ${
                  post.likedByMe ? "text-indigo-600" : "text-gray-400 hover:text-indigo-500"
                }`}
              >
                <span>{post.likedByMe ? "❤️" : "🤍"}</span>
                {post.likeCount > 0 && <span>{post.likeCount}</span>}
                <span>Like</span>
              </button>

              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-500 transition"
              >
                <span>💬</span>
                {post.comments.length > 0 && <span>{post.comments.length}</span>}
                <span>Comment</span>
              </button>
            </div>

            {/* Comments */}
            {expandedComments.has(post.id) && (
              <div className="border-t border-gray-50 px-5 py-3 bg-gray-50 space-y-3">
                {post.comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {c.authorName[0]}
                    </div>
                    <div className="flex-1 bg-white rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-gray-700">{c.authorName}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}

                {/* Comment input */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {currentUserName[0]}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] ?? ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleComment(post.id);
                      }}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={submittingComment === post.id || !commentInputs[post.id]?.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                    >
                      {submittingComment === post.id ? "..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
