import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import PostCard from "@/components/posts/PostCard";
import ComposeForm from "@/components/posts/ComposeForm";
import { createPost } from "./actions";
import Link from "next/link";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Get user's groups
  const { data: memberships } = await admin
    .from("forum_group_members")
    .select("forum_group_id, role, forum_groups(id, name)")
    .eq("user_id", user.id);

  const userGroups = (memberships ?? []).map((m) => {
    const g = m.forum_groups as unknown as { id: string; name: string };
    return { id: g.id, name: g.name };
  });
  const groupIds = userGroups.map((g) => g.id);

  // Determine role for compose form
  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  const isFacilitator = (memberships ?? []).some((m) => m.role === "facilitator");

  let composeRole: "member" | "facilitator" | "admin" = "member";
  if (adminRole) composeRole = "admin";
  else if (isFacilitator) composeRole = "facilitator";

  // For admin compose: fetch all groups
  let composeGroups = userGroups;
  if (adminRole) {
    const { data: allGroups } = await admin.from("forum_groups").select("id, name").order("name");
    composeGroups = allGroups ?? [];
  }

  // Build query for posts
  let query = admin
    .from("posts")
    .select(`
      id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
      profiles:author_id(first_name, last_name, avatar_url),
      post_audiences(forum_group_id, forum_groups(name))
    `)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  // Apply group filter
  if (filter && filter !== "all") {
    // Filter to a specific group
    const filterGroup = userGroups.find((g) => g.id === filter);
    if (filterGroup) {
      const { data: groupPostIds } = await admin
        .from("post_audiences")
        .select("post_id")
        .eq("forum_group_id", filter);
      const ids = (groupPostIds ?? []).map((p) => p.post_id);
      if (ids.length > 0) {
        query = query.in("id", ids);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // no results
      }
    }
  } else {
    // Show global + user's group posts
    if (groupIds.length > 0) {
      const { data: groupPostIds } = await admin
        .from("post_audiences")
        .select("post_id")
        .in("forum_group_id", groupIds);
      const ids = (groupPostIds ?? []).map((p) => p.post_id);

      // Global posts + group posts
      query = query.or(`is_global.eq.true${ids.length > 0 ? `,id.in.(${ids.join(",")})` : ""}`);
    } else {
      query = query.eq("is_global", true);
    }
  }

  const { data: posts } = await query;

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

  // Map posts for PostCard
  const mappedPosts = (posts ?? []).map((p) => {
    const author = p.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null;
    const audiences = (p.post_audiences as unknown as { forum_group_id: string; forum_groups: { name: string } | null }[]) ?? [];
    const groups = audiences
      .filter((a) => a.forum_groups)
      .map((a) => ({ name: a.forum_groups!.name }));

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
      <div style={{ marginBottom: "24px" }}>
        <div style={{
          fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px",
        }}>
          Community
        </div>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px",
          color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em",
        }}>
          Feed
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Announcements, discussions, and updates from your Forum community.
        </p>
      </div>

      {/* Filter tabs */}
      {userGroups.length > 0 && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
          <Link
            href="/announcements"
            style={{
              padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
              textDecoration: "none",
              background: !filter || filter === "all" ? "#0F0F0F" : "#F5F5F4",
              color: !filter || filter === "all" ? "#FFFFFF" : "#6E6E6E",
            }}
          >
            All
          </Link>
          {userGroups.map((g) => (
            <Link
              key={g.id}
              href={`/announcements?filter=${g.id}`}
              style={{
                padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                textDecoration: "none",
                background: filter === g.id ? "#0F0F0F" : "#F5F5F4",
                color: filter === g.id ? "#FFFFFF" : "#6E6E6E",
              }}
            >
              {g.name}
            </Link>
          ))}
        </div>
      )}

      {/* Compose */}
      <ComposeForm role={composeRole} groups={composeGroups} createAction={createPost} />

      {/* Feed */}
      {mappedPosts.length === 0 ? (
        <div className="card animate-fade-up" style={{ padding: "48px 28px", textAlign: "center" }}>
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
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            No posts yet
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Be the first to start a discussion or share an update.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mappedPosts.map((p, idx) => (
            <PostCard key={p.id} post={p} animationDelay={idx * 0.04} />
          ))}
        </div>
      )}
    </div>
  );
}
