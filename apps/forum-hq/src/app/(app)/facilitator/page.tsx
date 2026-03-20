import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getFacilitatorGroups } from "@/lib/auth/facilitator";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function FacilitatorPage({
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

  // Auto-select if only one group
  if (!groupSlug && facilitatedGroups.length === 1) {
    redirect(`/facilitator?group=${facilitatedGroups[0].slug}`);
  }

  // If group selected, show dashboard for that group
  const selectedGroup = groupSlug
    ? facilitatedGroups.find((g) => g.slug === groupSlug)
    : null;

  if (groupSlug && !selectedGroup) redirect("/facilitator");

  const admin = createAdminClient();

  // Get stats for each group
  const groupStats: Record<string, { memberCount: number; nextSession: { title: string; starts_at: string; session_type: string } | null; announcementCount: number }> = {};

  for (const group of facilitatedGroups) {
    const [{ count: memberCount }, { data: nextSession }, { count: announcementCount }] = await Promise.all([
      admin
        .from("forum_group_members")
        .select("user_id", { count: "exact", head: true })
        .eq("forum_group_id", group.id),
      admin
        .from("sessions")
        .select("title, starts_at, session_type")
        .eq("forum_group_id", group.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(1)
        .maybeSingle(),
      admin
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("forum_group_id", group.id),
    ]);

    groupStats[group.id] = {
      memberCount: memberCount ?? 0,
      nextSession: nextSession as { title: string; starts_at: string; session_type: string } | null,
      announcementCount: announcementCount ?? 0,
    };
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: "10px",
    fontFamily: "var(--font-syne)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#A3A3A3",
    marginBottom: "6px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Facilitator
        </div>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          {selectedGroup ? selectedGroup.name : "Your Groups"}
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          {selectedGroup
            ? "Manage sessions, announcements, and view members for this group."
            : "Select a group to manage."}
        </p>
      </div>

      {/* Group selector (if multiple groups and one is selected) */}
      {selectedGroup && facilitatedGroups.length > 1 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={sectionLabel}>Switch Group</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {facilitatedGroups.map((g) => (
              <Link
                key={g.id}
                href={`/facilitator?group=${g.slug}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontFamily: "var(--font-syne)",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: g.id === selectedGroup.id ? "1.5px solid #FF4F1A" : "1px solid #E5E5E5",
                  background: g.id === selectedGroup.id ? "rgba(255,79,26,0.06)" : "#FFFFFF",
                  color: g.id === selectedGroup.id ? "#FF4F1A" : "#6E6E6E",
                }}
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Selected group dashboard */}
      {selectedGroup && (
        <div>
          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "8px" }}>
                Members
              </div>
              <div style={{ fontSize: "28px", fontFamily: "var(--font-syne)", fontWeight: 800, color: "#0F0F0F" }}>
                {groupStats[selectedGroup.id]?.memberCount ?? 0}
              </div>
            </div>
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "8px" }}>
                Announcements
              </div>
              <div style={{ fontSize: "28px", fontFamily: "var(--font-syne)", fontWeight: 800, color: "#0F0F0F" }}>
                {groupStats[selectedGroup.id]?.announcementCount ?? 0}
              </div>
            </div>
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "8px" }}>
                Next Session
              </div>
              {groupStats[selectedGroup.id]?.nextSession ? (
                <div>
                  <div style={{ fontSize: "14px", fontFamily: "var(--font-syne)", fontWeight: 700, color: "#0F0F0F" }}>
                    {groupStats[selectedGroup.id].nextSession!.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
                    {new Date(groupStats[selectedGroup.id].nextSession!.starts_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "#A3A3A3" }}>None scheduled</div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div style={sectionLabel}>Quick Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <Link
              href={`/facilitator/members?group=${selectedGroup.slug}`}
              className="card"
              style={{
                padding: "18px 20px",
                textDecoration: "none",
                color: "#0F0F0F",
                display: "block",
              }}
            >
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                View Members
              </div>
              <div style={{ fontSize: "12px", color: "#6E6E6E" }}>See who&apos;s in your group</div>
            </Link>
            <Link
              href={`/facilitator/sessions?group=${selectedGroup.slug}`}
              className="card"
              style={{
                padding: "18px 20px",
                textDecoration: "none",
                color: "#0F0F0F",
                display: "block",
              }}
            >
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                Manage Sessions
              </div>
              <div style={{ fontSize: "12px", color: "#6E6E6E" }}>Schedule and edit group sessions</div>
            </Link>
            <Link
              href={`/facilitator/announcements?group=${selectedGroup.slug}`}
              className="card"
              style={{
                padding: "18px 20px",
                textDecoration: "none",
                color: "#0F0F0F",
                display: "block",
              }}
            >
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                Post Announcement
              </div>
              <div style={{ fontSize: "12px", color: "#6E6E6E" }}>Send updates to your group</div>
            </Link>
          </div>
        </div>
      )}

      {/* Group picker (no group selected, multiple groups) */}
      {!selectedGroup && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {facilitatedGroups.map((group, idx) => {
            const stats = groupStats[group.id];
            return (
              <Link
                key={group.id}
                href={`/facilitator?group=${group.slug}`}
                className="card animate-fade-up"
                style={{
                  padding: "24px 28px",
                  textDecoration: "none",
                  color: "#0F0F0F",
                  display: "block",
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>
                  {group.name}
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#6E6E6E" }}>
                  <span>{stats?.memberCount ?? 0} members</span>
                  <span>{stats?.announcementCount ?? 0} announcements</span>
                </div>
                {stats?.nextSession && (
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#A3A3A3" }}>
                    Next: {stats.nextSession.title} — {new Date(stats.nextSession.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
