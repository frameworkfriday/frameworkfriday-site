"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { toggleReaction, createComment, togglePin, createPost } from "@/app/(app)/announcements/actions";

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

interface GroupData {
  id: string;
  name: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  announcement: { label: "Announcement", color: "#FF4F1A", bg: "rgba(255,79,26,0.08)" },
  discussion: { label: "Discussion", color: "#3B82F6", bg: "rgba(59,130,246,0.06)" },
  question: { label: "Question", color: "#8B5CF6", bg: "rgba(139,92,246,0.06)" },
};

const QUICK_EMOJIS = ["❤️", "👍", "🔥", "💡", "👏"];

/* ── Avatar ── */
function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "rgba(255,79,26,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, color: "#FF4F1A", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ── Post Menu (admin controls) ── */
function PostMenu({ post, isAdmin }: { post: PostData; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handlePin = () => {
    const fd = new FormData();
    fd.set("id", post.id);
    fd.set("pinned", post.is_pinned ? "false" : "true");
    startTransition(() => togglePin(fd));
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "28px", height: "28px", borderRadius: "10px",
          border: "none", background: open ? "#F5F5F4" : "transparent",
          cursor: "pointer", color: "#A3A3A3", fontSize: "16px",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F4")}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "32px", right: 0, zIndex: 20,
          background: "#FFFFFF", borderRadius: "14px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.05)",
          minWidth: "160px", overflow: "hidden",
        }}>
          {isAdmin && (
            <button
              onClick={handlePin}
              disabled={isPending}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                width: "100%", padding: "10px 14px",
                border: "none", background: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: 500, color: "#0F0F0F",
                textAlign: "left",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F4")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={post.is_pinned ? "#FF4F1A" : "#6E6E6E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76z" />
              </svg>
              {post.is_pinned ? "Unpin post" : "Pin to top"}
            </button>
          )}
          <Link
            href={`/announcements/${post.id}`}
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              width: "100%", padding: "10px 14px",
              textDecoration: "none",
              fontSize: "13px", fontWeight: 500, color: "#0F0F0F",
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6E6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open full post
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Inline Compose ── */
function InlineCompose({
  role,
  groups,
}: {
  role: "admin" | "facilitator" | "member";
  groups: GroupData[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState("discussion");
  const [isPending, startTransition] = useTransition();

  const canAnnounce = role === "admin" || role === "facilitator";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("body", body.trim());
    if (title.trim()) fd.set("title", title.trim());
    fd.set("post_type", postType);
    fd.set("is_global", "true");
    startTransition(async () => {
      await createPost(fd);
      setBody("");
      setTitle("");
      setPostType("discussion");
      setExpanded(false);
    });
  };

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          background: "#FFFFFF", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)", borderRadius: "14px",
          padding: "14px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "12px",
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D0D0D0")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E5E4")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span style={{ fontSize: "14px", color: "#A3A3A3" }}>
          {canAnnounce ? "Post an announcement or start a discussion..." : "Start a discussion or ask a question..."}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: "#FFFFFF", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)", borderRadius: "14px",
      overflow: "hidden",
    }}>
      <form onSubmit={handleSubmit}>
        {/* Body */}
        <div style={{ padding: "16px 20px 0" }}>
          {(postType === "announcement" || title) && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              style={{
                width: "100%", padding: "0", marginBottom: "8px",
                border: "none", outline: "none", fontFamily: "inherit",
                fontSize: "16px", fontWeight: 700, color: "#0F0F0F",
                background: "transparent",
              }}
            />
          )}
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              postType === "announcement" ? "Write your announcement..."
                : postType === "question" ? "What's your question?"
                : "What's on your mind?"
            }
            rows={4}
            style={{
              width: "100%", padding: "0", resize: "vertical",
              border: "none", outline: "none", fontFamily: "inherit",
              fontSize: "14px", color: "#0F0F0F", lineHeight: 1.6,
              background: "transparent", minHeight: "80px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Bottom toolbar */}
        <div style={{
          padding: "10px 20px", borderTop: "1px solid #F0F0EE",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Post type tabs */}
          <div style={{ display: "flex", gap: "0" }}>
            {(canAnnounce
              ? [
                  { value: "announcement", label: "Announcement" },
                  { value: "discussion", label: "Discussion" },
                  { value: "question", label: "Question" },
                ]
              : [
                  { value: "discussion", label: "Discussion" },
                  { value: "question", label: "Question" },
                ]
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPostType(t.value)}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "5px 12px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600, borderRadius: "8px",
                  background: postType === t.value ? "#0F0F0F" : "transparent",
                  color: postType === t.value ? "#FFFFFF" : "#6E6E6E",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => { setExpanded(false); setBody(""); setTitle(""); }}
              style={{
                padding: "6px 14px", borderRadius: "10px",
                border: "none", background: "none",
                fontSize: "12px", fontWeight: 600, color: "#6E6E6E", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!body.trim() || isPending}
              style={{
                padding: "6px 18px", borderRadius: "10px", border: "none",
                background: body.trim() ? "#FF4F1A" : "#E5E5E4",
                color: body.trim() ? "#FFF" : "#A3A3A3",
                fontSize: "12px", fontWeight: 700, cursor: body.trim() ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
            >
              {isPending ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ── Feed Card ── */
function FeedCard({
  post,
  currentUserId,
  isAdmin,
}: {
  post: PostData;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localReactions, setLocalReactions] = useState(post.reactions);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentSort, setCommentSort] = useState<"newest" | "oldest">("newest");

  const authorName = post.author
    ? `${post.author.first_name} ${post.author.last_name}`.trim()
    : "Forum Team";

  const totalReactions = localReactions.reduce((sum, r) => sum + r.count, 0);
  const heartReaction = localReactions.find((r) => r.emoji === "❤️");
  const typeBadge = TYPE_BADGE[post.post_type] || TYPE_BADGE.discussion;

  const handleReaction = (emoji: string) => {
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

  const sortedComments = [...post.comments].sort((a, b) => {
    if (commentSort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div style={{
      background: "#FFFFFF",
      border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
      borderRadius: "14px",
      overflow: "hidden",
    }}>
      {/* Pinned accent bar */}
      {post.is_pinned && <div style={{ height: "3px", background: "#FF4F1A" }} />}

      <div style={{ padding: "20px 24px" }}>
        {/* Author row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
          <Avatar name={authorName} url={post.author?.avatar_url ?? null} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#0F0F0F" }}>{authorName}</span>
              {post.is_pinned && (
                <span style={{
                  fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px",
                  background: "rgba(255,79,26,0.08)", color: "#FF4F1A",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                  Pinned
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "1px" }}>
              <span style={{ fontSize: "12px", color: "#A3A3A3" }}>
                {timeAgo(post.created_at)}
                {post.edited_at && " · Edited"}
              </span>
              <span style={{ color: "#D0D0D0" }}>·</span>
              <span style={{
                fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "10px",
                background: typeBadge.bg, color: typeBadge.color,
                textTransform: "uppercase", letterSpacing: "0.03em",
              }}>
                {typeBadge.label}
              </span>
            </div>
          </div>
          {/* Admin menu */}
          <PostMenu post={post} isAdmin={isAdmin} />
        </div>

        {/* Title */}
        {post.title && (
          <Link href={`/announcements/${post.id}`} style={{ textDecoration: "none" }}>
            <h3 style={{
              fontWeight: 700, fontSize: "17px", color: "#0F0F0F",
              margin: "0 0 6px", lineHeight: 1.35, letterSpacing: "-0.01em",
            }}>
              {post.title}
            </h3>
          </Link>
        )}

        {/* Body */}
        <div style={{
          fontSize: "14px", color: "#4A4A4A", lineHeight: 1.65,
          display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {post.body}
        </div>

        {/* Group tags */}
        {post.groups.length > 0 && !post.is_global && (
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
            {post.groups.map((g, i) => (
              <span key={i} style={{
                fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px",
                background: "#F5F5F4", color: "#6E6E6E",
              }}>
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Engagement bar ── */}
      <div style={{
        borderTop: "1px solid #F0F0EE",
        padding: "0 24px",
        display: "flex", alignItems: "center",
        height: "46px",
        gap: "4px",
      }}>
        {/* Heart / like button */}
        <button
          onClick={() => handleReaction("❤️")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "6px 12px", borderRadius: "10px",
            border: heartReaction?.reacted ? "1px solid rgba(255,79,26,0.25)" : "1px solid #E5E5E4",
            background: heartReaction?.reacted ? "rgba(255,79,26,0.04)" : "transparent",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={heartReaction?.reacted ? "#FF4F1A" : "none"}
            stroke={heartReaction?.reacted ? "#FF4F1A" : "#6E6E6E"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span style={{ fontWeight: 600, color: heartReaction?.reacted ? "#FF4F1A" : "#6E6E6E", fontSize: "12px" }}>
            {totalReactions > 0 ? totalReactions : "Like"}
          </span>
        </button>

        {/* Comment button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "6px 12px", borderRadius: "10px",
            border: expanded ? "1px solid rgba(255,79,26,0.25)" : "1px solid #E5E5E4",
            background: expanded ? "rgba(255,79,26,0.04)" : "transparent",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={expanded ? "#FF4F1A" : "#6E6E6E"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontWeight: 600, color: expanded ? "#FF4F1A" : "#6E6E6E", fontSize: "12px" }}>
            {post.comment_count > 0 ? `${post.comment_count} ${post.comment_count === 1 ? "reply" : "replies"}` : "Reply"}
          </span>
        </button>

        {/* Emoji quick add */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "6px 10px", borderRadius: "10px",
              border: "none", background: "transparent",
              cursor: "pointer", fontSize: "13px", color: "#A3A3A3",
              transition: "all 0.15s ease",
            }}
          >
            😊+
          </button>
          {showEmojiPicker && (
            <div style={{
              position: "absolute", bottom: "38px", left: 0, zIndex: 10,
              display: "flex", gap: "2px", padding: "6px 8px",
              background: "#FFFFFF", borderRadius: "14px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.05)",
            }}>
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => handleReaction(e)}
                  style={{
                    padding: "5px 7px", background: "none", border: "none",
                    cursor: "pointer", fontSize: "16px", borderRadius: "10px",
                  }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "#F5F5F4")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Other reaction pills */}
        {localReactions.filter(r => r.emoji !== "❤️").length > 0 && (
          <div style={{ display: "flex", gap: "4px", marginLeft: "2px" }}>
            {localReactions.filter(r => r.emoji !== "❤️").map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  padding: "4px 8px", borderRadius: "10px",
                  border: r.reacted ? "1px solid rgba(255,79,26,0.25)" : "1px solid #E5E5E4",
                  background: r.reacted ? "rgba(255,79,26,0.04)" : "transparent",
                  cursor: "pointer", fontSize: "12px",
                }}
              >
                <span>{r.emoji}</span>
                <span style={{ fontWeight: 600, color: r.reacted ? "#FF4F1A" : "#6E6E6E", fontSize: "11px" }}>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Comments section ── */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F0F0EE" }}>
          {/* Comment header */}
          {post.comment_count > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 24px", borderBottom: "1px solid #F5F5F4",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F0F0F" }}>
                {post.comment_count} Comment{post.comment_count !== 1 ? "s" : ""}
              </span>
              <div style={{ display: "flex", gap: "12px" }}>
                {(["newest", "oldest"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCommentSort(s)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "12px", fontWeight: 600, padding: 0,
                      color: commentSort === s ? "#0F0F0F" : "#A3A3A3",
                      borderBottom: commentSort === s ? "2px solid #0F0F0F" : "2px solid transparent",
                      paddingBottom: "2px",
                    }}
                  >
                    {s === "newest" ? "Newest first" : "Oldest first"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comments list */}
          <div style={{ padding: "0 24px" }}>
            {sortedComments.map((c, idx) => {
              const cName = c.author ? `${c.author.first_name} ${c.author.last_name}`.trim() : "Member";
              return (
                <div key={c.id} style={{
                  display: "flex", gap: "10px", padding: "14px 0",
                  borderBottom: idx < sortedComments.length - 1 ? "1px solid #F5F5F4" : "none",
                }}>
                  <Avatar name={cName} url={c.author?.avatar_url ?? null} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F" }}>{cName}</span>
                      <span style={{ fontSize: "11px", color: "#A3A3A3" }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#4A4A4A", lineHeight: 1.6 }}>
                      {c.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply input */}
          <div style={{ padding: "12px 24px 16px", borderTop: "1px solid #F5F5F4" }}>
            <form onSubmit={handleComment} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                style={{
                  flex: 1, padding: "9px 14px", fontSize: "13px",
                  border: "1px solid #EAEAE8", borderRadius: "10px",
                  outline: "none", fontFamily: "inherit", color: "#0F0F0F",
                  background: "#FAFAF9",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#D0D0D0")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E5E4")}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isPending}
                style={{
                  padding: "9px 18px", borderRadius: "10px", border: "none",
                  background: newComment.trim() ? "#FF4F1A" : "#E5E5E4",
                  color: newComment.trim() ? "#FFF" : "#A3A3A3",
                  fontSize: "12px", fontWeight: 700, cursor: newComment.trim() ? "pointer" : "default",
                  flexShrink: 0, transition: "all 0.15s ease",
                }}
              >
                {isPending ? "..." : "Reply"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Feed Component ── */
export default function DashboardFeed({
  posts,
  currentUserId,
  userRole,
  groups,
}: {
  posts: PostData[];
  currentUserId: string;
  userRole: "admin" | "facilitator" | "member";
  groups: GroupData[];
}) {
  const [sort, setSort] = useState<"recent" | "active">("recent");
  const [typeFilter, setTypeFilter] = useState<"all" | "announcement" | "discussion" | "question">("all");

  const isAdmin = userRole === "admin";

  // Filter by type
  const filtered = typeFilter === "all" ? posts : posts.filter((p) => p.post_type === typeFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "active") {
      const scoreA = a.comment_count + a.reactions.reduce((sum, r) => sum + r.count, 0);
      const scoreB = b.comment_count + b.reactions.reduce((sum, r) => sum + r.count, 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pinned = sorted.filter((p) => p.is_pinned);
  const unpinned = sorted.filter((p) => !p.is_pinned);
  const ordered = [...pinned, ...unpinned];

  const typeTabStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "8px 0",
    fontSize: "13px", fontWeight: 600,
    cursor: "pointer", border: "none", background: "none",
    color: active ? "#0F0F0F" : "#A3A3A3",
    borderBottom: active ? "2px solid #FF4F1A" : "2px solid transparent",
    transition: "color 0.15s ease",
    marginRight: "20px",
  });

  return (
    <div>
      {/* Inline compose */}
      <div style={{ marginBottom: "16px" }}>
        <InlineCompose role={userRole} groups={groups} />
      </div>

      {/* Post type filter tabs */}
      <div style={{
        display: "flex", alignItems: "center",
        borderBottom: "1px solid #EAEAE8",
        marginBottom: "16px",
      }}>
        <button style={typeTabStyle(typeFilter === "all")} onClick={() => setTypeFilter("all")}>
          All
        </button>
        <button style={typeTabStyle(typeFilter === "announcement")} onClick={() => setTypeFilter("announcement")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={typeFilter === "announcement" ? "#FF4F1A" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" /></svg>
          Announcements
        </button>
        <button style={typeTabStyle(typeFilter === "discussion")} onClick={() => setTypeFilter("discussion")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={typeFilter === "discussion" ? "#FF4F1A" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          Discussions
        </button>
        <button style={typeTabStyle(typeFilter === "question")} onClick={() => setTypeFilter("question")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={typeFilter === "question" ? "#FF4F1A" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          Questions
        </button>

        {/* Sort toggle — right side */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "2px", background: "#F5F5F4", borderRadius: "8px", padding: "2px" }}>
          {(["recent", "active"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                padding: "4px 10px", borderRadius: "6px",
                fontSize: "11px", fontWeight: 600, cursor: "pointer", border: "none",
                background: sort === s ? "#FFFFFF" : "transparent",
                color: sort === s ? "#0F0F0F" : "#A3A3A3",
                boxShadow: sort === s ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {s === "recent" ? "Recent" : "Active"}
            </button>
          ))}
        </div>
      </div>

      {/* Feed cards */}
      {ordered.length === 0 ? (
        <div style={{
          background: "#FFFFFF", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)", borderRadius: "14px",
          padding: "48px 24px", textAlign: "center",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D0D0D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "12px" }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#6E6E6E", marginBottom: "4px" }}>
            {typeFilter === "all" ? "No posts yet" : `No ${typeFilter}s yet`}
          </div>
          <div style={{ fontSize: "13px", color: "#A3A3A3" }}>
            {typeFilter === "all" ? "Be the first to start a conversation." : "Try a different filter or create one above."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ordered.map((p) => (
            <FeedCard key={p.id} post={p} currentUserId={currentUserId} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Load more could go here in the future */}
    </div>
  );
}
