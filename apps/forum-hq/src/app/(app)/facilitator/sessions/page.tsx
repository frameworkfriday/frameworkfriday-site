import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFacilitatorGroups, isFacilitatorOf } from "@/lib/auth/facilitator";
import { createFacilitatorSession, updateFacilitatorSession, deleteFacilitatorSession } from "./actions";
import Link from "next/link";

const SESSION_TYPES = [
  { value: "forum_session", label: "Forum Session", color: "#FF4F1A", bg: "rgba(255,79,26,0.10)" },
  { value: "office_hours",  label: "Office Hours",  color: "#6E6E6E", bg: "#F0F0F0" },
  { value: "ad_hoc",        label: "Ad Hoc",        color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
];

function typeInfo(type: string) {
  return SESSION_TYPES.find((t) => t.value === type) ?? SESSION_TYPES[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}
function isPast(iso: string) { return new Date(iso) < new Date(); }

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1.5px solid #E5E5E5",
  background: "#FFFFFF",
  fontSize: "14px",
  color: "#0F0F0F",
  fontFamily: "var(--font-dm-sans)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontFamily: "var(--font-syne)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#6E6E6E",
  marginBottom: "6px",
};

export default async function FacilitatorSessionsPage({
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
    redirect(`/facilitator/sessions?group=${facilitatedGroups[0].slug}`);
  }
  if (!groupSlug) redirect("/facilitator");

  const selectedGroup = facilitatedGroups.find((g) => g.slug === groupSlug);
  if (!selectedGroup) redirect("/facilitator");

  const hasAccess = await isFacilitatorOf(user.id, selectedGroup.id);
  if (!hasAccess) redirect("/facilitator");

  const admin = createAdminClient();
  const [{ data: sessions }, { data: members }] = await Promise.all([
    admin
      .from("sessions")
      .select("id, title, description, starts_at, duration_minutes, video_call_url, forum_group_id, session_type, facilitator_id")
      .eq("forum_group_id", selectedGroup.id)
      .order("starts_at"),
    admin
      .from("forum_group_members")
      .select("user_id, profiles(id, first_name, last_name)")
      .eq("forum_group_id", selectedGroup.id),
  ]);

  const allSessions = sessions ?? [];
  const groupMembers = (members ?? []).map((m) => {
    const p = m.profiles as unknown as { id: string; first_name: string; last_name: string } | null;
    return p ? { id: p.id, name: `${p.first_name} ${p.last_name}`.trim() } : null;
  }).filter(Boolean) as { id: string; name: string }[];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
            <Link href={`/facilitator?group=${groupSlug}`} style={{ color: "#FF4F1A", textDecoration: "none" }}>
              Facilitator
            </Link>
            {" / "}
            {selectedGroup.name}
          </div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
            Sessions
          </h1>
          <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
            Schedule and manage sessions for {selectedGroup.name}.
          </p>
        </div>
        <div style={{ fontSize: "13px", color: "#A3A3A3", fontFamily: "var(--font-syne)", fontWeight: 600 }}>
          {allSessions.length} total
        </div>
      </div>

      {/* New session form */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: "32px" }}>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: "#0F0F0F", marginBottom: "20px" }}>
          Schedule Session
        </div>
        <form action={createFacilitatorSession}>
          <input type="hidden" name="forum_group_id" value={selectedGroup.id} />
          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input name="title" type="text" required placeholder="Session 1" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Type *</label>
              <select name="session_type" required style={{ ...inputStyle, appearance: "none" }}>
                {SESSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 140px", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Date & Time *</label>
              <input name="starts_at" type="datetime-local" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Call URL</label>
              <input name="video_call_url" type="url" placeholder="https://meet.google.com/..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fill-in Facilitator</label>
              <select name="facilitator_id" style={{ ...inputStyle, appearance: "none" }}>
                <option value="">Me (default)</option>
                {groupMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input name="duration_minutes" type="number" defaultValue="90" min="15" max="480" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="What will be covered in this session?"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#0F0F0F",
              color: "#FFFFFF",
              fontFamily: "var(--font-syne)",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            Schedule Session
          </button>
        </form>
      </div>

      {/* Empty state */}
      {allSessions.length === 0 && (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>No sessions yet</div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>Use the form above to schedule your first session.</div>
        </div>
      )}

      {/* Sessions list */}
      {allSessions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {allSessions.map((session, idx) => {
            const past = isPast(session.starts_at);
            const type = typeInfo(session.session_type);

            return (
              <div
                key={session.id}
                className="card animate-fade-up"
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  animationDelay: `${idx * 0.03}s`,
                  opacity: past ? 0.7 : 1,
                }}
              >
                {/* Date block */}
                <div
                  style={{
                    width: "44px",
                    flexShrink: 0,
                    textAlign: "center",
                    padding: "6px",
                    borderRadius: "8px",
                    background: past ? "#F7F7F6" : type.bg,
                    border: `1px solid ${past ? "#E5E5E5" : "transparent"}`,
                  }}
                >
                  <div style={{ fontSize: "17px", fontFamily: "var(--font-syne)", fontWeight: 800, color: past ? "#A3A3A3" : type.color, lineHeight: 1 }}>
                    {new Date(session.starts_at).getDate()}
                  </div>
                  <div style={{ fontSize: "9px", color: past ? "#A3A3A3" : type.color, fontWeight: 600, letterSpacing: "0.05em" }}>
                    {new Date(session.starts_at).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "14px", color: "#0F0F0F" }}>
                      {session.title}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-syne)",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        padding: "2px 7px",
                        borderRadius: "20px",
                        background: type.bg,
                        color: type.color,
                        textTransform: "uppercase",
                      }}
                    >
                      {type.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#A3A3A3" }}>
                    {formatDate(session.starts_at)} · {formatTime(session.starts_at)} · {session.duration_minutes} min
                  </div>
                </div>

                {/* Facilitator override */}
                <div style={{ flexShrink: 0 }}>
                  {session.facilitator_id ? (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#3B82F6", background: "rgba(59,130,246,0.08)", padding: "3px 8px", borderRadius: "20px" }}>
                      Fill-in: {groupMembers.find((m) => m.id === session.facilitator_id)?.name ?? "Assigned"}
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#A3A3A3" }}>Default facilitator</span>
                  )}
                </div>

                {/* Delete */}
                <form action={deleteFacilitatorSession}>
                  <input type="hidden" name="id" value={session.id} />
                  <input type="hidden" name="forum_group_id" value={selectedGroup.id} />
                  <button
                    type="submit"
                    style={{
                      background: "none",
                      border: "1px solid #E5E5E5",
                      borderRadius: "6px",
                      cursor: "pointer",
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontFamily: "var(--font-syne)",
                      fontWeight: 600,
                      color: "#A3A3A3",
                    }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
