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

  // Always fetch profile + onboarding progress (regardless of onboarding_completed_at)
  const [{ data: profile }, { data: progressRows }, { data: allOnboardingItems }] = await Promise.all([
    admin
      .from("profiles")
      .select("first_name, last_name, business_name, onboarding_completed_at")
      .eq("id", user.id)
      .single(),
    admin
      .from("onboarding_progress")
      .select("item_id, completed_at")
      .eq("user_id", user.id),
    admin
      .from("onboarding_items")
      .select("id, title, description, action_url, action_label, position, is_required")
      .order("position"),
  ]);

  const firstName = profile?.first_name || "Member";

  // Build onboarding data
  const completedIds = new Set(
    (progressRows ?? []).filter((r) => r.completed_at).map((r) => r.item_id)
  );
  const onboardingItems = (allOnboardingItems ?? []).map((item) => ({
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
    // Next upcoming sessions
    groupId
      ? admin
          .from("sessions")
          .select("id, title, description, starts_at, duration_minutes, video_call_url, session_type, google_event_id")
          .eq("forum_group_id", groupId)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(2)
      : Promise.resolve({ data: [] as { id: string; title: string; description: string | null; starts_at: string; duration_minutes: number; video_call_url: string | null; session_type: string; google_event_id: string | null }[] }),

    // Recent posts with full data for PostCards (5 posts)
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
        .limit(5);

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

      // Get comment counts
      const postIds = posts.map((p) => p.id);
      const { data: counts } = await admin
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);
      const commentCounts = (counts ?? []).reduce((acc, c) => {
        acc[c.post_id] = (acc[c.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return posts.map((p) => {
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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
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

      {/* Quick stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {/* Next session countdown */}
        <div className="card animate-fade-up" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "rgba(255,79,26,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Next Session
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F0F0F", lineHeight: 1.2 }}>
              {sessionCountdown ?? "—"}
            </div>
          </div>
        </div>

        {/* Group member count */}
        <div className="card animate-fade-up delay-1" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "rgba(59,130,246,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Forum Members
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F0F0F", lineHeight: 1.2 }}>
              {members.length}
            </div>
          </div>
        </div>

        {/* Unread notifications */}
        <Link href="/notifications" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card animate-fade-up delay-2 card-hover" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: unreadCount > 0 ? "rgba(255,79,26,0.10)" : "#F0F0F0",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? "#FF4F1A" : "#A3A3A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Notifications
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: unreadCount > 0 ? "#FF4F1A" : "#0F0F0F", lineHeight: 1.2 }}>
                {unreadCount}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Onboarding widget — persistent when required items are incomplete */}
      {hasIncompleteOnboarding && (
        <OnboardingWidget
          items={onboardingItems}
          userId={user.id}
          completedCount={completedCount}
          totalRequired={totalRequired}
        />
      )}

      {/* 2-Column layout */}
      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* ── LEFT COLUMN: Activity Feed ── */}
        <div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "14px", padding: "0 2px",
          }}>
            <div style={{
              fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3",
            }}>
              Recent Activity
            </div>
          </div>
          <DashboardFeed posts={feedPosts} />
        </div>

        {/* ── RIGHT COLUMN: Session + Group + Resources ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Next Session */}
          <div className="card animate-fade-up delay-1" style={{ padding: "22px 24px" }}>
            <div style={{
              fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "14px",
            }}>
              Next Session
            </div>
            {nextSession ? (() => {
              const type = SESSION_TYPES[nextSession.session_type] ?? SESSION_TYPES.forum_session;
              const d = new Date(nextSession.starts_at);
              return (
                <div>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    {/* Date block */}
                    <div style={{
                      width: "52px", flexShrink: 0, textAlign: "center",
                      padding: "8px 6px", borderRadius: "10px", background: type.bg,
                    }}>
                      <div style={{ fontSize: "22px", fontFamily: "var(--font-syne)", fontWeight: 800, color: type.color, lineHeight: 1 }}>
                        {d.getDate()}
                      </div>
                      <div style={{ fontSize: "10px", color: type.color, fontWeight: 600, letterSpacing: "0.05em", marginTop: "2px" }}>
                        {d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                      </div>
                    </div>
                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: "#0F0F0F", marginBottom: "3px" }}>
                        {nextSession.title}
                      </div>
                      <span style={{
                        fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px",
                        background: type.bg, color: type.color, letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>
                        {type.label}
                      </span>
                      <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "8px" }}>
                        {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" at "}
                        {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {" · "}
                        {nextSession.duration_minutes}min
                      </div>
                    </div>
                  </div>

                  {/* RSVP */}
                  {hasRsvp && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F0F0F0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        {userRsvp === "accepted" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#22C55E" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Confirmed
                          </span>
                        ) : userRsvp === "tentative" ? (
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#EAB308" }}>Tentative</span>
                        ) : userRsvp === "declined" ? (
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#EF4444" }}>Declined</span>
                        ) : (
                          <Link href={`/sessions/${nextSession.id}`} style={{ fontSize: "12px", fontWeight: 600, color: "#FF4F1A", textDecoration: "none" }}>
                            RSVP needed &rarr;
                          </Link>
                        )}
                        {confirmedMembers.length > 0 && (
                          <AvatarStack people={confirmedMembers} size={22} max={3} confirmedCount={confirmedMembers.length} totalCount={members.length} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Join call */}
                  {nextSession.video_call_url && (
                    <a
                      href={nextSession.video_call_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block", marginTop: "12px",
                        padding: "8px 16px", background: "#FF4F1A", color: "white",
                        borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      Join Call
                    </a>
                  )}

                  {/* Second session */}
                  {secondSession && (
                    <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontSize: "10px", color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Then</div>
                      <div style={{ fontSize: "12px", color: "#6E6E6E" }}>
                        {secondSession.title} &middot;{" "}
                        {new Date(secondSession.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "12px" }}>
                    <Link href="/sessions" style={{ fontSize: "12px", color: "#FF4F1A", fontWeight: 600, textDecoration: "none" }}>
                      View all sessions &rarr;
                    </Link>
                  </div>
                </div>
              );
            })() : (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: "13px", color: "#A3A3A3" }}>No upcoming sessions</div>
                <div style={{ fontSize: "11px", color: "#D5D5D5", marginTop: "4px" }}>Your facilitator will schedule sessions soon.</div>
              </div>
            )}
          </div>

          {/* Your Forum */}
          <div className="card animate-fade-up delay-2" style={{ padding: "22px 24px" }}>
            <div style={{
              fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "14px",
            }}>
              Your Forum
            </div>
            {group ? (
              <div>
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "16px", color: "#0F0F0F", marginBottom: "4px" }}>
                  {group.name}
                </div>
                {group.description && (
                  <div style={{ fontSize: "13px", color: "#6E6E6E", marginBottom: "12px", lineHeight: 1.5 }}>
                    {group.description}
                  </div>
                )}
                {members.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <AvatarStack people={members} size={24} max={5} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#6E6E6E" }}>
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
          <div className="card animate-fade-up delay-3" style={{ padding: "22px 24px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px",
            }}>
              <div style={{
                fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3",
              }}>
                Resources
              </div>
              <Link href="/resources" style={{ fontSize: "11px", color: "#FF4F1A", fontWeight: 600, textDecoration: "none" }}>
                View all &rarr;
              </Link>
            </div>
            {resources && resources.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", borderRadius: "8px", background: "#F7F7F6",
                      textDecoration: "none", transition: "background 0.15s",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.title}
                      </div>
                      {r.description && (
                        <div style={{ fontSize: "11px", color: "#A3A3A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "1px" }}>
                          {r.description}
                        </div>
                      )}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: "13px", color: "#A3A3A3" }}>No resources yet</div>
                <div style={{ fontSize: "11px", color: "#D5D5D5", marginTop: "4px" }}>Resources will be added before your first session.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
