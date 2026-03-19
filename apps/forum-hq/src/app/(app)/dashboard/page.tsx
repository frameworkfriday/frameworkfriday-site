import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import OnboardingWidget from "./OnboardingWidget";
import DashboardFeed from "./DashboardFeed";
import AvatarStack from "@/components/AvatarStack";
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
      .select("first_name, last_name, business_name, onboarding_completed_at, onboarding_path")
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
    .select("forum_group_id, forum_groups(id, name, description, google_calendar_id)")
    .eq("user_id", user.id);

  const group = (memberships?.[0]?.forum_groups as unknown as { id: string; name: string; description: string | null; google_calendar_id: string | null } | null) ?? null;
  const groupId = group?.id ?? null;

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

    // Recent posts with comments and reactions
    (async () => {
      let postQuery = admin
        .from("posts")
        .select(`
          id, title, body, post_type, is_pinned, is_global, created_at, edited_at, author_id,
          profiles:author_id(first_name, last_name, avatar_url),
          post_audiences(forum_group_id, forum_groups(name))
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (groupId) {
        const { data: groupPostIds } = await admin
          .from("post_audiences")
          .select("post_id")
          .eq("forum_group_id", groupId);
        const ids = (groupPostIds ?? []).map((p) => p.post_id);
        postQuery = postQuery.or(`is_global.eq.true${ids.length > 0 ? `,id.in.(${ids.join(",")})` : ""}`);
      } else {
        postQuery = postQuery.eq("is_global", true);
      }

      const { data: posts } = await postQuery;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.id);

      // Fetch comments, comment counts, and reactions in parallel
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

      // Group comments by post
      const commentsByPost: Record<string, typeof allComments> = {};
      for (const c of allComments ?? []) {
        if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
        commentsByPost[c.post_id]!.push(c);
      }

      // Group reactions by post → emoji
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

    // Member profiles for avatar stack
    groupId
      ? admin
          .from("forum_group_members")
          .select("profiles(first_name, last_name, email, avatar_url)")
          .eq("forum_group_id", groupId)
      : Promise.resolve({ data: [] as { profiles: { first_name: string; last_name: string; email: string; avatar_url: string | null } }[] }),

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

  type MemberProfile = { first_name: string; last_name: string; email: string; avatar_url: string | null };
  const members = (memberProfiles ?? []).map((m) => m.profiles as unknown as MemberProfile).filter(Boolean);

  const nextSession = nextSessions?.[0] ?? null;
  const secondSession = nextSessions?.[1] ?? null;
  const unreadCount = unreadNotifs?.length ?? 0;

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
    ? members.filter((m) => rsvpMap[m.email.toLowerCase()] === "accepted")
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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{
          fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px",
        }}>
          Dashboard
        </div>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px",
          color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em",
        }}>
          Welcome back, {firstName}.
        </h1>
        {profile?.business_name && (
          <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
            {profile.business_name}
          </p>
        )}
      </div>

      {/* ─── NEXT SESSION — Top Priority ─── */}
      {nextSession && sessionType ? (
        <div className="card animate-fade-up" style={{
          padding: "16px 20px", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
          borderLeft: `3px solid ${sessionType.color}`,
        }}>
          {/* Countdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "80px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: sessionType.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: "14px", fontFamily: "var(--font-syne)", fontWeight: 800, color: sessionType.color }}>
                {sessionCountdown}
              </span>
            </div>
          </div>

          {/* Session info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "14px", color: "#0F0F0F" }}>
                {nextSession.title}
              </span>
              <span style={{
                fontSize: "9px", fontWeight: 600, padding: "2px 7px", borderRadius: "20px",
                background: sessionType.bg, color: sessionType.color, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                {sessionType.label}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
              {new Date(nextSession.starts_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {" at "}
              {new Date(nextSession.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              {" · "}{nextSession.duration_minutes}min
              {secondSession && (
                <span style={{ color: "#C4C4C4" }}>
                  {" · Then "}{secondSession.title}{" · "}
                  {new Date(secondSession.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>

          {/* RSVP / Attendees */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {hasRsvp && confirmedMembers.length > 0 && (
              <AvatarStack people={confirmedMembers} size={24} max={4} confirmedCount={confirmedMembers.length} totalCount={members.length} />
            )}
            {userRsvp === "accepted" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#22C55E" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Going
              </span>
            ) : userRsvp === "tentative" ? (
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#EAB308" }}>Tentative</span>
            ) : userRsvp === "declined" ? (
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#EF4444" }}>Declined</span>
            ) : hasRsvp ? (
              <Link href={`/sessions/${nextSession.id}`} style={{
                padding: "6px 14px", borderRadius: "6px",
                background: "#FF4F1A", color: "#FFF",
                fontSize: "12px", fontWeight: 600, textDecoration: "none",
              }}>
                RSVP
              </Link>
            ) : null}
            {nextSession.video_call_url && (
              <a href={nextSession.video_call_url} target="_blank" rel="noopener noreferrer" style={{
                padding: "6px 14px", borderRadius: "6px",
                background: "#0F0F0F", color: "#FFF",
                fontSize: "12px", fontWeight: 600, textDecoration: "none",
              }}>
                Join
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="card animate-fade-up" style={{
          padding: "14px 20px", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "#F0F0F0",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#6E6E6E" }}>No upcoming sessions</div>
            <div style={{ fontSize: "11px", color: "#A3A3A3" }}>Your facilitator will schedule sessions soon.</div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div className="card animate-fade-up delay-1" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F0F0F" }}>{members.length}</span>
          <span style={{ fontSize: "11px", color: "#A3A3A3" }}>members</span>
        </div>
        <Link href="/notifications" style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
          <div className="card animate-fade-up delay-2 card-hover" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? "#FF4F1A" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ fontSize: "14px", fontWeight: 700, color: unreadCount > 0 ? "#FF4F1A" : "#0F0F0F" }}>{unreadCount}</span>
            <span style={{ fontSize: "11px", color: "#A3A3A3" }}>notifications</span>
          </div>
        </Link>
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

      {/* 2-Column: Feed + Sidebar */}
      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>

        {/* ── FEED ── */}
        <div>
          <DashboardFeed posts={feedPosts} currentUserId={user.id} />
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Your Forum */}
          <div className="card animate-fade-up delay-1" style={{ padding: "18px 20px" }}>
            <div style={{
              fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "10px",
            }}>
              Your Forum
            </div>
            {group ? (
              <div>
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: "#0F0F0F", marginBottom: "8px" }}>
                  {group.name}
                </div>
                {members.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <AvatarStack people={members} size={22} max={5} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#6E6E6E" }}>
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <Link href="/forum" style={{ fontSize: "12px", color: "#FF4F1A", fontWeight: 600, textDecoration: "none" }}>
                  View members &rarr;
                </Link>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#A3A3A3" }}>No group assigned yet.</div>
            )}
          </div>

          {/* Resources */}
          <div className="card animate-fade-up delay-2" style={{ padding: "18px 20px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px",
            }}>
              <div style={{
                fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3",
              }}>
                Resources
              </div>
              <Link href="/resources" style={{ fontSize: "11px", color: "#FF4F1A", fontWeight: 600, textDecoration: "none" }}>
                All &rarr;
              </Link>
            </div>
            {resources && resources.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 10px", borderRadius: "6px", background: "#F7F7F6",
                      textDecoration: "none", transition: "background 0.15s",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#0F0F0F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.title}
                      </div>
                    </div>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#A3A3A3" }}>No resources yet.</div>
            )}
          </div>

          {/* Sessions link */}
          <Link href="/sessions" className="card card-hover animate-fade-up delay-3" style={{
            padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F0F0F" }}>View all sessions</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
