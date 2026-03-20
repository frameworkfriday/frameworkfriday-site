"use client";

import { useState } from "react";
import Link from "next/link";
import {
  updateMemberProfile,
  toggleAdminRole,
  addToGroup,
  removeFromGroup,
  toggleFacilitator,
  archiveMemberAction,
  restoreMemberAction,
  sendInviteEmailAction,
} from "./actions";

interface MemberGroup {
  id: string;
  name: string;
  role: string;
}

interface GroupOption {
  id: string;
  name: string;
}

interface Props {
  member: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    business_name: string | null;
    role_title: string | null;
    avatar_url: string | null;
    linkedin_url: string | null;
    website_url: string | null;
    community_visible: boolean;
    archived_at: string | null;
    created_at: string;
    onboarding_completed_at: string | null;
    onboarding_path: string | null;
  };
  isAdmin: boolean;
  memberGroups: MemberGroup[];
  allGroups: GroupOption[];
}

export default function MemberEditClient({ member, isAdmin, memberGroups, allGroups }: Props) {
  const [firstName, setFirstName] = useState(member.first_name ?? "");
  const [lastName, setLastName] = useState(member.last_name ?? "");
  const [businessName, setBusinessName] = useState(member.business_name ?? "");
  const [roleTitle, setRoleTitle] = useState(member.role_title ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(member.linkedin_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(member.website_url ?? "");
  const [communityVisible, setCommunityVisible] = useState(member.community_visible);
  const [onboardingPath, setOnboardingPath] = useState(member.onboarding_path ?? "");
  const [avatarUrl, setAvatarUrl] = useState(member.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addGroupId, setAddGroupId] = useState("");

  const initials = [member.first_name, member.last_name]
    .map((n) => n?.[0] ?? "")
    .join("")
    .toUpperCase() || member.email[0]?.toUpperCase() || "?";

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Unnamed";

  const availableGroups = allGroups.filter(
    (g) => !memberGroups.some((mg) => mg.id === g.id)
  );

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    fd.set("user_id", member.id);
    fd.set("first_name", firstName);
    fd.set("last_name", lastName);
    fd.set("business_name", businessName);
    fd.set("role_title", roleTitle);
    fd.set("linkedin_url", linkedinUrl);
    fd.set("website_url", websiteUrl);
    fd.set("community_visible", String(communityVisible));
    fd.set("onboarding_path", onboardingPath);
    fd.set("avatar_url", avatarUrl);
    await updateMemberProfile(fd);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6E6E6E",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "6px",
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #E5E5E5",
    borderRadius: "10px",
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FFFFFF",
    boxSizing: "border-box" as const,
    outline: "none",
  };

  const sectionTitle = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0F0F0F",
    marginBottom: "14px",
  };

  const pillBtn = (color: string, bg: string, border: string): React.CSSProperties => ({
    fontSize: "12px",
    padding: "5px 14px",
    borderRadius: "10px",
    border: `1px solid ${border}`,
    background: bg,
    color: color,
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <Link
          href="/admin/members"
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#A3A3A3",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "12px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Members
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Large avatar */}
          {member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatar_url}
              alt={fullName}
              style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: isAdmin ? "rgba(255,79,26,0.15)" : "rgba(15,15,15,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 700,
              color: isAdmin ? "#FF4F1A" : "#6E6E6E", flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
                {fullName}
              </h1>
              {isAdmin && (
                <span style={{
                  display: "inline-flex", alignItems: "center", padding: "2px 10px",
                  borderRadius: "10px", fontSize: "11px", fontWeight: 600,
                  background: "rgba(255,79,26,0.1)", color: "#FF4F1A",
                }}>
                  Admin
                </span>
              )}
              {member.archived_at && (
                <span style={{
                  display: "inline-flex", alignItems: "center", padding: "2px 10px",
                  borderRadius: "10px", fontSize: "11px", fontWeight: 600,
                  background: "rgba(239,68,68,0.1)", color: "#EF4444",
                }}>
                  Archived
                </span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "#6E6E6E", marginTop: "2px" }}>
              {member.email}
              {member.business_name && <span style={{ color: "#A3A3A3" }}> · {member.business_name}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="session-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>
        {/* Left: Profile form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Profile details card */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={sectionTitle}>Profile Details</div>

            {/* Avatar URL */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Avatar URL</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "rgba(255,79,26,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "13px", color: "#FF4F1A", flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                )}
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl("")}
                    style={{ padding: "8px 12px", background: "none", color: "#A3A3A3", border: "1px solid #E5E5E5", borderRadius: "6px", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Email</label>
              <input value={member.email} disabled style={{ ...inputStyle, background: "#F7F7F6", color: "#A3A3A3" }} />
              <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "4px" }}>
                Email is tied to authentication and cannot be changed here.
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Business Name</label>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Company or practice" style={inputStyle} />
            </div>

            <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <div>
                <label style={labelStyle}>Role / Title</label>
                <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Founder & CEO" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Onboarding Path</label>
                <select
                  value={onboardingPath}
                  onChange={(e) => setOnboardingPath(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">New to Forum</option>
                  <option value="ds-graduate">Decision Sprint Graduate</option>
                </select>
              </div>
            </div>

            {/* Social links */}
            <div style={{ borderTop: "1px solid #EEEEED", paddingTop: "18px", marginBottom: "20px" }}>
              <div style={{ ...sectionTitle, marginBottom: "12px" }}>Social Links</div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>LinkedIn URL</label>
                <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Website URL</label>
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: saved ? "#22C55E" : "#0F0F0F",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Right: Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Directory visibility */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Directory</div>
            <div
              onClick={() => setCommunityVisible(!communityVisible)}
              style={{
                display: "flex", gap: "12px", padding: "12px",
                border: `2px solid ${communityVisible ? "#FF4F1A" : "#E5E5E5"}`,
                borderRadius: "10px", cursor: "pointer",
                background: communityVisible ? "rgba(255,79,26,0.04)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: "20px", height: "20px", minWidth: "20px", borderRadius: "5px",
                border: `2px solid ${communityVisible ? "#FF4F1A" : "#D4D4D4"}`,
                background: communityVisible ? "#FF4F1A" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: "1px", transition: "all 0.15s",
              }}>
                {communityVisible && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#0F0F0F", marginBottom: "2px" }}>
                  Show in community directory
                </div>
                <div style={{ fontSize: "12px", color: "#6E6E6E", lineHeight: 1.4 }}>
                  When enabled, this member appears in the public community directory.
                </div>
              </div>
            </div>
            <div style={{ fontSize: "11px", color: communityVisible ? "#22C55E" : "#A3A3A3", marginTop: "8px", fontWeight: 600 }}>
              {communityVisible ? "Currently visible in directory" : "Currently hidden from directory"}
            </div>
          </div>

          {/* Admin role */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Admin Access</div>
            <form action={toggleAdminRole}>
              <input type="hidden" name="user_id" value={member.id} />
              <input type="hidden" name="is_admin" value={String(isAdmin)} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F" }}>
                    {isAdmin ? "Admin role active" : "Not an admin"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6E6E6E", marginTop: "2px" }}>
                    Admins can manage members, groups, and sessions.
                  </div>
                </div>
                <button
                  type="submit"
                  style={isAdmin
                    ? pillBtn("#EF4444", "rgba(239,68,68,0.05)", "#EF4444")
                    : pillBtn("#FF4F1A", "rgba(255,79,26,0.05)", "#FF4F1A")
                  }
                >
                  {isAdmin ? "Remove Admin" : "Make Admin"}
                </button>
              </div>
            </form>
          </div>

          {/* Groups */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Groups</div>
            {memberGroups.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#A3A3A3", marginBottom: "12px" }}>
                Not assigned to any group.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {memberGroups.map((g) => (
                  <div key={g.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", background: "#FAFAF9", borderRadius: "10px",
                    border: "1px solid #F0F0EE",
                  }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F" }}>{g.name}</span>
                      {g.role === "facilitator" && (
                        <span style={{
                          marginLeft: "8px", fontSize: "10px", fontWeight: 600, padding: "1px 8px",
                          borderRadius: "10px", background: "rgba(255,79,26,0.1)", color: "#FF4F1A",
                        }}>
                          Facilitator
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <form action={toggleFacilitator}>
                        <input type="hidden" name="user_id" value={member.id} />
                        <input type="hidden" name="group_id" value={g.id} />
                        <input type="hidden" name="current_role" value={g.role} />
                        <button type="submit" style={pillBtn("#6E6E6E", "white", "#E5E5E5")}>
                          {g.role === "facilitator" ? "Remove Facilitator" : "Make Facilitator"}
                        </button>
                      </form>
                      <form action={removeFromGroup}>
                        <input type="hidden" name="user_id" value={member.id} />
                        <input type="hidden" name="group_id" value={g.id} />
                        <button type="submit" style={pillBtn("#EF4444", "rgba(239,68,68,0.05)", "#EF4444")}>
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add to group */}
            {availableGroups.length > 0 && (
              <form action={addToGroup} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="hidden" name="user_id" value={member.id} />
                <select
                  name="group_id"
                  value={addGroupId}
                  onChange={(e) => setAddGroupId(e.target.value)}
                  style={{
                    flex: 1, padding: "7px 10px", fontSize: "13px",
                    border: "1px solid #E5E5E5", borderRadius: "6px",
                    fontFamily: "inherit", color: "#0F0F0F", background: "#FFFFFF",
                    outline: "none",
                  }}
                >
                  <option value="">Select group...</option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!addGroupId}
                  style={{
                    padding: "7px 14px", fontSize: "12px", fontWeight: 600,
                    background: addGroupId ? "#0F0F0F" : "#E5E5E5",
                    color: addGroupId ? "white" : "#A3A3A3",
                    border: "none", borderRadius: "6px",
                    cursor: addGroupId ? "pointer" : "default",
                    whiteSpace: "nowrap",
                  }}
                >
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Account info */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Account Info</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6E6E6E" }}>Created</span>
                <span style={{ color: "#0F0F0F", fontWeight: 500 }}>
                  {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6E6E6E" }}>Onboarding</span>
                <span style={{ color: member.onboarding_completed_at ? "#22C55E" : "#A3A3A3", fontWeight: 500 }}>
                  {member.onboarding_completed_at
                    ? `Completed ${new Date(member.onboarding_completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "Not completed"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6E6E6E" }}>Path</span>
                <span style={{ color: member.onboarding_path === "ds-graduate" ? "#3B82F6" : "#A3A3A3", fontWeight: 500 }}>
                  {member.onboarding_path === "ds-graduate" ? "DS Graduate" : "New to Forum"}
                </span>
              </div>
              {member.archived_at && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6E6E6E" }}>Archived</span>
                  <span style={{ color: "#EF4444", fontWeight: 500 }}>
                    {new Date(member.archived_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Send invite */}
              <form action={sendInviteEmailAction}>
                <input type="hidden" name="email" value={member.email} />
                <button type="submit" style={{ ...pillBtn("#3B82F6", "rgba(59,130,246,0.05)", "#3B82F6"), width: "100%", textAlign: "center" }}>
                  Send Invite Email
                </button>
              </form>

              {/* Archive / Restore */}
              {member.archived_at ? (
                <form action={restoreMemberAction}>
                  <input type="hidden" name="user_id" value={member.id} />
                  <button type="submit" style={{ ...pillBtn("#22C55E", "rgba(34,197,94,0.05)", "#22C55E"), width: "100%", textAlign: "center" }}>
                    Restore Member
                  </button>
                </form>
              ) : (
                <form action={archiveMemberAction}>
                  <input type="hidden" name="user_id" value={member.id} />
                  <button type="submit" style={{ ...pillBtn("#EF4444", "rgba(239,68,68,0.05)", "#EF4444"), width: "100%", textAlign: "center" }}>
                    Archive Member
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
