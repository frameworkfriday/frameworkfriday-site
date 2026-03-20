"use client";

import { useState } from "react";
import { bulkCreateSessions } from "./actions";

interface Props {
  groups: { id: string; name: string }[];
  profiles: { id: string; first_name: string; last_name: string }[];
}

const SESSION_TYPES = [
  { value: "forum_session", label: "Forum Session" },
  { value: "office_hours", label: "Office Hours" },
  { value: "ad_hoc", label: "Ad Hoc" },
];

export default function BulkScheduleForm({ groups, profiles }: Props) {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleAll = () => {
    if (allSelected) {
      setAllSelected(false);
      setSelectedGroups(new Set());
    } else {
      setAllSelected(true);
      setSelectedGroups(new Set(groups.map((g) => g.id)));
    }
  };

  const toggleGroup = (id: string) => {
    const next = new Set(selectedGroups);
    if (next.has(id)) {
      next.delete(id);
      setAllSelected(false);
    } else {
      next.add(id);
      if (next.size === groups.length) setAllSelected(true);
    }
    setSelectedGroups(next);
  };

  const count = selectedGroups.size;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (count === 0) return;
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("group_ids", allSelected ? "all" : Array.from(selectedGroups).join(","));

    await bulkCreateSessions(fd);
    setSubmitting(false);
    form.reset();
    setSelectedGroups(new Set());
    setAllSelected(false);
    setShowUrl(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid #E5E5E5",
    background: "#FFFFFF",
    fontSize: "14px",
    color: "#0F0F0F",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6E6E6E",
    marginBottom: "6px",
  };

  return (
    <details className="card" style={{ padding: 0, marginBottom: "32px" }}>
      <summary
        style={{
          padding: "16px 24px",
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: 700,
          fontSize: "15px",
          color: "#0F0F0F",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="12" y1="14" x2="12" y2="20" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
        Bulk Schedule — Multiple Groups
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>

      <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px", borderTop: "1px solid #F0F0EE" }}>
        <div style={{ fontSize: "12px", color: "#6E6E6E", margin: "16px 0 20px", lineHeight: 1.5 }}>
          Create the same session for multiple groups at once. Each group gets its own session and calendar event with invites sent to all members.
        </div>

        {/* Session fields */}
        <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input name="title" type="text" placeholder="{group} — {type}" defaultValue="{group} — {type}" style={inputStyle} />
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
            <label style={labelStyle}>Date & Time *</label>
            <input name="starts_at" type="datetime-local" required style={inputStyle} />
          </div>
        </div>

        <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Facilitator Override</label>
            <select name="facilitator_id" style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Group default</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{`${p.first_name} ${p.last_name}`.trim()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input name="description" type="text" placeholder="Optional" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Duration (min)</label>
            <input name="duration_minutes" type="number" defaultValue="90" min="15" max="480" style={inputStyle} />
          </div>
        </div>

        {/* Optional call URL */}
        {showUrl ? (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Call URL (overrides auto-sync)</label>
            <input name="video_call_url" type="url" placeholder="https://meet.google.com/..." style={inputStyle} />
            <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "4px" }}>
              Providing a URL skips Google Calendar event creation.
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "14px" }}>
            <input type="hidden" name="video_call_url" value="" />
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              style={{
                fontSize: "12px", color: "#A3A3A3", background: "none",
                border: "none", cursor: "pointer", padding: 0, textDecoration: "underline",
              }}
            >
              Already have a call link? Add URL
            </button>
          </div>
        )}

        <div style={{ fontSize: "11px", color: "#6E6E6E", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Use <strong>{"{group}"}</strong> in the title to insert each group&apos;s name automatically.
        </div>

        {/* Group selection */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Apply to Groups *</label>
          <div style={{
            border: "1.5px solid #E5E5E5", borderRadius: "10px", overflow: "hidden",
          }}>
            {/* All groups toggle */}
            <div
              onClick={toggleAll}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", cursor: "pointer",
                background: allSelected ? "rgba(255,79,26,0.04)" : "#FAFAF9",
                borderBottom: "1px solid #E5E5E5",
              }}
            >
              <div style={{
                width: "18px", height: "18px", borderRadius: "14px",
                border: `2px solid ${allSelected ? "#FF4F1A" : "#D4D4D4"}`,
                background: allSelected ? "#FF4F1A" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", flexShrink: 0,
              }}>
                {allSelected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F0F0F" }}>
                All Groups ({groups.length})
              </span>
            </div>

            {/* Individual groups */}
            {groups.map((g) => {
              const checked = selectedGroups.has(g.id);
              return (
                <div
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 14px", cursor: "pointer",
                    background: checked ? "rgba(255,79,26,0.02)" : "transparent",
                    borderBottom: "1px solid #F0F0EE",
                  }}
                >
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "14px",
                    border: `2px solid ${checked ? "#FF4F1A" : "#D4D4D4"}`,
                    background: checked ? "#FF4F1A" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", flexShrink: 0,
                  }}>
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F0F0F" }}>
                    {g.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={count === 0 || submitting}
          style={{
            padding: "10px 24px",
            borderRadius: "10px",
            border: "none",
            background: count > 0 ? "#FF4F1A" : "#E5E5E5",
            color: count > 0 ? "#FFFFFF" : "#A3A3A3",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: count > 0 && !submitting ? "pointer" : "default",
          }}
        >
          {submitting
            ? "Scheduling..."
            : count === 0
            ? "Select groups to schedule"
            : `Schedule ${count} Session${count !== 1 ? "s" : ""}`}
        </button>
      </form>
    </details>
  );
}
