import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, assignGroup, assignFacilitator, deleteSession } from "./actions";
import BulkScheduleForm from "./BulkScheduleForm";

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
  borderRadius: "10px",
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

export default async function AdminSessionsPage() {
  const admin = createAdminClient();

  const [{ data: sessions }, { data: groups }, { data: profiles }] = await Promise.all([
    admin
      .from("sessions")
      .select("id, title, description, starts_at, duration_minutes, video_call_url, forum_group_id, session_type, facilitator_id")
      .order("starts_at"),
    admin.from("forum_groups").select("id, name").order("name"),
    admin.from("profiles").select("id, first_name, last_name").order("first_name"),
  ]);

  const groupMap = Object.fromEntries((groups ?? []).map((g) => [g.id, g.name]));
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]));
  const allSessions = sessions ?? [];
  const allGroups = groups ?? [];
  const allProfiles = profiles ?? [];

  const crossGroup = allSessions.filter((s) => !s.forum_group_id && s.session_type === "office_hours");
  const unassigned = allSessions.filter((s) => !s.forum_group_id && s.session_type !== "office_hours");
  const assigned = allSessions.filter((s) => s.forum_group_id);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
            Admin
          </div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
            Sessions
          </h1>
          <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
            Master calendar — schedule sessions, assign groups.
          </p>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#A3A3A3", fontFamily: "var(--font-syne)", fontWeight: 600 }}>
          <span>{allSessions.length} total</span>
          {unassigned.length > 0 && (
            <span style={{ color: "#F59E0B" }}>{unassigned.length} unassigned</span>
          )}
        </div>
      </div>

      {/* New session form */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: "32px" }}>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: "#0F0F0F", marginBottom: "20px" }}>
          Schedule Session
        </div>
        <form action={createSession}>
          <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
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
            <div>
              <label style={labelStyle}>Group</label>
              <select name="forum_group_id" style={{ ...inputStyle, appearance: "none" }}>
                <option value="">All Groups (cross-group)</option>
                {allGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "4px" }}>
                Office Hours are visible to all Forum members
              </div>
            </div>
          </div>

          <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Date & Time *</label>
              <input name="starts_at" type="datetime-local" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Facilitator Override</label>
              <select name="facilitator_id" style={{ ...inputStyle, appearance: "none" }}>
                <option value="">Group default</option>
                {allProfiles.map((p) => (
                  <option key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`.trim()}</option>
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

          <input type="hidden" name="video_call_url" value="" />

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="submit"
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
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
            <span style={{ fontSize: "12px", color: "#A3A3A3", display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Auto-syncs to Google Calendar — invites sent to all group members
            </span>
          </div>
        </form>
      </div>

      {/* Bulk schedule */}
      <BulkScheduleForm groups={allGroups} profiles={allProfiles} />

      {/* Empty state */}
      {allSessions.length === 0 && (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>No sessions yet</div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>Use the form above to schedule your first session.</div>
        </div>
      )}

      {/* Cross-group sessions (office hours visible to all) */}
      {crossGroup.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6E6E6E", marginBottom: "10px" }}>
            Cross-Group — visible to all members
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {crossGroup.map((session, idx) => (
              <SessionRow key={session.id} session={session} groupMap={groupMap} allGroups={allGroups} allProfiles={allProfiles} profileMap={profileMap} idx={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Unassigned sessions */}
      {unassigned.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#F59E0B", marginBottom: "10px" }}>
            Unassigned — assign a group
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {unassigned.map((session, idx) => (
              <SessionRow key={session.id} session={session} groupMap={groupMap} allGroups={allGroups} allProfiles={allProfiles} profileMap={profileMap} idx={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Assigned sessions */}
      {assigned.length > 0 && (
        <div>
          {unassigned.length > 0 && (
            <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "10px" }}>
              Scheduled
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assigned.map((session, idx) => (
              <SessionRow key={session.id} session={session} groupMap={groupMap} allGroups={allGroups} allProfiles={allProfiles} profileMap={profileMap} idx={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionRow({
  session,
  groupMap,
  allGroups,
  allProfiles,
  profileMap,
  idx,
}: {
  session: {
    id: string;
    title: string;
    description: string | null;
    starts_at: string;
    duration_minutes: number;
    video_call_url: string | null;
    forum_group_id: string | null;
    session_type: string;
    facilitator_id: string | null;
  };
  groupMap: Record<string, string>;
  allGroups: { id: string; name: string }[];
  allProfiles: { id: string; first_name: string; last_name: string }[];
  profileMap: Record<string, string>;
  idx: number;
}) {
  const past = isPast(session.starts_at);
  const type = typeInfo(session.session_type);
  const isUnassigned = !session.forum_group_id;

  return (
    <div
      className="card animate-fade-up"
      style={{
        padding: "14px 18px",
        animationDelay: `${idx * 0.03}s`,
        opacity: past ? 0.7 : 1,
        borderLeft: isUnassigned ? "3px solid #F59E0B" : undefined,
      }}
    >
      {/* Top row: date + info + delete */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Date block — Apple Calendar style */}
        <div
          style={{
            width: "44px",
            height: "44px",
            flexShrink: 0,
            textAlign: "center",
            borderRadius: "10px",
            background: past ? "#F7F7F6" : "#FFFFFF",
            border: `1px solid ${past ? "#E5E5E5" : "#EAEAE8"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "9px", fontWeight: 700, color: past ? "#A3A3A3" : "#FF4F1A", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1, marginBottom: "1px" }}>
            {new Date(session.starts_at).toLocaleDateString("en-US", { month: "short" })}
          </div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: past ? "#A3A3A3" : "#0F0F0F", lineHeight: 1 }}>
            {new Date(session.starts_at).getDate()}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px", flexWrap: "wrap" }}>
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
                borderRadius: "10px",
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

        {/* Delete */}
        <form action={deleteSession} style={{ flexShrink: 0 }}>
          <input type="hidden" name="id" value={session.id} />
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

      {/* Bottom row: group + facilitator controls */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "10px", paddingLeft: "58px" }}>
        {/* Group assignment */}
        {isUnassigned ? (
          <form action={assignGroup} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input type="hidden" name="id" value={session.id} />
            <select
              name="forum_group_id"
              style={{
                padding: "5px 8px",
                borderRadius: "6px",
                border: "1.5px solid #F59E0B",
                background: "#FFFBEB",
                fontSize: "12px",
                fontFamily: "var(--font-dm-sans)",
                color: "#0F0F0F",
                outline: "none",
              }}
            >
              <option value="">Select group…</option>
              {allGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                background: "#F59E0B",
                color: "#FFFFFF",
                fontSize: "11px",
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Assign
            </button>
          </form>
        ) : (
          <form action={assignGroup} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input type="hidden" name="id" value={session.id} />
            <span style={{ fontSize: "11px", color: "#A3A3A3", fontWeight: 600 }}>Group:</span>
            <select
              name="forum_group_id"
              defaultValue={session.forum_group_id ?? ""}
              style={{
                padding: "5px 8px",
                borderRadius: "6px",
                border: "1px solid #E5E5E5",
                background: "#F7F7F6",
                fontSize: "12px",
                fontFamily: "var(--font-dm-sans)",
                color: "#0F0F0F",
                outline: "none",
              }}
            >
              <option value="">Unassigned</option>
              {allGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                padding: "5px 8px",
                borderRadius: "6px",
                border: "1px solid #E5E5E5",
                background: "none",
                fontSize: "11px",
                fontFamily: "var(--font-syne)",
                fontWeight: 600,
                color: "#6E6E6E",
                cursor: "pointer",
              }}
            >
              Update
            </button>
          </form>
        )}

        <div style={{ width: "1px", height: "16px", background: "#E5E5E5" }} />

        {/* Facilitator */}
        <form action={assignFacilitator} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <input type="hidden" name="id" value={session.id} />
          <span style={{ fontSize: "11px", color: "#A3A3A3", fontWeight: 600 }}>Facilitator:</span>
          <select
            name="facilitator_id"
            defaultValue={session.facilitator_id ?? ""}
            style={{
              padding: "5px 8px",
              borderRadius: "6px",
              border: `1px solid ${session.facilitator_id ? "#3B82F6" : "#E5E5E5"}`,
              background: session.facilitator_id ? "rgba(59,130,246,0.05)" : "#F7F7F6",
              fontSize: "12px",
              fontFamily: "var(--font-dm-sans)",
              color: "#0F0F0F",
              outline: "none",
              maxWidth: "160px",
            }}
          >
            <option value="">Default</option>
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`.trim()}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: "5px 8px",
              borderRadius: "6px",
              border: "1px solid #E5E5E5",
              background: "none",
              fontSize: "11px",
              fontFamily: "var(--font-syne)",
              fontWeight: 600,
              color: "#6E6E6E",
              cursor: "pointer",
            }}
          >
            Set
          </button>
        </form>
      </div>
    </div>
  );
}
