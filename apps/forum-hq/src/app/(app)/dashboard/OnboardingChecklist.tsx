"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

export default function OnboardingChecklist({
  items: initialItems,
  userId,
}: {
  items: ChecklistItem[];
  userId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const toggleItem = async (itemId: string, currentDone: boolean) => {
    setLoading(itemId);
    const supabase = createClient();

    if (!currentDone) {
      // Mark complete: upsert with completed_at
      await supabase.from("onboarding_progress").upsert({
        user_id: userId,
        item_id: itemId,
        completed_at: new Date().toISOString(),
        completed_by: userId,
      });
    } else {
      // Uncheck: clear completed_at
      await supabase
        .from("onboarding_progress")
        .update({ completed_at: null })
        .eq("user_id", userId)
        .eq("item_id", itemId);
    }

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, done: !currentDone } : i))
    );
    setLoading(null);
    router.refresh(); // Refresh progress bar
  };

  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className={`checklist-item ${item.done ? "done" : ""} animate-fade-up`}
          style={{ animationDelay: `${idx * 0.04}s` } as React.CSSProperties}
        >
          {/* Checkbox */}
          <button
            onClick={() => toggleItem(item.id, item.done)}
            disabled={loading === item.id}
            className={`check-box ${item.done ? "checked" : ""}`}
            style={{
              opacity: loading === item.id ? 0.5 : 1,
              cursor: loading === item.id ? "wait" : "pointer",
            }}
          >
            {item.done && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: item.done ? "#A3A3A3" : "#0F0F0F",
                marginBottom: item.description ? "3px" : 0,
                textDecoration: item.done ? "line-through" : "none",
                transition: "color 0.2s ease",
              }}
            >
              {item.title}
            </div>
            {item.description && (
              <div
                style={{
                  fontSize: "12px",
                  color: item.done ? "#C4C4C4" : "#6E6E6E",
                  transition: "color 0.2s ease",
                }}
              >
                {item.description}
              </div>
            )}
          </div>

          {/* Action link */}
          {item.action_url && item.action_label && !item.done && (
            <a
              href={item.action_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid #E5E5E5",
                fontSize: "12px",
                fontWeight: 500,
                color: "#0F0F0F",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#FF4F1A";
                (e.currentTarget as HTMLElement).style.color = "#FF4F1A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#E5E5E5";
                (e.currentTarget as HTMLElement).style.color = "#0F0F0F";
              }}
            >
              {item.action_label}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          {/* Step number badge */}
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: item.done ? "rgba(34,197,94,0.12)" : "rgba(255,79,26,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
              color: item.done ? "#22C55E" : "#FF4F1A",
              flexShrink: 0,
            }}
          >
            {item.position}
          </div>
        </div>
      ))}
    </div>
  );
}
