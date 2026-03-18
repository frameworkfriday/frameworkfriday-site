import { createAdminClient } from "@/lib/supabase/admin";
import ComposeForm from "@/components/posts/ComposeForm";
import PostCard from "@/components/posts/PostCard";
import { createAdminPost, deleteAnyPost, adminTogglePin, sendEmailBlast } from "./actions";
import EmailBlastForm from "./EmailBlastForm";
import Link from "next/link";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function AdminAnnouncementsPage() {
  const admin = createAdminClient();

  const [{ data: posts }, { data: groups }] = await Promise.all([
    admin
      .from("posts")
      .select(`
        id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
        profiles:author_id(first_name, last_name, avatar_url),
        post_audiences(forum_group_id, forum_groups(name))
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("forum_groups").select("id, name").order("name"),
  ]);

  const allGroups = groups ?? [];

  // Get comment counts
  const postIds = (posts ?? []).map((p) => p.id);
  let commentCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: counts } = await admin
      .from("comments")
      .select("post_id")
      .in("post_id", postIds);
    commentCounts = (counts ?? []).reduce((acc, c) => {
      acc[c.post_id] = (acc[c.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  const mappedPosts = (posts ?? []).map((p) => {
    const author = p.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null;
    const audiences = (p.post_audiences as unknown as { forum_group_id: string; forum_groups: { name: string } | null }[]) ?? [];
    const groups = audiences.filter((a) => a.forum_groups).map((a) => ({ name: a.forum_groups!.name }));
    return {
      id: p.id,
      title: p.title,
      body: p.body,
      post_type: p.post_type,
      is_pinned: p.is_pinned,
      is_global: p.is_global,
      created_at: p.created_at,
      edited_at: p.edited_at,
      author,
      groups,
      comment_count: commentCounts[p.id] || 0,
    };
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Admin
        </div>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Communications
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Post announcements, manage discussions, and moderate content across all groups.
        </p>
      </div>

      {/* Email blast */}
      <EmailBlastForm groups={allGroups} sendAction={sendEmailBlast} />

      {/* Compose form */}
      <ComposeForm role="admin" groups={allGroups} createAction={createAdminPost} />

      {/* All posts */}
      {mappedPosts.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            No posts yet
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Use the form above to post the first announcement.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {mappedPosts.map((p, idx) => (
            <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${idx * 0.03}s` }}>
              <div style={{ position: "relative" }}>
                <PostCard post={p} />
                {/* Admin actions overlay */}
                <div style={{
                  position: "absolute", top: "12px", right: "12px",
                  display: "flex", gap: "6px",
                }}>
                  <form action={adminTogglePin}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="pinned" value={p.is_pinned ? "false" : "true"} />
                    <button type="submit" style={{
                      background: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: "6px",
                      cursor: "pointer", padding: "5px 12px", fontSize: "11px",
                      fontWeight: 600, color: "#6E6E6E",
                    }}>
                      {p.is_pinned ? "Unpin" : "Pin"}
                    </button>
                  </form>
                  <form action={deleteAnyPost}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" style={{
                      background: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: "6px",
                      cursor: "pointer", padding: "5px 12px", fontSize: "11px",
                      fontWeight: 600, color: "#A3A3A3",
                    }}>
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
