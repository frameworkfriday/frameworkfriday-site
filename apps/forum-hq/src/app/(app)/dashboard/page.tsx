import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import OnboardingWidget from "./OnboardingWidget";
import DashboardFeed from "./DashboardFeed";
import AvatarStack from "@/components/AvatarStack";
import MembersSidebar from "@/components/MembersSidebar";
import { getEventAttendees } from "@/lib/google/calendar";

const SESSION_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  forum_session: { label: "Forum Session", color: "#FF4F1A", bg: "rgba(255,79,26,0.10)" },
  office_hours: { label: "Office Hours", color: "#6E6E6E", bg: "#F0F0F0" },
  ad_hoc: { label: "Ad Hoc", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Core data
  const [{ data: profile }, { data: progressRows }, { data: allOnboardingItems }] = await Promise.all([
    admin
      .from("profiles")
      .select("first_name, last_name, business_name, avatar_url, role_title, onboarding_completed_at, onboarding_path")
      .eq("id", user.id)
      .single(),
    admin
      .from("onboarding_progress")
      .select("item_id, completed_at")
      .eq("user_id", user.id),
    admin
      .from("onboarding_items")
      .select("id, title, description, action_url, action_label, position, is_required, path")
      .order("position"),
  ]);

  const firstName = profile?.first_name || "Member";

  // Build onboarding data — filter items by member's onboarding path
  const memberPath = profile?.onboarding_path ?? null;
  const completedIds = new Set(
    (progressRows ?? []).filter((r) => r.completed_at).map((r) => r.item_id)
  );
  const onboardingItems = (allOnboardingItems ?? [])
    .filter((item) => {
      const itemPath = (item as { path: string | null }).path;
      return itemPath === null || itemPath === memberPath;
    })
    .map((item) => ({
      ...item,
      done: completedIds.has(item.id),
    }));
  const totalRequired = onboardingItems.filter((i) => i.is_required).length;
  const completedCount = onboardingItems.filter((i) => i.is_required && i.done).length;
  const hasIncompleteOnboarding = completedCount < totalRequired;

  // Get user's group(s)
  const { data: memberships } = await admin
    .from("forum_group_members")
    .select("forum_group_id, forum_groups(id, name, description, google_calendar_id, badge_color)")
    .eq("user_id", user.id);

  const group = (memberships?.[0]?.forum_groups as unknown as { id: string; name: string; description: string | null; google_calendar_id: string | null; badge_color: string | null } | null) ?? null;
  const groupId = group?.id ?? null;

  // Check user role
  const [{ data: adminRole }, { data: facMemberships }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
    admin.from("forum_group_members").select("role").eq("user_id", user.id).eq("role", "facilitator"),
  ]);
  const isAdmin = !!adminRole;
  const isFacilitator = !!(facMemberships && facMemberships.length > 0);
  const userRole: "admin" | "facilitator" | "member" = isAdmin ? "admin" : isFacilitator ? "facilitator" : "member";

  // Get all groups for compose form (admin sees all, others see their own)
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

  // Fetch dashboard data in parallel
  const [
    { data: nextSessions },
    feedPosts,
    { data: memberProfiles },
    { data: resources },
    { data: unreadNotifs },
  ] = await Promise.all([
    // Next upcoming sessions (get 2)
    groupId
      ? admin
          .from("sessions")
          .select("id, title, description, starts_at, duration_minutes, video_call_url, session_type, google_event_id")
          .eq("forum_group_id", groupId)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(2)
      : Promise.resolve({ data: [] as { id: string; title: string; description: string | null; starts_at: string; duration_minutes: number; video_call_url: string | null; session_type: string; google_event_id: string | null }[] }),

    // Recent posts with comments and reactions (group-scoped)
    (async () => {
      if (!groupId) {
        // No group — show only global posts
        const { data: posts } = await admin
          .from("posts")
          .select(`
            id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
            profiles:author_id(first_name, last_name, avatar_url),
            post_audiences(forum_group_id, forum_groups(name))
          `)
          .eq("is_global", true)
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
      }

      // Group-scoped posts
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
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          edited_at: c.edited_at,
          author_id: c.author_id,
          author: c.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null } | null,
        }));
        const postReactions = Object.entries(reactionsByPost[p.id] ?? {}).map(([emoji, data]) => ({
          emoji,
          count: data.count,
          reacted: data.reacted,
        }));

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
          comment_count: postComments.length,
          comments: postComments,
          reactions: postReactions,
        };
      });
    })(),

    // Full member profiles for sidebar (with social links)
    groupId
      ? admin
          .from("forum_group_members")
          .select(`
            user_id,
            profiles(first_name, last_name, email, business_name, role_title, avatar_url, linkedin_url, website_url)
          `)
          .eq("forum_group_id", groupId)
      : Promise.resolve({ data: [] as { user_id: string; profiles: unknown }[] }),

    // Resources
    admin
      .from("resources")
      .select("id, category, title, description, url")
      .order("position")
      .limit(4),

    // Unread notification count
    admin
      .from("notifications")
      .select("id")
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  type MemberProfile = {
    first_name: string; last_name: string; email: string;
    business_name: string | null; role_title: string | null;
    avatar_url: string | null; linkedin_url: string | null; website_url: string | null;
  };

  const members = (memberProfiles ?? []).map((m) => ({
    user_id: (m as { user_id: string }).user_id,
    profile: (m as { profiles: unknown }).profiles as MemberProfile | null,
  })).filter((m) => m.profile);

  // Simple members list for avatar stack
  const membersList = members.map((m) => m.profile!);

  const nextSession = nextSessions?.[0] ?? null;
  const groupColor = group?.badge_color || "#FF4F1A";
  const unreadCount = unreadNotifs?.length ?? 0;
  const fullName = profile ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : "Member";
  const userInitials = fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  // Fetch RSVP data for next session
  let rsvpMap: Record<string, string> = {};
  if (nextSession?.google_event_id && group?.google_calendar_id) {
    try {
      const attendees = await getEventAttendees(group.google_calendar_id, nextSession.google_event_id);
      for (const a of attendees) {
        rsvpMap[a.email.toLowerCase()] = a.responseStatus;
      }
    } catch {
      // Calendar API unavailable
    }
  }

  const hasRsvp = Object.keys(rsvpMap).length > 0;
  const confirmedMembers = hasRsvp
    ? membersList.filter((m) => rsvpMap[m.email.toLowerCase()] === "accepted")
    : [];
  const userRsvp = hasRsvp && user.email ? rsvpMap[user.email.toLowerCase()] : undefined;

  // Time until next session
  const sessionCountdown = nextSession
    ? (() => {
        const diff = new Date(nextSession.starts_at).getTime() - Date.now();
        if (diff < 0) return "Now";
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h`;
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${mins}m`;
      })()
    : null;

  const sessionType = nextSession ? (SESSION_TYPES[nextSession.session_type] ?? SESSION_TYPES.forum_session) : null;

  // Format session date nicely
  const sessionDateStr = nextSession
    ? new Date(nextSession.starts_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : null;
  const sessionTimeStr = nextSession
    ? new Date(nextSession.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div>
      {/* ─── GROUP HEADER ─── */}
      <div className="animate-fade-up" style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
        overflow: "hidden",
        marginBottom: "24px",
      }}>
        {/* Color accent bar */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${groupColor}, ${groupColor}66)` }} />
        <div className="group-header-card" style={{ padding: "28px 32px" }}>
          {/* Group info */}
          <div className="group-header-info" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: nextSession ? "24px" : "0" }}>
            {/* User avatar with group color ring */}
            <div className="group-header-avatar" style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${groupColor}, ${groupColor}88)`,
              padding: "3px",
              flexShrink: 0,
            }}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={fullName}
                  style={{
                    width: "100%", height: "100%", borderRadius: "50%",
                    objectFit: "cover", border: "2px solid #FFFFFF",
                  }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%", borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 700, color: groupColor,
                  border: "2px solid #FFFFFF",
                }}>
                  {userInitials}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <h1 className="group-header-title" style={{
                  fontWeight: 700, fontSize: "24px", color: "#0F0F0F",
                  margin: 0, letterSpacing: "-0.02em",
                }}>
                  {group?.name ?? "Your Group"}
                </h1>
                <span className="member-badge" style={{
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

            {/* Notification bell */}
            <Link href="/notifications" style={{
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "40px", height: "40px", borderRadius: "10px",
              textDecoration: "none", color: "#6E6E6E", flexShrink: 0,
              background: unreadCount > 0 ? "#FFF3EE" : "transparent",
              transition: "background 0.15s ease",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <div style={{
                  position: "absolute", top: "6px", right: "6px",
                  width: unreadCount > 9 ? "16px" : "8px",
                  height: unreadCount > 9 ? "16px" : "8px",
                  borderRadius: "50%",
                  background: "#FF4F1A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 700, color: "#FFFFFF",
                }}>
                  {unreadCount > 9 ? `${unreadCount}` : ""}
                </div>
              )}
            </Link>
          </div>

          {/* Session row */}
          {nextSession && sessionType ? (
            <div className="session-row" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px",
              background: "#FAFAF8",
              borderRadius: "12px",
              gap: "20px",
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1, minWidth: 0 }}>
                {/* Calendar icon with date */}
                <div style={{
                  width: "48px", height: "48px", borderRadius: "10px",
                  border: "1px solid #EAEAE8",
                  background: "#FFFFFF",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  overflow: "hidden",
                }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#FF4F1A", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1, marginBottom: "2px" }}>
                    {new Date(nextSession.starts_at).toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F0F0F", lineHeight: 1 }}>
                    {new Date(nextSession.starts_at).getDate()}
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#0F0F0F", lineHeight: 1.3 }}>
                      {nextSession.title}
                    </span>
                    <span style={{
                      fontSize: "11px", fontWeight: 600,
                      color: "#6E6E6E",
                    }}>
                      {sessionType.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#7A7A7A", marginTop: "3px" }}>
                    {sessionDateStr} at {sessionTimeStr} · {nextSession.duration_minutes} min
                    {sessionCountdown && (
                      <span style={{ color: "#FF4F1A", fontWeight: 600 }}> · in {sessionCountdown}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="session-actions" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {hasRsvp && confirmedMembers.length > 0 && (
                  <AvatarStack people={confirmedMembers} size={28} max={4} confirmedCount={confirmedMembers.length} totalCount={membersList.length} />
                )}
                {userRsvp === "accepted" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "#22C55E" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Going
                  </span>
                ) : userRsvp === "tentative" ? (
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#EAB308" }}>Tentative</span>
                ) : userRsvp === "declined" ? (
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#EF4444" }}>Declined</span>
                ) : hasRsvp ? (
                  <Link href={`/sessions/${nextSession.id}`} style={{
                    padding: "7px 18px", borderRadius: "8px",
                    background: "#0F0F0F", color: "#FFF",
                    fontSize: "12px", fontWeight: 600, textDecoration: "none",
                  }}>
                    RSVP
                  </Link>
                ) : null}
                {nextSession.video_call_url && (
                  <a href={nextSession.video_call_url} target="_blank" rel="noopener noreferrer" style={{
                    padding: "7px 18px", borderRadius: "8px",
                    background: "#FF4F1A", color: "#FFF",
                    fontSize: "12px", fontWeight: 600, textDecoration: "none",
                  }}>
                    Join Call
                  </a>
                )}
                <Link href={`/sessions/${nextSession.id}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "32px", height: "32px", borderRadius: "8px",
                  textDecoration: "none", color: "#A3A3A3",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              padding: "16px 24px",
              background: "#FAFAF8",
              borderRadius: "12px",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ fontSize: "13px", color: "#A3A3A3" }}>No upcoming sessions — your facilitator will schedule sessions soon.</span>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding */}
      {hasIncompleteOnboarding && (
        <OnboardingWidget
          items={onboardingItems}
          userId={user.id}
          completedCount={completedCount}
          totalRequired={totalRequired}
        />
      )}

      {/* 2-Column: Feed + Members Sidebar */}
      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>

        {/* ── FEED ── */}
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

        {/* ── SIDEBAR: Members + Resources ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Members list with online presence */}
          {groupId ? (
            <MembersSidebar
              members={members.map((m) => ({ user_id: m.user_id, profile: m.profile! }))}
              currentUserId={user.id}
              groupId={groupId}
              groupColor={groupColor}
            />
          ) : (
            <div className="animate-fade-up delay-1" style={{
              background: "#FFFFFF", borderRadius: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
              padding: "20px",
            }}>
              <div style={{ fontSize: "13px", color: "#A3A3A3", textAlign: "center", padding: "20px 0" }}>
                Members will appear here once you&apos;re assigned to a group.
              </div>
            </div>
          )}

          {/* Resources */}
          <div className="animate-fade-up delay-2" style={{
            background: "#FFFFFF", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)", borderRadius: "14px",
            padding: "18px 20px",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #F0F0EE",
            }}>
              <span style={{
                fontSize: "12px", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em", color: "#6E6E6E",
              }}>
                Resources
              </span>
              <Link href="/resources" style={{ fontSize: "12px", color: "#FF4F1A", fontWeight: 600, textDecoration: "none" }}>
                All →
              </Link>
            </div>
            {resources && resources.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 10px", borderRadius: "10px",
                      textDecoration: "none", transition: "background 0.15s",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F0F0F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {r.title}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#A3A3A3" }}>No resources yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
