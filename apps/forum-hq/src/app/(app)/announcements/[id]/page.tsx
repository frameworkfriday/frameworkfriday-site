import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import CommentThread from "@/components/posts/CommentThread";
import {
  createComment,
  editComment,
  deleteComment,
  deletePost,
  editPost,
  togglePin,
} from "../actions";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const POST_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  announcement: { bg: "rgba(255,79,26,0.10)", color: "#FF4F1A", label: "Announcement" },
  discussion: { bg: "rgba(59,130,246,0.08)", color: "#3B82F6", label: "Discussion" },
  question: { bg: "rgba(139,92,246,0.08)", color: "#8B5CF6", label: "Question" },
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch post
  const { data: post } = await admin
    .from("posts")
    .select(`
      id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
      profiles:author_id(first_name, last_name, avatar_url),
      post_audiences(forum_group_id, forum_groups(name))
    `)
    .eq("id", id)
    .single();

  if (!post) notFound();

  // Fetch comments
  const { data: comments } = await admin
    .from("comments")
    .select("id, body, created_at, edited_at, author_id, profiles:author_id(first_name, last_name, avatar_url)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const mappedComments = (comments ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    edited_at: c.edited_at,
    author_id: c.author_id,
    author: c.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null,
  }));

  // Check moderation rights
  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  const isAdmin = !!adminRole;
  const isAuthor = post.author_id === user.id;

  // Check if facilitator of post's group
  let isFacilitatorOfGroup = false;
  const audiences = (post.post_audiences as unknown as { forum_group_id: string; forum_groups: { name: string } | null }[]) ?? [];
  if (!isAdmin && audiences.length > 0) {
    const groupIds = audiences.map((a) => a.forum_group_id);
    const { data: facCheck } = await admin
      .from("forum_group_members")
      .select("forum_group_id")
      .eq("user_id", user.id)
      .eq("role", "facilitator")
      .in("forum_group_id", groupIds);
    isFacilitatorOfGroup = (facCheck ?? []).length > 0;
  }

  const canModerate = isAdmin || isFacilitatorOfGroup;
  const canDelete = isAuthor || canModerate;

  const author = post.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null;
  const authorName = author ? `${author.first_name} ${author.last_name}`.trim() : "Forum Team";
  const initials = authorName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const groups = audiences.filter((a) => a.forum_groups).map((a) => ({ name: a.forum_groups!.name }));
  const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.discussion;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/announcements"
        style={{
          fontSize: "12px", fontWeight: 600, color: "#A3A3A3", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "20px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Feed
      </Link>

      {/* Post */}
      <div className="card" style={{
        padding: "28px",
        borderLeft: post.is_pinned ? "3px solid #FF4F1A" : undefined,
        marginBottom: "24px",
      }}>
        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          {post.is_pinned && (
            <span style={{
              fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
              letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "20px",
              background: "rgba(255,79,26,0.10)", color: "#FF4F1A", textTransform: "uppercase",
            }}>
              Pinned
            </span>
          )}
          <span style={{
            fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
            letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "20px",
            background: typeStyle.bg, color: typeStyle.color, textTransform: "uppercase",
          }}>
            {typeStyle.label}
          </span>
          {post.is_global ? (
            <span style={{
              fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
              letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "20px",
              background: "rgba(59,130,246,0.08)", color: "#3B82F6", textTransform: "uppercase",
            }}>
              Everyone
            </span>
          ) : (
            groups.map((g, i) => (
              <span key={i} style={{
                fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
                letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "20px",
                background: "#F0F0F0", color: "#6E6E6E", textTransform: "uppercase",
              }}>
                {g.name}
              </span>
            ))
          )}
          <span style={{ fontSize: "11px", color: "#A3A3A3", marginLeft: "auto" }}>
            {timeAgo(post.created_at)}
            {post.edited_at && " (edited)"}
          </span>
        </div>

        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          {author?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar_url}
              alt={authorName}
              style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(255,79,26,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, color: "#FF4F1A",
            }}>
              {initials}
            </div>
          )}
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0F0F0F" }}>
            {authorName}
          </span>
        </div>

        {/* Title */}
        {post.title && (
          <h1 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "22px",
            color: "#0F0F0F", margin: "0 0 12px", letterSpacing: "-0.01em",
          }}>
            {post.title}
          </h1>
        )}

        {/* Body */}
        <div style={{
          fontSize: "16px", color: "#3D3D3D", lineHeight: 1.8, whiteSpace: "pre-wrap",
          marginBottom: "20px",
        }}>
          {post.body}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #F0F0EE", paddingTop: "16px" }}>
          {isAdmin && (
            <form action={togglePin}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="pinned" value={post.is_pinned ? "false" : "true"} />
              <button type="submit" style={{
                background: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: "6px",
                cursor: "pointer", padding: "5px 12px", fontSize: "12px",
                fontWeight: 600, color: "#6E6E6E",
              }}>
                {post.is_pinned ? "Unpin" : "Pin"}
              </button>
            </form>
          )}
          {canDelete && (
            <form action={deletePost}>
              <input type="hidden" name="id" value={post.id} />
              <button type="submit" style={{
                background: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: "6px",
                cursor: "pointer", padding: "5px 12px", fontSize: "12px",
                fontWeight: 600, color: "#A3A3A3",
              }}>
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Comments section */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px",
          color: "#0F0F0F", marginBottom: "16px",
        }}>
          Comments ({mappedComments.length})
        </div>
        <CommentThread
          postId={post.id}
          comments={mappedComments}
          currentUserId={user.id}
          canModerate={canModerate}
          createAction={createComment}
          editAction={editComment}
          deleteAction={deleteComment}
        />
      </div>
    </div>
  );
}
