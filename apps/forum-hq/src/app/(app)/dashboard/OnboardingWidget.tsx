"use client";

import { useState, useEffect } from "react";
import OnboardingChecklist from "./OnboardingChecklist";

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  action_url: string | null;
  action_label: string | null;
  position: number;
  is_required: boolean;
  done: boolean;
}

interface Props {
  items: ChecklistItem[];
  userId: string;
  completedCount: number;
  totalRequired: number;
}

export default function OnboardingWidget({ items, userId, completedCount, totalRequired }: Props) {
  const progressPct = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;
  const defaultOpen = progressPct < 70;

  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    const stored = localStorage.getItem("onboarding-widget-expanded");
    return stored !== null ? stored === "true" : defaultOpen;
  });

  useEffect(() => {
    localStorage.setItem("onboarding-widget-expanded", String(expanded));
  }, [expanded]);

  return (
    <div className="card animate-fade-up" style={{ overflow: "hidden", marginBottom: "20px" }}>
      {/* Header — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "18px 24px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: progressPct === 100 ? "rgba(34,197,94,0.10)" : "rgba(255,79,26,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {progressPct === 100 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 6v6l4 2" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#0F0F0F", marginBottom: "2px" }}>
              {progressPct === 100 ? "Onboarding complete!" : "Complete your setup"}
            </div>
            <div style={{ fontSize: "12px", color: "#6E6E6E" }}>
              {completedCount} of {totalRequired} steps done
            </div>
          </div>
          {/* Progress ring */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontWeight: 700, fontSize: "18px", color: progressPct === 100 ? "#22C55E" : "#0F0F0F" }}>
              {progressPct}%
            </div>
            {/* Chevron */}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 24px", marginBottom: expanded ? "0" : "18px" }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Expandable checklist */}
      <div style={{
        maxHeight: expanded ? "600px" : "0",
        overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{ borderTop: "1px solid #F0F0EE" }}>
          <OnboardingChecklist items={items} userId={userId} />
        </div>
      </div>
    </div>
  );
}
