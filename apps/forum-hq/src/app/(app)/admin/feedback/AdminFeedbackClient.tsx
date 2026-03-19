"use client";

import { useState, useTransition } from "react";
import {
  updateFeedbackStatus,
  assignFeedback,
  addFacilitatorNote,
  addResolutionNote,
} from "./actions";

type FeedbackType = "friction" | "suggestion" | "question" | "praise";
type Severity = "blocker" | "frustrating" | "minor";
type FeedbackStatus = "new" | "acknowledged" | "in-progress" | "resolved" | "wont-fix";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url?: string | null;
}

interface AssignedProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface FeedbackItem {
  id: string;
  feedback_type: FeedbackType;
  subject: string;
  body: string;
  context: string | null;
  severity: Severity | null;
  status: FeedbackStatus;
  assigned_to: string | null;
  facilitator_note: string | null;
  resolution_note: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  profiles: Profile | null;
  forum_groups: { id: string; name: string } | null;
  assigned_profile: AssignedProfile | null;
}

interface Props {
  initialFeedback: FeedbackItem[];
  profiles: Profile[];
}

const TYPE_COLORS: Record<FeedbackType, { bg: string; color: string; label: string }> = {
  friction:   { bg: "rgba(239,68,68,0.1)",  color: "#EF4444", label: "Friction" },
  suggestion: { bg: "rgba(59,130,246,0.1)", color: "#3B82F6", label: "Suggestion" },
  question:   { bg: "rgba(234,179,8,0.12)", color: "#A37700", label: "Question" },
  praise:     { bg: "rgba(34,197,94,0.1)",  color: "#22C55E", label: "Praise" },
};

const STATUS_COLORS: Record<FeedbackStatus, { bg: string; color: string; label: string }> = {
  "new":          { bg: "#F0F0F0",              color: "#6E6E6E", label: "New" },
  "acknowledged": { bg: "rgba(59,130,246,0.1)", color: "#3B82F6", label: "Acknowledged" },
  "in-progress":  { bg: "rgba(255,79,26,0.1)",  color: "#FF4F1A", label: "In Progress" },
  "resolved":     { bg: "rgba(34,197,94,0.1)",  color: "#22C55E", label: "Resolved" },
  "wont-fix":     { bg: "#F0F0F0",              color: "#A3A3A3", label: "Won't Fix" },
};

const SEVERITY_LABELS: Record<Severity, string> = {
  blocker: "Blocker",
  frustrating: "Frustrating",
  minor: "Minor",
};

const SEVERITY_COLORS: Record<Severity, string> = {
  blocker: "#EF4444",
  frustrating: "#FF4F1A",
  minor: "#A3A3A3",
};

const ALL_STATUSES: FeedbackStatus[] = ["new", "acknowledged", "in-progress", "resolved", "wont-fix"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitial(p: Profile | null) {
  if (!p) return "?";
  return (p.first_name || p.email || "?")[0].toUpperCase();
}

function getName(p: Profile | null) {
  if (!p) return "Unknown";
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
  return name || p.email;
}

function getAssigneeName(p: AssignedProfile | null) {
  if (!p) return "";
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "—";
}

export default function AdminFeedbackClient({ initialFeedback, profiles }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<FeedbackItem[]>(initialFeedback);

  const filtered = statusFilter === "all"
    ? feedback
    : feedback.filter((f) => f.status === statusFilter);

  // Count by status
  const counts: Record<string, number> = { all: feedback.length };
  for (const s of ALL_STATUSES) {
    counts[s] = feedback.filter((f) => f.status === s).length;
  }

  const filterLabels: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "acknowledged", label: "Acknowledged" },
    { key: "in-progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
  ];

  const pillBase: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
    fontFamily: "inherit",
    transition: "all 0.15s",
  };

  // Optimistic update handler passed to cards
  const handleStatusChange = (id: string, newStatus: FeedbackStatus) => {
    setFeedback((prev) =>
      prev.map((f) => f.id === id ? { ...f, status: newStatus } : f)
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Admin
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
              Member Feedback
            </h1>
            <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
              All feedback from Forum members across groups.
            </p>
          </div>
          {/* Status summary */}
          <div style={{ display: "flex", gap: "12px", flexShrink: 0, paddingBottom: "4px" }}>
            {counts["new"] > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F0F0F", lineHeight: 1 }}>{counts["new"]}</div>
                <div style={{ fontSize: "11px", color: "#A3A3A3", fontWeight: 500 }}>New</div>
              </div>
            )}
            {counts["in-progress"] > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#FF4F1A", lineHeight: 1 }}>{counts["in-progress"]}</div>
                <div style={{ fontSize: "11px", color: "#A3A3A3", fontWeight: 500 }}>In Progress</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {filterLabels.map(({ key, label }) => {
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                ...pillBase,
                background: active ? "#0F0F0F" : "transparent",
                color: active ? "white" : "#6E6E6E",
                border: active ? "1px solid #0F0F0F" : "1px solid #E5E5E5",
              }}
            >
              {label}
              {counts[key] > 0 && (
                <span style={{
                  marginLeft: "6px",
                  background: active ? "rgba(255,255,255,0.2)" : "#F0F0F0",
                  color: active ? "white" : "#6E6E6E",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}>
                  {counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>No feedback here</div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            {statusFilter === "all" ? "No feedback has been submitted yet." : `No ${statusFilter} feedback.`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((item, idx) => (
            <FeedbackRow
              key={item.id}
              item={item}
              idx={idx}
              profiles={profiles}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackRow({
  item,
  idx,
  profiles,
  onStatusChange,
}: {
  item: FeedbackItem;
  idx: number;
  profiles: Profile[];
  onStatusChange: (id: string, status: FeedbackStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [facNote, setFacNote] = useState(item.facilitator_note ?? "");
  const [resNote, setResNote] = useState(item.resolution_note ?? "");
  const [isPending, startTransition] = useTransition();

  const typeCfg = TYPE_COLORS[item.feedback_type];
  const statusCfg = STATUS_COLORS[item.status];

  const handleStatusChange = (newStatus: string) => {
    const s = newStatus as FeedbackStatus;
    onStatusChange(item.id, s);
    startTransition(async () => {
      await updateFeedbackStatus(item.id, newStatus);
    });
  };

  const handleAssign = (userId: string) => {
    startTransition(async () => {
      await assignFeedback(item.id, userId);
    });
  };

  const handleSaveFacNote = () => {
    startTransition(async () => {
      await addFacilitatorNote(item.id, facNote);
    });
  };

  const handleSaveResNote = () => {
    startTransition(async () => {
      await addResolutionNote(item.id, resNote);
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    fontSize: "13px",
    border: "1px solid #E5E5E5",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FFFFFF",
    boxSizing: "border-box",
    resize: "vertical",
  };

  const selectStyle: React.CSSProperties = {
    fontSize: "12px",
    border: "1px solid #E5E5E5",
    borderRadius: "6px",
    padding: "4px 8px",
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FAFAFA",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div
      className="card animate-fade-up"
      style={{ animationDelay: `${idx * 0.03}s`, overflow: "hidden" }}
    >
      {/* Row */}
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "rgba(255,79,26,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          color: "#FF4F1A",
          flexShrink: 0,
        }}>
          {getInitial(item.profiles)}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
            <span style={{ fontWeight: 600, fontSize: "13px", color: "#0F0F0F" }}>
              {getName(item.profiles)}
            </span>
            {item.forum_groups && (
              <span style={{ fontSize: "11px", color: "#A3A3A3" }}>
                {item.forum_groups.name}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F" }}>{item.subject}</div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "3px 8px", borderRadius: "20px",
            fontSize: "11px", fontWeight: 600,
            background: typeCfg.bg, color: typeCfg.color,
          }}>
            {typeCfg.label}
          </span>

          {item.severity && item.feedback_type === "friction" && (
            <span style={{
              fontSize: "10px", fontWeight: 600,
              color: SEVERITY_COLORS[item.severity],
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {SEVERITY_LABELS[item.severity]}
            </span>
          )}

          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "3px 8px", borderRadius: "20px",
            fontSize: "11px", fontWeight: 600,
            background: statusCfg.bg, color: statusCfg.color,
          }}>
            {statusCfg.label}
          </span>

          <span style={{ fontSize: "11px", color: "#A3A3A3" }}>{formatDate(item.created_at)}</span>

          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #EEEEED" }}>
          {/* Full body */}
          <p style={{ fontSize: "14px", color: "#0F0F0F", lineHeight: "1.6", margin: "16px 0 10px" }}>
            {item.body}
          </p>

          {item.context && (
            <div style={{ fontSize: "12px", color: "#6E6E6E", marginBottom: "16px" }}>
              <span style={{ fontWeight: 600 }}>Where: </span>{item.context}
            </div>
          )}

          {/* Controls row */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
            {/* Status selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</span>
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                disabled={isPending}
                style={selectStyle}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_COLORS[s].label}</option>
                ))}
              </select>
            </div>

            {/* Assign */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.06em" }}>Assign</span>
              <select
                defaultValue={item.assigned_to ?? ""}
                onChange={(e) => handleAssign(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                disabled={isPending}
                style={selectStyle}
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}
                  </option>
                ))}
              </select>
              {item.assigned_profile && (
                <span style={{ fontSize: "12px", color: "#6E6E6E" }}>
                  → {getAssigneeName(item.assigned_profile)}
                </span>
              )}
            </div>

            {/* Quick action buttons */}
            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
              {item.status === "new" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStatusChange("acknowledged"); }}
                  disabled={isPending}
                  style={{
                    background: "rgba(59,130,246,0.08)",
                    color: "#3B82F6",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: "8px",
                    padding: "7px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Acknowledge
                </button>
              )}
              {item.status !== "resolved" && item.status !== "wont-fix" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStatusChange("resolved"); }}
                  disabled={isPending}
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    color: "#22C55E",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: "8px",
                    padding: "7px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Resolve
                </button>
              )}
              {item.status !== "wont-fix" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStatusChange("wont-fix"); }}
                  disabled={isPending}
                  style={{
                    background: "transparent",
                    color: "#A3A3A3",
                    border: "1px solid #E5E5E5",
                    borderRadius: "8px",
                    padding: "7px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Won't Fix
                </button>
              )}
            </div>
          </div>

          {/* Notes section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Facilitator note */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                Facilitator Note
              </label>
              <textarea
                value={facNote}
                onChange={(e) => setFacNote(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                rows={3}
                placeholder="Visible to the member..."
                style={{ ...inputStyle, marginBottom: "6px" }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveFacNote(); }}
                disabled={isPending}
                style={{
                  background: "transparent",
                  color: "#6E6E6E",
                  border: "1px solid #E5E5E5",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Save Note
              </button>
            </div>

            {/* Resolution note */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#6E6E6E", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
                Resolution Note
              </label>
              <textarea
                value={resNote}
                onChange={(e) => setResNote(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                rows={3}
                placeholder="What was done to resolve this..."
                style={{ ...inputStyle, marginBottom: "6px" }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveResNote(); }}
                disabled={isPending}
                style={{
                  background: "transparent",
                  color: "#6E6E6E",
                  border: "1px solid #E5E5E5",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
