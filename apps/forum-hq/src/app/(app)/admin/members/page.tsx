import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import AddMemberForm from "./AddMemberForm";

export default async function AdminMembersPage() {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: adminRoles }, { data: memberships }, { data: groups }] =
    await Promise.all([
      admin.from("profiles").select("id, first_name, last_name, email, business_name, role_title, archived_at, onboarding_path").order("last_name"),
      admin.from("user_roles").select("user_id, role").eq("role", "admin"),
      admin.from("forum_group_members").select("user_id, forum_group_id"),
      admin.from("forum_groups").select("id, name").order("name"),
    ]);

  const adminIds = new Set((adminRoles ?? []).map((r) => r.user_id));
  const groupMap = Object.fromEntries((groups ?? []).map((g) => [g.id, g.name]));
  const allGroups = groups ?? [];

  // Map user_id → [{ id, name }]
  const userGroups: Record<string, { id: string; name: string }[]> = {};
  for (const m of memberships ?? []) {
    if (!userGroups[m.user_id]) userGroups[m.user_id] = [];
    userGroups[m.user_id].push({ id: m.forum_group_id, name: groupMap[m.forum_group_id] ?? m.forum_group_id });
  }

  const allMembers = profiles ?? [];
  const members = allMembers.filter((m) => !m.archived_at);
  const archivedMembers = allMembers.filter((m) => m.archived_at);

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6E6E6E",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "4px",
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    fontSize: "13px",
    border: "1px solid #E5E5E5",
    borderRadius: "6px",
    outline: "none",
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FFFFFF",
    boxSizing: "border-box" as const,
  };

  const badgeBase = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.04em",
  } as React.CSSProperties;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Admin
        </div>
        <h1 style={{ fontWeight: 800, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Members
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Invite and manage all registered members.
        </p>
      </div>

      {/* Add Member Form */}
      <AddMemberForm groups={allGroups} />

      {/* Count */}
      <div style={{ fontSize: "12px", color: "#A3A3A3", fontWeight: 600, marginBottom: "12px" }}>
        {members.length} member{members.length !== 1 ? "s" : ""}
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>No members yet</div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>Invite a member using the form above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {members.map((member, idx) => {
            const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || "—";
            const isAdmin = adminIds.has(member.id);
            const memberGroups = userGroups[member.id] ?? [];
            const initial = (member.first_name || member.email || "?")[0].toUpperCase();

            return (
              <Link
                key={member.id}
                href={`/admin/members/${member.id}`}
                className="card card-hover animate-fade-up"
                style={{
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  textDecoration: "none",
                  color: "inherit",
                  animationDelay: `${idx * 0.03}s`,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: isAdmin ? "rgba(255,79,26,0.15)" : "rgba(15,15,15,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: isAdmin ? "#FF4F1A" : "#6E6E6E",
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F" }}>{fullName}</span>
                    {isAdmin && (
                      <span style={{ ...badgeBase, background: "rgba(255,79,26,0.1)", color: "#FF4F1A" }}>Admin</span>
                    )}
                    {member.onboarding_path === "ds-graduate" && (
                      <span style={{ ...badgeBase, background: "rgba(59,130,246,0.08)", color: "#3B82F6" }}>DS Graduate</span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6E6E6E" }}>
                    {member.email}
                    {member.business_name && <span style={{ color: "#A3A3A3" }}> · {member.business_name}</span>}
                  </div>
                </div>

                {/* Groups */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {memberGroups.length === 0 ? (
                    <span style={{ ...badgeBase, background: "#F7F7F6", color: "#A3A3A3", border: "1px solid #E5E5E5" }}>
                      No group
                    </span>
                  ) : (
                    memberGroups.map((g) => (
                      <span key={g.id} style={{ ...badgeBase, background: "#F0F0F0", color: "#6E6E6E", border: "1px solid #E5E5E5" }}>
                        {g.name}
                      </span>
                    ))
                  )}
                </div>

                {/* Arrow */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
      {/* Archived members */}
      {archivedMembers.length > 0 && (
        <details style={{ marginTop: "32px" }}>
          <summary
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#A3A3A3",
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Archived ({archivedMembers.length})
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {archivedMembers.map((member) => {
              const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || "—";
              const initial = (member.first_name || member.email || "?")[0].toUpperCase();
              return (
                <Link
                  key={member.id}
                  href={`/admin/members/${member.id}`}
                  className="card card-hover"
                  style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "14px", opacity: 0.6, textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(15,15,15,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#A3A3A3",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#6E6E6E" }}>{fullName}</div>
                    <div style={{ fontSize: "12px", color: "#A3A3A3" }}>{member.email}</div>
                  </div>
                  <span style={{ fontSize: "11px", color: "#A3A3A3", marginRight: "8px" }}>
                    Archived {new Date(member.archived_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
