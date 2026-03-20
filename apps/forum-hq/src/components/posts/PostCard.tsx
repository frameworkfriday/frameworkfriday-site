import Link from "next/link";

interface PostCardProps {
  post: {
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
  };
  animationDelay?: number;
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

const POST_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  announcement: { bg: "rgba(255,79,26,0.10)", color: "#FF4F1A", label: "Announcement" },
  discussion: { bg: "rgba(59,130,246,0.08)", color: "#3B82F6", label: "Discussion" },
  question: { bg: "rgba(139,92,246,0.08)", color: "#8B5CF6", label: "Question" },
};

export default function PostCard({ post, animationDelay = 0 }: PostCardProps) {
  const authorName = post.author
    ? `${post.author.first_name} ${post.author.last_name}`.trim()
    : "Forum Team";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.discussion;

  return (
    <Link
      href={`/announcements/${post.id}`}
      className="card card-hover animate-fade-up"
      style={{
        display: "block",
        padding: "28px 24px",
        animationDelay: `${animationDelay}s`,
        borderTop: post.is_pinned ? "3px solid #FF4F1A" : undefined,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* Top row: badges + time */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        {post.is_pinned && (
          <span style={{
            fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
            letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "10px",
            background: "rgba(255,79,26,0.10)", color: "#FF4F1A", textTransform: "uppercase",
          }}>
            Pinned
          </span>
        )}
        <span style={{
          fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
          letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "10px",
          background: typeStyle.bg, color: typeStyle.color, textTransform: "uppercase",
        }}>
          {typeStyle.label}
        </span>
        {post.is_global ? (
          <span style={{
            fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
            letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "10px",
            background: "rgba(59,130,246,0.08)", color: "#3B82F6", textTransform: "uppercase",
          }}>
            Everyone
          </span>
        ) : (
          post.groups.map((g, i) => (
            <span key={i} style={{
              fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600,
              letterSpacing: "0.06em", padding: "2px 8px", borderRadius: "10px",
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

      {/* Title */}
      {post.title && (
        <h2 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "18px",
          color: "#0F0F0F", margin: "0 0 8px", letterSpacing: "-0.01em",
        }}>
          {post.title}
        </h2>
      )}

      {/* Body preview */}
      <div style={{
        fontSize: "15px", color: "#3D3D3D", lineHeight: 1.7,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden", marginBottom: "14px",
      }}>
        {post.body}
      </div>

      {/* Footer: author + comment count */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {post.author?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatar_url}
              alt={authorName}
              style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: "rgba(255,79,26,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 700, color: "#FF4F1A",
            }}>
              {initials}
            </div>
          )}
          <span style={{ fontSize: "12px", color: "#6E6E6E", fontWeight: 500 }}>
            {authorName}
          </span>
        </div>

        {post.comment_count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#A3A3A3" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
          </div>
        )}
      </div>
    </Link>
  );
}
