import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import DashboardFeed from "@/app/(app)/dashboard/DashboardFeed";

export default async function ForumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Get user's forum group with badge_color
  const { data: memberships } = await admin
    .from("forum_group_members")
    .select(`
      joined_at, role,
      forum_groups (id, name, description, badge_color)
    `)
    .eq("user_id", user.id);

  const group = (memberships?.[0]?.forum_groups as unknown as {
    id: string; name: string; description: string | null; badge_color: string | null;
  } | null) ?? null;
  const groupId = group?.id ?? null;
  const groupColor = group?.badge_color || "#FF4F1A";

  // Check user role
  const [{ data: adminRole }, { data: facMemberships }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
    admin.from("forum_group_members").select("role").eq("user_id", user.id).eq("role", "facilitator"),
  ]);
  const isAdmin = !!adminRole;
  const isFacilitator = !!(facMemberships && facMemberships.length > 0);
  const userRole: "admin" | "facilitator" | "member" = isAdmin ? "admin" : isFacilitator ? "facilitator" : "member";

  // Get groups for compose form
  let feedGroups: { id: string; name: string }[] = [];
  if (isAdmin) {
    const { data } = await admin.from("forum_groups").select("id, name").order("name");
    feedGroups = (data ?? []) as { id: string; name: string }[];
  } else {
    feedGroups = (memberships ?? []).map(m => {
      const g = m.forum_groups as unknown as { id: string; name: string } | null;
      return g ? { id: g.id, name: g.name } : null;
    }).filter(Boolean) as { id: string; name: string }[];
  }

  // Fetch members and posts in parallel
  const [{ data: peers }, feedPosts] = await Promise.all([
    // Members in same group
    groupId
      ? admin
          .from("forum_group_members")
          .select(`
            user_id,
            joined_at,
            profiles (first_name, last_name, email, business_name, role_title, avatar_url, linkedin_url, website_url)
          `)
          .eq("forum_group_id", groupId)
      : Promise.resolve({ data: [] as { user_id: string; joined_at: string; profiles: unknown }[] }),

    // Posts scoped to this group
    (async () => {
      if (!groupId) return [];

      const { data: groupPostIds } = await admin
        .from("post_audiences")
        .select("post_id")
        .eq("forum_group_id", groupId);
      const ids = (groupPostIds ?? []).map((p) => p.post_id);

      const { data: posts } = await admin
        .from("posts")
        .select(`
          id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
          profiles:author_id(first_name, last_name, avatar_url),
          post_audiences(forum_group_id, forum_groups(name))
        `)
        .or(`is_global.eq.true${ids.length > 0 ? `,id.in.(${ids.join(",")})` : ""}`)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);

      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.id);

      const [{ data: allComments }, { data: allReactions }] = await Promise.all([
        admin
          .from("comments")
          .select("id, post_id, body, created_at, edited_at, author_id, profiles:author_id(first_name, last_name, avatar_url)")
          .in("post_id", postIds)
          .order("created_at"),
        admin
          .from("reactions")
          .select("post_id, user_id, emoji")
          .in("post_id", postIds),
      ]);

      const commentsByPost: Record<string, typeof allComments> = {};
      for (const c of allComments ?? []) {
        if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
        commentsByPost[c.post_id]!.push(c);
      }

      const reactionsByPost: Record<string, Record<string, { count: number; reacted: boolean }>> = {};
      for (const r of allReactions ?? []) {
        if (!reactionsByPost[r.post_id]) reactionsByPost[r.post_id] = {};
        if (!reactionsByPost[r.post_id][r.emoji]) reactionsByPost[r.post_id][r.emoji] = { count: 0, reacted: false };
        reactionsByPost[r.post_id][r.emoji].count++;
        if (r.user_id === user.id) reactionsByPost[r.post_id][r.emoji].reacted = true;
      }

      return posts.map((p) => {
        const author = p.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null;
        const audiences = (p.post_audiences as unknown as { forum_group_id: string; forum_groups: { name: string } | null }[]) ?? [];
        const groups = audiences.filter((a) => a.forum_groups).map((a) => ({ name: a.forum_groups!.name }));
        const postComments = (commentsByPost[p.id] ?? []).map((c) => ({
          id: c.id, body: c.body, created_at: c.created_at, edited_at: c.edited_at,
          author_id: c.author_id,
          author: c.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null,
        }));
        const postReactions = Object.entries(reactionsByPost[p.id] ?? {}).map(([emoji, data]) => ({
          emoji, count: data.count, reacted: data.reacted,
        }));

        return {
          id: p.id, title: p.title, body: p.body, post_type: p.post_type,
          is_pinned: p.is_pinned, is_global: p.is_global,
          created_at: p.created_at, edited_at: p.edited_at,
          author, groups, comment_count: postComments.length,
          comments: postComments, reactions: postReactions,
        };
      });
    })(),
  ]);

  type MemberProfile = {
    first_name: string; last_name: string; email: string;
    business_name: string | null; role_title: string | null;
    avatar_url: string | null; linkedin_url: string | null; website_url: string | null;
  };

  const members = (peers ?? []).map((m) => ({
    user_id: m.user_id,
    profile: m.profiles as unknown as MemberProfile | null,
  })).filter((m) => m.profile);

  return (
    <div>
      {/* ─── Group Header ─── */}
      <div className="animate-fade-up" style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
        overflow: "hidden",
        marginBottom: "24px",
      }}>
        {/* Color accent bar */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${groupColor}, ${groupColor}66)` }} />
        <div style={{ padding: "28px 32px", display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Group icon */}
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: `${groupColor}10`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={groupColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{
                fontWeight: 700, fontSize: "24px", color: "#0F0F0F",
                margin: 0, letterSpacing: "-0.02em",
              }}>
                {group?.name ?? "Your Group"}
              </h1>
              <span style={{
                fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                background: `${groupColor}10`, color: groupColor,
                letterSpacing: "0.04em",
              }}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
            {group?.description && (
              <p style={{ fontSize: "14px", color: "#7A7A7A", margin: 0, lineHeight: 1.5 }}>
                {group.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2-Column: Feed + Members Sidebar ─── */}
      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>

        {/* Feed */}
        <div>
          {groupId ? (
            <DashboardFeed
              posts={feedPosts}
              currentUserId={user.id}
              userRole={userRole}
              groups={feedGroups}
            />
          ) : (
            <div style={{
              background: "#FFFFFF", borderRadius: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
              padding: "48px 24px", textAlign: "center",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "14px",
                background: "#F5F4F1",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#6E6E6E", marginBottom: "4px" }}>No group assigned</div>
              <div style={{ fontSize: "13px", color: "#A3A3A3" }}>You&apos;ll be assigned to a forum group before Session 1.</div>
            </div>
          )}
        </div>

        {/* Members Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Members list card */}
          <div className="animate-fade-up delay-1" style={{
            background: "#FFFFFF", borderRadius: "14px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            padding: "20px",
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em", color: "#6E6E6E",
              marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #F0F0EE",
            }}>
              Forum Members
            </div>

            {members.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#A3A3A3", textAlign: "center", padding: "20px 0" }}>
                Members will appear here once assigned.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {members.map((m, idx) => {
                  const p = m.profile!;
                  const name = `${p.first_name} ${p.last_name}`.trim() || "Member";
                  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                  const isYou = m.user_id === user.id;

                  return (
                    <div key={m.user_id} className={`animate-fade-up delay-${Math.min(idx + 1, 6)}`} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 12px", borderRadius: "10px",
                      transition: "background 0.15s ease",
                      cursor: "default",
                    }}>
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.avatar_url} alt={name}
                          style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: `${groupColor}10`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", fontWeight: 700, color: groupColor, flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{
                            fontSize: "13px", fontWeight: 600, color: "#0F0F0F",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {name}
                          </span>
                          {isYou && (
                            <span style={{
                              fontSize: "9px", fontWeight: 700, color: groupColor,
                              background: `${groupColor}10`, padding: "1px 6px", borderRadius: "10px",
                            }}>
                              You
                            </span>
                          )}
                        </div>
                        {p.role_title && (
                          <div style={{
                            fontSize: "11px", color: "#A3A3A3", marginTop: "1px",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {p.role_title}
                          </div>
                        )}
                      </div>
                      {/* Social links */}
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        {p.linkedin_url && (
                          <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" title="LinkedIn"
                            style={{ color: "#C0C0C0", transition: "color 0.15s" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {p.website_url && (
                          <a href={p.website_url} target="_blank" rel="noopener noreferrer" title="Website"
                            style={{ color: "#C0C0C0", transition: "color 0.15s" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
