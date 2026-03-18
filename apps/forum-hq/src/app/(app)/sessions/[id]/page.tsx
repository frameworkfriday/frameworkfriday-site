import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEventAttendees, type AttendeeRsvp } from "@/lib/google/calendar";
import RsvpButtons from "./RsvpButtons";

const SESSION_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  forum_session: { label: "Forum Session", color: "#FF4F1A", bg: "rgba(255,79,26,0.10)" },
  office_hours: { label: "Office Hours", color: "#6E6E6E", bg: "#F0F0F0" },
  ad_hoc: { label: "Ad Hoc", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch session with group info
  const { data: session } = await admin
    .from("sessions")
    .select("*, forum_groups(id, name, slug, description, google_calendar_id)")
    .eq("id", id)
    .single();

  if (!session) redirect("/sessions");

  // Verify membership (or admin)
  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole && session.forum_group_id) {
    const { data: membership } = await admin
      .from("forum_group_members")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("forum_group_id", session.forum_group_id)
      .maybeSingle();
    if (!membership) redirect("/sessions");
  }

  const group = session.forum_groups as unknown as { id: string; name: string; slug: string; description: string | null; google_calendar_id: string | null } | null;

  // Resolve facilitator
  type FacilitatorProfile = { first_name: string; last_name: string; email: string; business_name: string | null; avatar_url: string | null };
  let facilitator: FacilitatorProfile | null = null;
  let isOverride = false;

  if (session.facilitator_id) {
    // Explicit override
    const { data } = await admin
      .from("profiles")
      .select("first_name, last_name, email, business_name, avatar_url")
      .eq("id", session.facilitator_id)
      .single();
    facilitator = data;
    isOverride = true;
  } else if (session.forum_group_id) {
    // Group default facilitator
    const { data: facMember } = await admin
      .from("forum_group_members")
      .select("user_id, profiles(first_name, last_name, email, business_name, avatar_url)")
      .eq("forum_group_id", session.forum_group_id)
      .eq("role", "facilitator")
      .limit(1)
      .maybeSingle();
    if (facMember) {
      facilitator = facMember.profiles as unknown as FacilitatorProfile;
    }
  }

  // Group members
  const { data: members } = session.forum_group_id
    ? await admin
        .from("forum_group_members")
        .select("user_id, role, profiles(first_name, last_name, email, business_name, avatar_url)")
        .eq("forum_group_id", session.forum_group_id)
    : { data: [] };

  // Fetch RSVP statuses from Google Calendar
  let rsvpMap: Record<string, AttendeeRsvp["responseStatus"]> = {};
  if (session.google_event_id && group?.google_calendar_id) {
    try {
      const attendees = await getEventAttendees(group.google_calendar_id, session.google_event_id);
      for (const a of attendees) {
        rsvpMap[a.email.toLowerCase()] = a.responseStatus;
      }
    } catch {
      // Calendar API unavailable — show no RSVP data
    }
  }

  const hasRsvp = Object.keys(rsvpMap).length > 0;

  // Current user's RSVP status
  const userEmail = user.email?.toLowerCase() ?? "";
  const currentUserRsvp = hasRsvp && userEmail ? rsvpMap[userEmail] as "accepted" | "declined" | "tentative" | "needsAction" | undefined : undefined;

  const type = SESSION_TYPES[session.session_type] ?? SESSION_TYPES.forum_session;
  const isPast = new Date(session.starts_at) < new Date();
  const d = new Date(session.starts_at);

  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/sessions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#6E6E6E",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Sessions
        </Link>
      </div>

      {/* Session header card */}
      <div
        className="card"
        style={{
          padding: "28px",
          marginBottom: "20px",
          opacity: isPast ? 0.75 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
          {/* Date block */}
          <div
            style={{
              width: "64px",
              flexShrink: 0,
              textAlign: "center",
              padding: "12px 8px",
              borderRadius: "12px",
              background: isPast ? "#F7F7F6" : type.bg,
              border: `1px solid ${isPast ? "#E5E5E5" : "transparent"}`,
            }}
          >
            <div style={{ fontSize: "26px", fontFamily: "var(--font-syne)", fontWeight: 800, color: isPast ? "#A3A3A3" : type.color, lineHeight: 1 }}>
              {d.getDate()}
            </div>
            <div style={{ fontSize: "11px", color: isPast ? "#A3A3A3" : type.color, fontWeight: 600, letterSpacing: "0.05em", marginTop: "3px" }}>
              {d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "24px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
                {session.title}
              </h1>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-syne)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: type.bg,
                  color: type.color,
                  textTransform: "uppercase",
                }}
              >
                {type.label}
              </span>
              {isPast && (
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: "#F0F0F0", color: "#A3A3A3" }}>
                  Past
                </span>
              )}
            </div>

            <div style={{ fontSize: "14px", color: "#6E6E6E", marginBottom: "4px" }}>
              {formatDate(session.starts_at)} &middot; {formatTime(session.starts_at)} &middot; {session.duration_minutes} min
            </div>

            {group && (
              <div style={{ fontSize: "13px", color: "#A3A3A3", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
                {group.name}
                {hasRsvp && members && members.length > 0 && (() => {
                  const confirmed = members.filter((m) => {
                    const p = m.profiles as unknown as { email: string } | null;
                    return p && rsvpMap[p.email.toLowerCase()] === "accepted";
                  }).length;
                  return (
                    <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 600, color: confirmed > 0 ? "#22C55E" : "#A3A3A3" }}>
                      &middot; {confirmed}/{members.length} confirmed
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Join button */}
          {session.video_call_url && !isPast && (
            <a
              href={session.video_call_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#FF4F1A",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                flexShrink: 0,
                fontFamily: "var(--font-syne)",
                letterSpacing: "0.02em",
              }}
            >
              Join Call
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div className="session-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>
        {/* Left column */}
        <div>
          {/* Description */}
          {session.description && (
            <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "10px" }}>
                Description
              </div>
              <div style={{ fontSize: "14px", color: "#0F0F0F", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {session.description}
              </div>
            </div>
          )}

          {/* Members */}
          {members && members.length > 0 && (
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                Members ({members.length})
                {hasRsvp && (() => {
                  const confirmed = members.filter((m) => {
                    const p = m.profiles as unknown as { email: string } | null;
                    return p && rsvpMap[p.email.toLowerCase()] === "accepted";
                  }).length;
                  return (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#22C55E", background: "#F0FDF4", padding: "2px 8px", borderRadius: "20px", letterSpacing: "normal", textTransform: "none" }}>
                      {confirmed} confirmed
                    </span>
                  );
                })()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                {members.map((m) => {
                  const p = m.profiles as unknown as { first_name: string; last_name: string; email: string; business_name: string | null; avatar_url: string | null } | null;
                  if (!p) return null;
                  const name = `${p.first_name} ${p.last_name}`.trim() || "Member";
                  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                  const rsvp = hasRsvp ? rsvpMap[p.email.toLowerCase()] : undefined;
                  const rsvpConfig: Record<string, { label: string; color: string; dot: string }> = {
                    accepted: { label: "Confirmed", color: "#22C55E", dot: "#22C55E" },
                    declined: { label: "Declined", color: "#EF4444", dot: "#EF4444" },
                    tentative: { label: "Tentative", color: "#EAB308", dot: "#EAB308" },
                    needsAction: { label: "Pending", color: "#A3A3A3", dot: "#D4D4D4" },
                  };
                  const rsvpInfo = rsvp ? rsvpConfig[rsvp] : null;
                  return (
                    <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", background: "#F7F7F6" }}>
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt={name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,79,26,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", color: "#FF4F1A", flexShrink: 0 }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name}
                        </div>
                        {m.role === "facilitator" && (
                          <span style={{ fontSize: "9px", fontWeight: 600, color: "#FF4F1A", background: "rgba(255,79,26,0.10)", padding: "1px 5px", borderRadius: "20px", display: "inline-block", marginTop: "2px" }}>
                            Facilitator
                          </span>
                        )}
                        {p.business_name && (
                          <div style={{ fontSize: "11px", color: "#A3A3A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "1px" }}>
                            {p.business_name}
                          </div>
                        )}
                      </div>
                      {rsvpInfo && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: rsvpInfo.dot }} />
                          <span style={{ fontSize: "10px", fontWeight: 600, color: rsvpInfo.color }}>
                            {rsvpInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* RSVP buttons */}
          {session.google_event_id && !isPast && (
            <RsvpButtons sessionId={session.id} currentStatus={currentUserRsvp} />
          )}

          {/* Facilitator card */}
          {facilitator && (
            <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "12px" }}>
                Facilitator
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {facilitator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={facilitator.avatar_url} alt="Facilitator" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,79,26,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: "#FF4F1A", flexShrink: 0 }}>
                    {`${facilitator.first_name?.[0] ?? ""}${facilitator.last_name?.[0] ?? ""}`.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F" }}>
                    {`${facilitator.first_name} ${facilitator.last_name}`.trim()}
                  </div>
                  {facilitator.business_name && (
                    <div style={{ fontSize: "12px", color: "#6E6E6E" }}>{facilitator.business_name}</div>
                  )}
                  {isOverride && (
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#3B82F6", background: "rgba(59,130,246,0.08)", padding: "1px 6px", borderRadius: "20px", marginTop: "4px", display: "inline-block" }}>
                      Fill-in
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Group card */}
          {group && (
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "10px" }}>
                Forum Group
              </div>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: "#0F0F0F", marginBottom: "4px" }}>
                {group.name}
              </div>
              {group.description && (
                <div style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.5 }}>
                  {group.description}
                </div>
              )}
              <Link
                href="/forum"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#FF4F1A",
                  textDecoration: "none",
                }}
              >
                View group &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
