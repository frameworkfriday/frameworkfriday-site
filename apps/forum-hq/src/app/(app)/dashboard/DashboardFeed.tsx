import Link from "next/link";
import PostCard from "@/components/posts/PostCard";

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
}

export default function DashboardFeed({ posts }: { posts: PostData[] }) {
  if (posts.length === 0) {
    return (
      <div className="card animate-fade-up delay-2" style={{ padding: "48px 28px", textAlign: "center" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: "rgba(255,79,26,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
          No posts yet
        </div>
        <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
          Updates from your community will appear here.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {posts.map((p, idx) => (
          <PostCard key={p.id} post={p} animationDelay={0.08 + idx * 0.04} />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <Link
          href="/announcements"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#FF4F1A",
            background: "rgba(255,79,26,0.06)",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
        >
          View all posts &rarr;
        </Link>
      </div>
    </div>
  );
}
