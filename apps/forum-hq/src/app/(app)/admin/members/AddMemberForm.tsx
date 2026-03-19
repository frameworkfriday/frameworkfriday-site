"use client";

import { useState } from "react";
import { inviteUser, addMemberWithoutInvite } from "./actions";

interface Group {
  id: string;
  name: string;
}

export default function AddMemberForm({ groups }: { groups: Group[] }) {
  const [role, setRole] = useState("member");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [onboardingPath, setOnboardingPath] = useState("");

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

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    // Reset to single group for member, clear for admin
    if (newRole === "member") {
      setSelectedGroups(selectedGroups.slice(0, 1));
    }
  };

  return (
    <div className="card" style={{ padding: "24px", marginBottom: "28px" }}>
      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0F0F0F", marginBottom: "16px" }}>
        Add New Member
      </div>
      <form>
        {/* Hidden inputs for selected groups (FormData needs these) */}
        {selectedGroups.map((gid) => (
          <input key={gid} type="hidden" name="group_ids" value={gid} />
        ))}
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="onboarding_path" value={onboardingPath} />

        <div
          className="form-grid-6"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1fr 0.8fr 0.8fr",
            gap: "12px",
            alignItems: "flex-end",
            marginBottom: "16px",
          }}
        >
          <div>
            <label style={labelStyle}>Email *</label>
            <input name="email" type="email" required placeholder="email@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>First Name</label>
            <input name="first_name" type="text" placeholder="First" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input name="last_name" type="text" placeholder="Last" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Business</label>
            <input name="business_name" type="text" placeholder="Business name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Background</label>
            <select
              value={onboardingPath}
              onChange={(e) => setOnboardingPath(e.target.value)}
              style={inputStyle}
            >
              <option value="">New to Forum</option>
              <option value="ds-graduate">DS Graduate</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={inputStyle}
            >
              <option value="member">Member</option>
              <option value="facilitator">Facilitator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Group assignment — single select for members, multi-select for facilitators */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ ...labelStyle, marginBottom: "8px" }}>
            {role === "facilitator" ? "Assign to Forums (facilitator in each)" : "Assign to Group"}
            {role === "facilitator" && (
              <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: "normal", color: "#A3A3A3", marginLeft: "6px" }}>
                — select one or more
              </span>
            )}
          </label>

          {role === "facilitator" ? (
            // Multi-select checkboxes for facilitators
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {groups.length === 0 ? (
                <span style={{ fontSize: "13px", color: "#A3A3A3" }}>No groups created yet</span>
              ) : (
                groups.map((g) => {
                  const checked = selectedGroups.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.id)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        border: checked ? "1.5px solid #FF4F1A" : "1.5px solid #E5E5E5",
                        background: checked ? "rgba(255,79,26,0.08)" : "#FFFFFF",
                        color: checked ? "#FF4F1A" : "#6E6E6E",
                      }}
                    >
                      {checked && (
                        <span style={{ marginRight: "6px" }}>✓</span>
                      )}
                      {g.name}
                    </button>
                  );
                })
              )}
            </div>
          ) : role === "member" ? (
            // Single select dropdown for members
            <select
              value={selectedGroups[0] || ""}
              onChange={(e) => setSelectedGroups(e.target.value ? [e.target.value] : [])}
              style={{ ...inputStyle, maxWidth: "280px" }}
            >
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          ) : (
            // Admin — optional group assignment
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select
                value={selectedGroups[0] || ""}
                onChange={(e) => setSelectedGroups(e.target.value ? [e.target.value] : [])}
                style={{ ...inputStyle, maxWidth: "280px" }}
              >
                <option value="">No group (app-wide admin)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <span style={{ fontSize: "12px", color: "#A3A3A3" }}>Admins have access to all groups</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            formAction={inviteUser}
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
            Add & Send Invite
          </button>
          <button
            type="submit"
            formAction={addMemberWithoutInvite}
            style={{
              padding: "8px 18px",
              background: "none",
              color: "#6E6E6E",
              border: "1.5px solid #E5E5E5",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Add Only (No Email)
          </button>
        </div>
      </form>
    </div>
  );
}
