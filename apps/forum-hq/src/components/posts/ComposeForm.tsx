"use client";

import { useState, useTransition } from "react";

interface Group {
  id: string;
  name: string;
}

interface Props {
  role: "member" | "facilitator" | "admin";
  groups: Group[];
  createAction: (formData: FormData) => Promise<void>;
}

export default function ComposeForm({ role, groups, createAction }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState("discussion");
  const [audience, setAudience] = useState<"global" | "groups">("global");
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const canAnnounce = role === "admin" || role === "facilitator";
  const canMultiGroup = role === "admin";

  const typeOptions = canAnnounce
    ? [
        { value: "announcement", label: "Announcement" },
        { value: "discussion", label: "Discussion" },
        { value: "question", label: "Question" },
      ]
    : [
        { value: "discussion", label: "Discussion" },
        { value: "question", label: "Question" },
      ];

  const toggleGroup = (id: string) => {
    const next = new Set(selectedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGroups(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!body.trim()) return;

    const fd = new FormData();
    fd.set("body", body.trim());
    fd.set("title", title.trim());
    fd.set("post_type", postType);

    if (audience === "global") {
      fd.set("is_global", "true");
    } else if (canMultiGroup) {
      fd.set("group_ids", Array.from(selectedGroups).join(","));
    } else if (groups.length > 0) {
      // Facilitator/member: first selected or first group
      const groupId = selectedGroups.size > 0 ? Array.from(selectedGroups)[0] : groups[0]?.id;
      if (groupId) fd.set("group_ids", groupId);
    }

    startTransition(async () => {
      await createAction(fd);
      setBody("");
      setTitle("");
      setPostType("discussion");
      setOpen(false);
      setSelectedGroups(new Set());
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
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

  if (!open) {
    return (
      <div
        className="card card-hover"
        onClick={() => setOpen(true)}
        style={{
          padding: "16px 22px",
          marginBottom: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          transition: "box-shadow 0.2s ease",
        }}
      >
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: "rgba(255,79,26,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span style={{ fontSize: "14px", color: "#A3A3A3" }}>
          {canAnnounce ? "Post an announcement or start a discussion..." : "Start a discussion or ask a question..."}
        </span>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "20px 24px", marginBottom: "20px", background: "#FAFAF9" }}>
      <form onSubmit={handleSubmit}>
        {/* Type + audience row */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Type</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              style={{ ...inputStyle, appearance: "none" }}
            >
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as "global" | "groups")}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="global">Everyone</option>
              {groups.length === 1 ? (
                <option value="groups">{groups[0].name}</option>
              ) : (
                <option value="groups">Select groups...</option>
              )}
            </select>
          </div>
        </div>

        {/* Multi-group selector for admin */}
        {audience === "groups" && canMultiGroup && groups.length > 1 && (
          <div style={{
            border: "1.5px solid #E5E5E5", borderRadius: "8px", marginBottom: "14px",
            maxHeight: "160px", overflowY: "auto",
          }}>
            {groups.map((g) => {
              const checked = selectedGroups.has(g.id);
              return (
                <div
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 14px", cursor: "pointer",
                    background: checked ? "rgba(255,79,26,0.02)" : "transparent",
                    borderBottom: "1px solid #F0F0EE",
                  }}
                >
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "4px",
                    border: `2px solid ${checked ? "#FF4F1A" : "#D4D4D4"}`,
                    background: checked ? "#FF4F1A" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {checked && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F0F0F" }}>{g.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Single-group select for facilitator with multiple groups */}
        {audience === "groups" && !canMultiGroup && groups.length > 1 && (
          <div style={{ marginBottom: "14px" }}>
            <select
              value={selectedGroups.size > 0 ? Array.from(selectedGroups)[0] : ""}
              onChange={(e) => setSelectedGroups(new Set(e.target.value ? [e.target.value] : []))}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        {(postType === "announcement" || title) && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Title {postType === "announcement" ? "*" : ""}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={postType === "question" ? "What's your question?" : "Title"}
              required={postType === "announcement"}
              style={inputStyle}
            />
          </div>
        )}

        {/* Body */}
        <div style={{ marginBottom: "14px" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              postType === "announcement"
                ? "Write your announcement..."
                : postType === "question"
                ? "Describe your question..."
                : "What's on your mind?"
            }
            rows={5}
            required
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, minHeight: "120px" }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="submit"
            disabled={!body.trim() || isPending}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: body.trim() ? "#FF4F1A" : "#E5E5E5",
              color: body.trim() ? "#FFFFFF" : "#A3A3A3",
              fontSize: "13px",
              fontWeight: 700,
              cursor: body.trim() && !isPending ? "pointer" : "default",
            }}
          >
            {isPending ? "Posting..." : "Post"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setBody(""); setTitle(""); }}
            style={{
              padding: "10px 16px", borderRadius: "8px",
              border: "1px solid #E5E5E5", background: "none",
              fontSize: "13px", fontWeight: 600, color: "#6E6E6E",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
