"use client";

import { useState, useTransition } from "react";

interface Group {
  id: string;
  name: string;
}

interface Props {
  groups: Group[];
  sendAction: (formData: FormData) => Promise<void>;
  defaultExpanded?: boolean;
}

export default function EmailBlastForm({ groups, sendAction, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;
    const fd = new FormData();
    fd.set("subject", subject.trim());
    fd.set("body", body.trim());
    fd.set("audience", audience === "all" ? "all" : [...selectedGroups].join(","));
    startTransition(async () => {
      await sendAction(fd);
      setSent(true);
      setSubject("");
      setBody("");
      setAudience("all");
      setSelectedGroups(new Set());
      setTimeout(() => { setSent(false); setExpanded(false); }, 3000);
    });
  };

  const canSend = subject.trim() && body.trim() && (audience === "all" || selectedGroups.size > 0);

  if (!expanded) {
    return (
      <div
        className="card"
        style={{ padding: "16px 20px", marginBottom: "16px", cursor: "pointer" }}
        onClick={() => setExpanded(true)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F" }}>
            Send Email Blast
          </span>
          <span style={{ fontSize: "12px", color: "#A3A3A3" }}>
            Email members directly via Gmail
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F0F0F" }}>Email Blast</span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#A3A3A3" }}
        >
          Cancel
        </button>
      </div>

      {/* Audience */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6E6E6E", display: "block", marginBottom: "6px" }}>
          To
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setAudience("all")}
            style={{
              padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
              border: `1.5px solid ${audience === "all" ? "#FF4F1A" : "#E5E5E5"}`,
              background: audience === "all" ? "rgba(255,79,26,0.06)" : "white",
              color: audience === "all" ? "#FF4F1A" : "#6E6E6E",
              cursor: "pointer",
            }}
          >
            All Members
          </button>
          <button
            onClick={() => setAudience("groups")}
            style={{
              padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
              border: `1.5px solid ${audience === "groups" ? "#FF4F1A" : "#E5E5E5"}`,
              background: audience === "groups" ? "rgba(255,79,26,0.06)" : "white",
              color: audience === "groups" ? "#FF4F1A" : "#6E6E6E",
              cursor: "pointer",
            }}
          >
            Specific Groups
          </button>
        </div>
        {audience === "groups" && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => toggleGroup(g.id)}
                style={{
                  padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                  border: `1.5px solid ${selectedGroups.has(g.id) ? "#0F0F0F" : "#E5E5E5"}`,
                  background: selectedGroups.has(g.id) ? "#0F0F0F" : "white",
                  color: selectedGroups.has(g.id) ? "white" : "#6E6E6E",
                  cursor: "pointer",
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subject */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6E6E6E", display: "block", marginBottom: "6px" }}>
          Subject
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line"
          style={{
            width: "100%", padding: "9px 12px", fontSize: "14px",
            border: "1px solid #E5E5E5", borderRadius: "8px",
            fontFamily: "inherit", color: "#0F0F0F", background: "#FFFFFF",
            boxSizing: "border-box", outline: "none",
          }}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6E6E6E", display: "block", marginBottom: "6px" }}>
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Email body..."
          rows={5}
          style={{
            width: "100%", padding: "10px 12px", fontSize: "14px",
            border: "1px solid #E5E5E5", borderRadius: "8px",
            fontFamily: "inherit", color: "#0F0F0F", background: "#FFFFFF",
            boxSizing: "border-box", outline: "none", resize: "vertical",
            lineHeight: 1.5,
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={handleSend}
          disabled={!canSend || isPending}
          style={{
            padding: "10px 20px",
            background: sent ? "#22C55E" : canSend ? "#FF4F1A" : "#E5E5E5",
            color: canSend || sent ? "white" : "#A3A3A3",
            border: "none", borderRadius: "8px",
            fontSize: "13px", fontWeight: 700,
            cursor: canSend && !isPending ? "pointer" : "default",
          }}
        >
          {isPending ? "Sending..." : sent ? "Sent!" : "Send Email"}
        </button>
        <span style={{ fontSize: "11px", color: "#A3A3A3" }}>
          Sent from hello@frameworkfriday.ai via Gmail
        </span>
      </div>
    </div>
  );
}
