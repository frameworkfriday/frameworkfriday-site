"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "./actions";

type FeedbackType = "friction" | "suggestion" | "question" | "praise";
type Severity = "blocker" | "frustrating" | "minor";
type FeedbackStatus = "new" | "acknowledged" | "in-progress" | "resolved" | "wont-fix";

interface FeedbackItem {
  id: string;
  feedback_type: FeedbackType;
  subject: string;
  body: string;
  context: string | null;
  severity: Severity | null;
  status: FeedbackStatus;
  facilitator_note: string | null;
  resolution_note: string | null;
  created_at: string;
}

interface Props {
  initialFeedback: FeedbackItem[];
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
  blocker:     "Blocker",
  frustrating: "Frustrating",
  minor:       "Minor",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FeedbackClient({ initialFeedback }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("friction");
  const [severity, setSeverity] = useState<Severity>("frustrating");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const feedbackItems = initialFeedback;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("feedback_type", feedbackType);
    if (feedbackType === "friction") formData.set("severity", severity);

    startTransition(async () => {
      const result = await submitFeedback(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setShowForm(false);
        // Reset form
        (e.target as HTMLFormElement).reset();
        setFeedbackType("friction");
        setSeverity("frustrating");
        // Brief delay then reload to show new item
        setTimeout(() => {
          window.location.reload();
        }, 400);
      }
    });
  };

  const pillBase: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "all 0.15s",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    border: "1px solid #E5E5E5",
    borderRadius: "10px",
    outline: "none",
    fontFamily: "inherit",
    color: "#0F0F0F",
    background: "#FFFFFF",
    boxSizing: "border-box",
    resize: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6E6E6E",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
            Your Voice
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
            Feedback
          </h1>
          <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
            Help us improve your Forum experience.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setSuccess(false); }}
            style={{
              background: "#FF4F1A",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              marginTop: "4px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Share Feedback
          </button>
        )}
      </div>

      {/* Success banner */}
      {success && (
        <div style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#16a34a",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Feedback submitted — thank you.
        </div>
      )}

      {/* Inline submit form */}
      {showForm && (
        <div
          className="card"
          style={{ padding: "24px", marginBottom: "28px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F0F0F" }}>
              Share Feedback
            </h2>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#A3A3A3",
                padding: "4px",
                display: "flex",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6E6E6E")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Type pills */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["friction", "suggestion", "question", "praise"] as FeedbackType[]).map((t) => {
                  const cfg = TYPE_COLORS[t];
                  const active = feedbackType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFeedbackType(t)}
                      style={{
                        ...pillBase,
                        background: active ? cfg.bg : "transparent",
                        color: active ? cfg.color : "#6E6E6E",
                        border: active ? `1px solid ${cfg.color}30` : "1px solid #E5E5E5",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle} htmlFor="fb-subject">Subject</label>
              <input
                id="fb-subject"
                name="subject"
                type="text"
                placeholder="Brief summary"
                required
                style={inputStyle}
              />
            </div>

            {/* Body */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle} htmlFor="fb-body">Description</label>
              <textarea
                id="fb-body"
                name="body"
                rows={4}
                placeholder="Tell us more..."
                required
                style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
              />
            </div>

            {/* Context */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle} htmlFor="fb-context">Where did this happen? <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#A3A3A3" }}>(optional)</span></label>
              <input
                id="fb-context"
                name="context"
                type="text"
                placeholder="e.g., during onboarding, in a session, using a skill"
                style={inputStyle}
              />
            </div>

            {/* Severity — friction only */}
            {feedbackType === "friction" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Severity</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["blocker", "frustrating", "minor"] as Severity[]).map((s) => {
                    const active = severity === s;
                    const colors: Record<Severity, string> = {
                      blocker:     "#EF4444",
                      frustrating: "#FF4F1A",
                      minor:       "#A3A3A3",
                    };
                    const c = colors[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(s)}
                        style={{
                          ...pillBase,
                          background: active ? `${c}18` : "transparent",
                          color: active ? c : "#6E6E6E",
                          border: active ? `1px solid ${c}40` : "1px solid #E5E5E5",
                        }}
                      >
                        {SEVERITY_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: "13px", color: "#EF4444", marginBottom: "14px", fontWeight: 500 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: isPending ? "#ccc" : "#FF4F1A",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: isPending ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {isPending ? "Submitting…" : "Submit Feedback"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: "transparent",
                  color: "#6E6E6E",
                  border: "1px solid #E5E5E5",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Previous submissions */}
      <div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#A3A3A3", marginBottom: "12px", letterSpacing: "0.04em" }}>
          {feedbackItems.length === 0 ? "No submissions yet" : `${feedbackItems.length} submission${feedbackItems.length !== 1 ? "s" : ""}`}
        </div>

        {feedbackItems.length === 0 ? (
          <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
            <div style={{ marginBottom: "10px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D0D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>No feedback yet</div>
            <div style={{ fontSize: "13px", color: "#6E6E6E" }}>Share a thought — we read everything.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {feedbackItems.map((item, idx) => (
              <FeedbackCard key={item.id} item={item} idx={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ item, idx }: { item: FeedbackItem; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = TYPE_COLORS[item.feedback_type];
  const statusCfg = STATUS_COLORS[item.status];

  return (
    <div
      className="card animate-fade-up"
      style={{
        padding: "16px 20px",
        cursor: "pointer",
        animationDelay: `${idx * 0.04}s`,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Type badge */}
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 9px",
          borderRadius: "10px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          background: typeCfg.bg,
          color: typeCfg.color,
          flexShrink: 0,
          marginTop: "1px",
        }}>
          {typeCfg.label}
        </span>

        {/* Subject + body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#0F0F0F" }}>{item.subject}</span>
            {item.severity && item.feedback_type === "friction" && (
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                color: item.severity === "blocker" ? "#EF4444" : item.severity === "frustrating" ? "#FF4F1A" : "#A3A3A3",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                {SEVERITY_LABELS[item.severity]}
              </span>
            )}
          </div>
          {!expanded && (
            <p style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "#6E6E6E",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.5",
            }}>
              {item.body}
            </p>
          )}
        </div>

        {/* Right meta */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 9px",
            borderRadius: "10px",
            fontSize: "11px",
            fontWeight: 600,
            background: statusCfg.bg,
            color: statusCfg.color,
          }}>
            {statusCfg.label}
          </span>
          <span style={{ fontSize: "11px", color: "#A3A3A3" }}>{formatDate(item.created_at)}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #EEEEED" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#0F0F0F", lineHeight: "1.6" }}>
            {item.body}
          </p>

          {item.context && (
            <div style={{ fontSize: "12px", color: "#6E6E6E", marginBottom: "10px" }}>
              <span style={{ fontWeight: 600 }}>Where: </span>{item.context}
            </div>
          )}

          {(item.facilitator_note || item.resolution_note) && (
            <div style={{
              background: "rgba(255,79,26,0.04)",
              border: "1px solid rgba(255,79,26,0.15)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginTop: "12px",
            }}>
              {item.facilitator_note && (
                <div style={{ marginBottom: item.resolution_note ? "10px" : 0 }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#FF4F1A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Note from your facilitator
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#0F0F0F", lineHeight: "1.5" }}>
                    {item.facilitator_note}
                  </p>
                </div>
              )}
              {item.resolution_note && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Resolution
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#0F0F0F", lineHeight: "1.5" }}>
                    {item.resolution_note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
