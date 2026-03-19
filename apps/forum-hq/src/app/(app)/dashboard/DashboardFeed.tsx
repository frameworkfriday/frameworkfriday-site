"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleReaction, createComment } from "@/app/(app)/announcements/actions";

interface CommentData {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  author_id: string;
  author: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface PostData {
  id: string;
  title: string | null;
  body: string;
  post_type: string;
  is_pinned: boolean;
  is_global: boolean;
  created_at: string;
  edited_at: string | null;
  author: { first_name: string; last_name: string; avatar_url: string | null } | null;
  groups: { name: string }[];
  comment_count: number;
  comments: CommentData[];
  reactions: ReactionGroup[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_DOT: Record<string, string> = {
  announcement: "#FF4F1A",
  discussion: "#3B82F6",
  question: "#8B5CF6",
};

const QUICK_EMOJIS = ["👍", "🔥", "💡", "❤️", "👏"];

function FeedItem({ post, currentUserId }: { post: PostData; currentUserId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localReactions, setLocalReactions] = useState(post.reactions);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const authorName = post.author
    ? `${post.author.first_name} ${post.author.last_name}`.trim()
    : "Forum Team";
  const initials = authorName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleReaction = (emoji: string) => {
    // Optimistic update
    setLocalReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.reacted) {
          return existing.count === 1
            ? prev.filter((r) => r.emoji !== emoji)
            : prev.map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r);
        }
        return prev.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r);
      }
      return [...prev, { emoji, count: 1, reacted: true }];
    });
    setShowEmojiPicker(false);

    const fd = new FormData();
    fd.set("post_id", post.id);
    fd.set("emoji", emoji);
    startTransition(() => toggleReaction(fd));
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const fd = new FormData();
    fd.set("post_id", post.id);
    fd.set("body", newComment.trim());
    startTransition(async () => {
      await createComment(fd);
      setNewComment("");
    });
  };

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #F0F0EE" }}>
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        {post.author?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.author.avatar_url} alt={authorName}
            style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "rgba(255,79,26,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 700, color: "#FF4F1A", flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F" }}>{authorName}</span>
        <span style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: TYPE_DOT[post.post_type] || "#3B82F6", flexShrink: 0,
        }} />
        <span style={{ fontSize: "11px", color: "#A3A3A3" }}>
          {timeAgo(post.created_at)}
          {post.edited_at && " · edited"}
        </span>
        {post.is_pinned && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF4F1A" stroke="none" style={{ marginLeft: "auto", flexShrink: 0 }}>
            <path d="M16 2L17.5 3.5L14.5 6.5L16 12L18.5 14.5H13L12 22L11 14.5H5.5L8 12L9.5 6.5L6.5 3.5L8 2H16Z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ paddingLeft: "36px" }}>
        {post.title && (
          <Link href={`/announcements/${post.id}`} style={{ textDecoration: "none" }}>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F", marginBottom: "2px" }}>
              {post.title}
            </div>
          </Link>
        )}
        <div style={{
          fontSize: "13px", color: "#3D3D3D", lineHeight: 1.55,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {post.body}
        </div>

        {/* Reactions row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
          {localReactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => handleReaction(r.emoji)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "2px 8px", borderRadius: "12px",
                border: r.reacted ? "1px solid rgba(255,79,26,0.3)" : "1px solid #E5E5E5",
                background: r.reacted ? "rgba(255,79,26,0.06)" : "transparent",
                fontSize: "12px", cursor: "pointer", lineHeight: 1.4,
              }}
            >
              <span>{r.emoji}</span>
              <span style={{ fontWeight: 600, color: r.reacted ? "#FF4F1A" : "#6E6E6E", fontSize: "11px" }}>{r.count}</span>
            </button>
          ))}

          {/* Add reaction button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "26px", height: "26px", borderRadius: "12px",
                border: "1px solid #E5E5E5", background: "transparent",
                cursor: "pointer", fontSize: "12px", color: "#A3A3A3",
              }}
            >
              +
            </button>
            {showEmojiPicker && (
              <div style={{
                position: "absolute", bottom: "32px", left: 0, zIndex: 10,
                display: "flex", gap: "4px", padding: "6px 8px",
                background: "#FFFFFF", border: "1px solid #E5E5E5",
                borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}>
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => handleReaction(e)}
                    style={{
                      padding: "4px 6px", background: "none", border: "none",
                      cursor: "pointer", fontSize: "16px", borderRadius: "6px",
                    }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "#F0F0F0")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", fontSize: "12px", color: "#A3A3A3", padding: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {post.comment_count > 0 ? (
              <span style={{ fontWeight: 600, color: expanded ? "#FF4F1A" : "#6E6E6E" }}>
                {post.comment_count}
              </span>
            ) : (
              <span>Reply</span>
            )}
          </button>
        </div>

        {/* Inline thread */}
        {expanded && (
          <div style={{ marginTop: "10px", borderTop: "1px solid #F5F5F4", paddingTop: "8px" }}>
            {post.comments.map((c) => {
              const cName = c.author ? `${c.author.first_name} ${c.author.last_name}`.trim() : "Member";
              const cInitials = cName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={c.id} style={{ display: "flex", gap: "8px", padding: "6px 0" }}>
                  {c.author?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.author.avatar_url} alt={cName}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: "1px" }} />
                  ) : (
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "rgba(255,79,26,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "8px", fontWeight: 700, color: "#FF4F1A", flexShrink: 0, marginTop: "1px",
                    }}>
                      {cInitials}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F0F0F" }}>{cName}</span>
                    <span style={{ fontSize: "11px", color: "#A3A3A3", marginLeft: "6px" }}>{timeAgo(c.created_at)}</span>
                    <div style={{ fontSize: "13px", color: "#3D3D3D", lineHeight: 1.5, marginTop: "1px" }}>
                      {c.body}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Reply input */}
            <form onSubmit={handleComment} style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Reply..."
                style={{
                  flex: 1, padding: "7px 10px", fontSize: "13px",
                  border: "1px solid #E5E5E5", borderRadius: "8px",
                  outline: "none", fontFamily: "inherit", color: "#0F0F0F",
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isPending}
                style={{
                  padding: "7px 14px", borderRadius: "8px", border: "none",
                  background: newComment.trim() ? "#FF4F1A" : "#E5E5E5",
                  color: newComment.trim() ? "#FFF" : "#A3A3A3",
                  fontSize: "12px", fontWeight: 600, cursor: newComment.trim() ? "pointer" : "default",
                  flexShrink: 0,
                }}
              >
                {isPending ? "..." : "Send"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardFeed({
  posts,
  currentUserId,
}: {
  posts: PostData[];
  currentUserId: string;
}) {
  const [sort, setSort] = useState<"recent" | "active">("recent");

  const sorted = [...posts].sort((a, b) => {
    if (sort === "active") {
      const scoreA = a.comment_count + a.reactions.reduce((sum, r) => sum + r.count, 0);
      const scoreB = b.comment_count + b.reactions.reduce((sum, r) => sum + r.count, 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Pinned always first
  const pinned = sorted.filter((p) => p.is_pinned);
  const unpinned = sorted.filter((p) => !p.is_pinned);
  const ordered = [...pinned, ...unpinned];

  if (posts.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <div style={{ fontSize: "13px", color: "#A3A3A3" }}>No posts yet. Updates from your community will appear here.</div>
      </div>
    );
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: active ? "#0F0F0F" : "transparent",
    color: active ? "#FFFFFF" : "#A3A3A3",
    letterSpacing: "0.02em",
  });

  return (
    <div>
      {/* Sort tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <div style={{
          fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3",
        }}>
          Feed
        </div>
        <div style={{ display: "flex", gap: "2px", background: "#F5F5F4", borderRadius: "8px", padding: "2px" }}>
          <button style={tabStyle(sort === "recent")} onClick={() => setSort("recent")}>Recent</button>
          <button style={tabStyle(sort === "active")} onClick={() => setSort("active")}>Active</button>
        </div>
      </div>

      {/* Feed items */}
      <div>
        {ordered.map((p) => (
          <FeedItem key={p.id} post={p} currentUserId={currentUserId} />
        ))}
      </div>

      <div style={{ textAlign: "center", paddingTop: "12px" }}>
        <Link
          href="/announcements"
          style={{
            fontSize: "12px", fontWeight: 600, color: "#FF4F1A",
            textDecoration: "none",
          }}
        >
          View all posts &rarr;
        </Link>
      </div>
    </div>
  );
}
