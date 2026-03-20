"use client";

import { useState } from "react";
import { rsvpToSession } from "./actions";

interface RsvpButtonsProps {
  sessionId: string;
  currentStatus?: "accepted" | "declined" | "tentative" | "needsAction";
}

const OPTIONS = [
  { value: "accepted" as const, label: "Going", color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
  { value: "tentative" as const, label: "Maybe", color: "#EAB308", bg: "#FEFCE8", border: "#FDE68A" },
  { value: "declined" as const, label: "Can't Go", color: "#EF4444", bg: "#FEF2F2", border: "#FCA5A5" },
];

export default function RsvpButtons({ sessionId, currentStatus }: RsvpButtonsProps) {
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const handleRsvp = async (response: "accepted" | "declined" | "tentative", comment?: string) => {
    setPending(response);
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("response", response);
    if (comment) fd.set("comment", comment);
    await rsvpToSession(fd);
    setPending(null);
    setShowDeclineReason(false);
    setReason("");
  };

  return (
    <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
      <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "12px" }}>
        Your RSVP
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {OPTIONS.map((opt) => {
          const isActive = currentStatus === opt.value;
          return (
            <button
              key={opt.value}
              disabled={pending !== null}
              onClick={() => {
                if (opt.value === "declined" && !isActive) {
                  setShowDeclineReason(true);
                } else {
                  handleRsvp(opt.value);
                }
              }}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: "10px",
                border: `1.5px solid ${isActive ? opt.border : "#E5E5E5"}`,
                background: isActive ? opt.bg : "#FFFFFF",
                color: isActive ? opt.color : "#6E6E6E",
                fontSize: "13px",
                fontWeight: 600,
                cursor: pending !== null ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                opacity: pending !== null && pending !== opt.value ? 0.5 : 1,
              }}
            >
              {pending === opt.value ? "..." : opt.label}
            </button>
          );
        })}
      </div>

      {showDeclineReason && (
        <div style={{ marginTop: "12px" }}>
          <textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1.5px solid #E5E5E5",
              fontSize: "13px",
              resize: "none",
              height: "60px",
              fontFamily: "var(--font-dm-sans)",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={() => handleRsvp("declined", reason || undefined)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#EF4444",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {pending === "declined" ? "..." : "Confirm Decline"}
            </button>
            <button
              onClick={() => { setShowDeclineReason(false); setReason(""); }}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #E5E5E5",
                background: "#FFFFFF",
                color: "#6E6E6E",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
