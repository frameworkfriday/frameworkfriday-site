import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFacilitatorGroups, isFacilitatorOf } from "@/lib/auth/facilitator";
import ComposeForm from "@/components/posts/ComposeForm";
import PostCard from "@/components/posts/PostCard";
import { createFacilitatorPost, deleteFacilitatorPost, sendFacilitatorEmail } from "./actions";
import Link from "next/link";

export default async function FacilitatorAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group: groupSlug } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const facilitatedGroups = await getFacilitatorGroups(user.id);
  if (facilitatedGroups.length === 0) redirect("/");

  if (!groupSlug && facilitatedGroups.length === 1) {
    redirect(`/facilitator/announcements?group=${facilitatedGroups[0].slug}`);
  }
  if (!groupSlug) redirect("/facilitator");

  const selectedGroup = facilitatedGroups.find((g) => g.slug === groupSlug);
  if (!selectedGroup) redirect("/facilitator");

  const hasAccess = await isFacilitatorOf(user.id, selectedGroup.id);
  if (!hasAccess) redirect("/facilitator");

  const admin = createAdminClient();

  // Fetch group posts
  const { data: groupPostIds } = await admin
    .from("post_audiences")
    .select("post_id")
    .eq("forum_group_id", selectedGroup.id);

  const postIdList = (groupPostIds ?? []).map((p) => p.post_id);

  type RawPost = {
    id: string; title: string | null; body: string; post_type: string; is_pinned: boolean;
    is_global: boolean; created_at: string; edited_at: string | null; author_id: string;
    profiles: unknown; post_audiences: unknown;
  };

  let groupPosts: RawPost[] = [];
  if (postIdList.length > 0) {
    const { data } = await admin
      .from("posts")
      .select(`
        id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
        profiles:author_id(first_name, last_name, avatar_url),
        post_audiences(forum_group_id, forum_groups(name))
      `)
      .in("id", postIdList)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    groupPosts = (data ?? []) as RawPost[];
  }

  // Also get global posts
  const { data: globalPosts } = await admin
    .from("posts")
    .select(`
      id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
      profiles:author_id(first_name, last_name, avatar_url),
      post_audiences(forum_group_id, forum_groups(name))
    `)
    .eq("is_global", true)
    .order("created_at", { ascending: false })
    .limit(20);

  // Merge and deduplicate
  const allRaw = [...groupPosts, ...((globalPosts ?? []) as RawPost[])];
  const seen = new Set<string>();
  const deduped = allRaw.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  deduped.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Get comment counts
  const allPostIds = deduped.map((p) => p.id);
  let commentCounts: Record<string, number> = {};
  if (allPostIds.length > 0) {
    const { data: counts } = await admin
      .from("comments")
      .select("post_id")
      .in("post_id", allPostIds);
    commentCounts = (counts ?? []).reduce((acc, c) => {
      acc[c.post_id] = (acc[c.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  const mappedPosts = deduped.map((p) => {
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

  const composeGroups = facilitatedGroups.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          <Link href={`/facilitator?group=${groupSlug}`} style={{ color: "#FF4F1A", textDecoration: "none" }}>
            Facilitator
          </Link>
          {" / "}
          {selectedGroup.name}
        </div>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Announcements
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Post updates and manage discussions for {selectedGroup.name}.
        </p>
      </div>

      {/* Email group */}
      <details className="card" style={{ padding: 0, marginBottom: "16px" }}>
        <summary style={{
          padding: "12px 20px", cursor: "pointer", listStyle: "none",
          display: "flex", alignItems: "center", gap: "8px",
          fontSize: "13px", fontWeight: 600, color: "#6E6E6E",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Email Group
        </summary>
        <form action={sendFacilitatorEmail} style={{ padding: "0 20px 16px", borderTop: "1px solid #F0F0EE" }}>
          <input type="hidden" name="forum_group_id" value={selectedGroup.id} />
          <div style={{ margin: "14px 0" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6E6E6E", marginBottom: "6px" }}>Subject *</label>
            <input name="subject" type="text" required placeholder="Email subject" style={{
              width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #E5E5E5",
              background: "#FFFFFF", fontSize: "14px", color: "#0F0F0F", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6E6E6E", marginBottom: "6px" }}>Message *</label>
            <textarea name="body" rows={4} required placeholder="Write your email..." style={{
              width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #E5E5E5",
              background: "#FFFFFF", fontSize: "14px", color: "#0F0F0F", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              resize: "vertical", lineHeight: 1.6,
            }} />
          </div>
          <button type="submit" style={{
            padding: "10px 20px", borderRadius: "8px", border: "none",
            background: "#FF4F1A", color: "#FFFFFF", fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}>
            Send Email
          </button>
        </form>
      </details>

      {/* Compose */}
      <ComposeForm role="facilitator" groups={composeGroups} createAction={createFacilitatorPost} />

      {/* Posts */}
      {mappedPosts.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            No posts yet
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Use the form above to post your first announcement to the group.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {mappedPosts.map((p, idx) => (
            <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${idx * 0.03}s`, position: "relative" }}>
              <PostCard post={p} />
              <form action={deleteFacilitatorPost} style={{ position: "absolute", top: "12px", right: "12px" }}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="forum_group_id" value={selectedGroup.id} />
                <button type="submit" style={{
                  background: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: "6px",
                  cursor: "pointer", padding: "5px 12px", fontSize: "11px",
                  fontWeight: 600, color: "#A3A3A3",
                }}>
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
