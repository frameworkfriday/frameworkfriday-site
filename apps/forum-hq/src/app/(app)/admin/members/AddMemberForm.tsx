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
  const [showMore, setShowMore] = useState(false);

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

  const sectionHeaderStyle = {
    fontSize: "11px",
    fontWeight: 700,
    color: "#A3A3A3",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "10px",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #F0F0EE",
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
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
        {/* Hidden inputs for state-managed values */}
        {selectedGroups.map((gid) => (
          <input key={gid} type="hidden" name="group_ids" value={gid} />
        ))}
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="onboarding_path" value={onboardingPath} />

        {/* ── Core fields (always visible) ── */}
        <div
          className="form-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "12px",
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
        </div>

        <div
          className="form-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Role / Title</label>
            <input name="role_title" type="text" placeholder="CEO, Founder..." style={inputStyle} />
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
              <option value="internal-team">Internal Team</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Member Type</label>
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
          <div>
            <label style={labelStyle}>Assign to Group</label>
            {role === "facilitator" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {groups.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "#A3A3A3" }}>No groups</span>
                ) : (
                  groups.map((g) => {
                    const checked = selectedGroups.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        style={{
                          padding: "5px 10px", borderRadius: "6px",
                          fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          border: checked ? "1.5px solid #FF4F1A" : "1.5px solid #E5E5E5",
                          background: checked ? "rgba(255,79,26,0.08)" : "#FFFFFF",
                          color: checked ? "#FF4F1A" : "#6E6E6E",
                        }}
                      >
                        {checked && "✓ "}{g.name}
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <select
                value={selectedGroups[0] || ""}
                onChange={(e) => setSelectedGroups(e.target.value ? [e.target.value] : [])}
                style={inputStyle}
              >
                <option value="">{role === "admin" ? "No group (app-wide)" : "No group"}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── Expand/collapse for additional fields ── */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "12px", fontWeight: 600, color: "#FF4F1A",
            padding: "6px 0", display: "flex", alignItems: "center", gap: "6px",
            fontFamily: "inherit",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: showMore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {showMore ? "Hide additional fields" : "Show all profile fields"}
        </button>

        {showMore && (
          <>
            {/* ── Contact ── */}
            <div style={sectionHeaderStyle}>Contact</div>
            <div
              className="form-grid-3"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "4px" }}
            >
              <div>
                <label style={labelStyle}>Phone</label>
                <input name="phone" type="tel" placeholder="+1 (555) 000-0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>LinkedIn URL</label>
                <input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input name="website_url" type="url" placeholder="https://..." style={inputStyle} />
              </div>
            </div>

            {/* ── Address ── */}
            <div style={sectionHeaderStyle}>Address</div>
            <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
              <div>
                <label style={labelStyle}>Address Line 1</label>
                <input name="address_line1" type="text" placeholder="Street address" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Address Line 2</label>
                <input name="address_line2" type="text" placeholder="Apt, suite, unit" style={inputStyle} />
              </div>
            </div>
            <div className="form-grid-4" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.6fr 1fr", gap: "12px", marginBottom: "4px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input name="city" type="text" placeholder="City" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input name="state" type="text" placeholder="State" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Zip</label>
                <input name="zip" type="text" placeholder="Zip" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input name="country" type="text" placeholder="Country" style={inputStyle} />
              </div>
            </div>

            {/* ── Business ── */}
            <div style={sectionHeaderStyle}>Business Details</div>
            <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "4px" }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <input name="industry" type="text" placeholder="e.g. SaaS, Consulting" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Revenue Range</label>
                <select name="company_revenue_range" style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="pre-revenue">Pre-revenue</option>
                  <option value="0-100k">$0 – $100K</option>
                  <option value="100k-500k">$100K – $500K</option>
                  <option value="500k-1m">$500K – $1M</option>
                  <option value="1m-3m">$1M – $3M</option>
                  <option value="3m-5m">$3M – $5M</option>
                  <option value="5m-10m">$5M – $10M</option>
                  <option value="10m-25m">$10M – $25M</option>
                  <option value="25m+">$25M+</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Employee Count</label>
                <select name="employee_count_range" style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="solo">Solo / 1</option>
                  <option value="2-5">2 – 5</option>
                  <option value="6-10">6 – 10</option>
                  <option value="11-25">11 – 25</option>
                  <option value="26-50">26 – 50</option>
                  <option value="51-100">51 – 100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
            </div>

            {/* ── Personal ── */}
            <div style={sectionHeaderStyle}>Personal</div>
            <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "4px" }}>
              <div>
                <label style={labelStyle}>Birthday</label>
                <input name="birthday" type="date" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Spouse / Partner</label>
                <input name="spouse_partner_name" type="text" placeholder="Name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Referral Source</label>
                <input name="referral_source" type="text" placeholder="How did they hear about us?" style={inputStyle} />
              </div>
            </div>

            {/* ── Bio & Goals ── */}
            <div style={sectionHeaderStyle}>Bio & Goals</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "4px" }}>
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea name="bio" placeholder="Short bio..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Goals</label>
                <textarea name="goals" placeholder="What do they hope to get from Forum?" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          </>
        )}

        {/* ── Submit buttons ── */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button
            type="submit"
            formAction={inviteUser}
            style={{
              padding: "8px 18px", background: "#FF4F1A", color: "white",
              border: "none", borderRadius: "6px", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Add & Send Invite
          </button>
          <button
            type="submit"
            formAction={addMemberWithoutInvite}
            style={{
              padding: "8px 18px", background: "none", color: "#6E6E6E",
              border: "1.5px solid #E5E5E5", borderRadius: "6px", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Add Only (No Email)
          </button>
        </div>
      </form>
    </div>
  );
}
