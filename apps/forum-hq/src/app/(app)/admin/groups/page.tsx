import { createAdminClient } from "@/lib/supabase/admin";
import { createGroup, updateGroup, addMemberToGroup, removeMemberFromGroup, toggleFacilitatorRole } from "./actions";

export default async function AdminGroupsPage() {
  const admin = createAdminClient();

  const [{ data: groups }, { data: memberships }, { data: profiles }] = await Promise.all([
    admin.from("forum_groups").select("id, name, description").order("name"),
    admin.from("forum_group_members").select("forum_group_id, user_id, role"),
    admin.from("profiles").select("id, first_name, last_name, email").order("last_name"),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const allProfiles = profiles ?? [];

  const groupMembers: Record<string, string[]> = {};
  const memberRoles: Record<string, string> = {}; // "groupId:userId" → role
  for (const m of memberships ?? []) {
    if (!groupMembers[m.forum_group_id]) groupMembers[m.forum_group_id] = [];
    groupMembers[m.forum_group_id].push(m.user_id);
    memberRoles[`${m.forum_group_id}:${m.user_id}`] = m.role as string;
  }

  const allGroups = groups ?? [];

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
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FFFFFF",
    boxSizing: "border-box" as const,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Admin
        </div>
        <h1 style={{ fontWeight: 800, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Groups
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Create and manage forum groups.
        </p>
      </div>

      {/* Create Group Form */}
      <div className="card" style={{ padding: "24px", marginBottom: "28px" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#0F0F0F", marginBottom: "16px" }}>
          Create New Group
        </div>
        <form action={createGroup}>
          <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "12px", alignItems: "flex-end" }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input name="name" type="text" required placeholder="Forum Atlas" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input name="description" type="text" placeholder="Q1 2026 cohort" style={inputStyle} />
            </div>
            <button
              type="submit"
              style={{
                padding: "8px 18px",
                background: "#FF4F1A",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>

      {/* Count */}
      <div style={{ fontSize: "12px", color: "#A3A3A3", fontWeight: 600, marginBottom: "12px" }}>
        {allGroups.length} group{allGroups.length !== 1 ? "s" : ""}
      </div>

      {/* Groups */}
      {allGroups.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>No groups yet</div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>Create a group using the form above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {allGroups.map((group, idx) => {
            const memberIds = groupMembers[group.id] ?? [];
            const members = memberIds.map((uid) => profileMap[uid]).filter(Boolean);
            const unassigned = allProfiles.filter((p) => !memberIds.includes(p.id));
            const facilitators = memberIds.filter((uid) => memberRoles[`${group.id}:${uid}`] === "facilitator");
            const facNames = facilitators.map((uid) => {
              const p = profileMap[uid];
              return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : null;
            }).filter(Boolean);

            return (
              <details
                key={group.id}
                className="card animate-fade-up"
                style={{ padding: 0, animationDelay: `${idx * 0.04}s` }}
              >
                <summary
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    cursor: "pointer",
                    listStyle: "none",
                  }}
                >
                  {/* Group name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                      <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "16px", color: "#0F0F0F" }}>
                        {group.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#FF4F1A",
                          background: "rgba(255,79,26,0.10)",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {memberIds.length} member{memberIds.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6E6E6E" }}>
                      {group.description && (
                        <span>{group.description}</span>
                      )}
                      {facNames.length > 0 && (
                        <span style={{ color: "#A3A3A3" }}>
                          {group.description ? " · " : ""}Facilitator{facNames.length > 1 ? "s" : ""}: {facNames.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand caret */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>

                {/* Expanded content */}
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F0F0EE" }}>
                  {/* Edit group */}
                  <form action={updateGroup} style={{ margin: "16px 0" }}>
                    <input type="hidden" name="group_id" value={group.id} />
                    <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "10px", alignItems: "flex-end" }}>
                      <div>
                        <label style={labelStyle}>Name</label>
                        <input name="name" defaultValue={group.name} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Description</label>
                        <input name="description" defaultValue={group.description ?? ""} placeholder="Add description…" style={inputStyle} />
                      </div>
                      <button
                        type="submit"
                        style={{
                          padding: "8px 14px",
                          background: "#0F0F0F",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  {/* Add member */}
                  {unassigned.length > 0 && (
                    <form action={addMemberToGroup} style={{ marginBottom: "16px", display: "flex", gap: "8px", alignItems: "flex-end" }}>
                      <input type="hidden" name="group_id" value={group.id} />
                      <div style={{ flex: 1, maxWidth: "280px" }}>
                        <label style={labelStyle}>Add Member</label>
                        <select name="user_id" style={inputStyle}>
                          {unassigned.map((p) => (
                            <option key={p.id} value={p.id}>
                              {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        style={{
                          padding: "8px 14px",
                          background: "#F0F0F0",
                          color: "#0F0F0F",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        + Add
                      </button>
                    </form>
                  )}

                  {/* Member list */}
                  {members.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#F7F7F6", borderRadius: "8px", overflow: "hidden" }}>
                      {members.map((member) => {
                        const fullName = [member!.first_name, member!.last_name].filter(Boolean).join(" ") || member!.email;
                        const initial = (member!.first_name || member!.email || "?")[0].toUpperCase();
                        const role = memberRoles[`${group.id}:${member!.id}`] ?? "member";
                        const isFac = role === "facilitator";
                        return (
                          <div
                            key={member!.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 14px",
                              background: "#FFFFFF",
                              borderBottom: "1px solid #F0F0F0",
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: isFac ? "rgba(255,79,26,0.15)" : "rgba(15,15,15,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: isFac ? "#FF4F1A" : "#6E6E6E",
                                flexShrink: 0,
                              }}
                            >
                              {initial}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F0F0F" }}>{fullName}</div>
                              <div style={{ fontSize: "11px", color: "#A3A3A3" }}>{member!.email}</div>
                            </div>
                            <form action={toggleFacilitatorRole} style={{ flexShrink: 0 }}>
                              <input type="hidden" name="group_id" value={group.id} />
                              <input type="hidden" name="user_id" value={member!.id} />
                              <input type="hidden" name="current_role" value={role} />
                              <button
                                type="submit"
                                title={isFac ? "Remove facilitator role" : "Make facilitator"}
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  padding: "3px 10px",
                                  borderRadius: "20px",
                                  border: isFac ? "1px solid #FF4F1A" : "1px dashed #D5D5D5",
                                  background: isFac ? "rgba(255,79,26,0.10)" : "transparent",
                                  color: isFac ? "#FF4F1A" : "#A3A3A3",
                                  cursor: "pointer",
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  fontFamily: "var(--font-syne)",
                                }}
                              >
                                {isFac ? "Facilitator" : "Make Facilitator"}
                              </button>
                            </form>
                            <form action={removeMemberFromGroup}>
                              <input type="hidden" name="group_id" value={group.id} />
                              <input type="hidden" name="user_id" value={member!.id} />
                              <button
                                type="submit"
                                title="Remove from group"
                                style={{
                                  background: "none",
                                  border: "1px solid #E5E5E5",
                                  borderRadius: "4px",
                                  padding: "3px 8px",
                                  fontSize: "12px",
                                  color: "#A3A3A3",
                                  cursor: "pointer",
                                }}
                              >
                                ×
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", color: "#A3A3A3", fontStyle: "italic" }}>No members assigned yet.</div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
