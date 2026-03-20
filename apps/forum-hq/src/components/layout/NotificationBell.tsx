"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  actor?: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface Props {
  initialCount: number;
  initialNotifications: Notification[];
  markReadAction: (formData: FormData) => Promise<void>;
  markAllReadAction: () => Promise<void>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

const TYPE_ICONS: Record<string, string> = {
  new_post: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  new_comment: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  mention: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
  new_event: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
};

export default function NotificationBell({
  initialCount,
  initialNotifications,
  markReadAction,
  markAllReadAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Poll for unread count
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications/count");
        if (res.ok) {
          const { count: c } = await res.json();
          setCount(c);
        }
      } catch {
        // ignore
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read_at) {
      const fd = new FormData();
      fd.set("id", n.id);
      await markReadAction(fd);
      setCount((c) => Math.max(0, c - 1));
    }
    if (n.link) {
      router.push(n.link);
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    await markAllReadAction();
    setCount(0);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.5)",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-4px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#FF4F1A",
            color: "#FFFFFF",
            fontSize: "9px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: "0",
          width: "320px",
          background: "#FFFFFF",
          borderRadius: "14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          zIndex: 100,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #F0F0EE",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F0F0F" }}>
              Notifications
            </span>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "11px", color: "#FF4F1A", fontWeight: 600, padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {initialNotifications.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", fontSize: "13px", color: "#A3A3A3" }}>
                No notifications yet
              </div>
            ) : (
              initialNotifications.map((n) => {
                const actorName = n.actor
                  ? `${n.actor.first_name} ${n.actor.last_name}`.trim()
                  : null;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      background: n.read_at ? "transparent" : "rgba(255,79,26,0.03)",
                      borderBottom: "1px solid #F8F8F7",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Unread indicator */}
                    <div style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: n.read_at ? "transparent" : "#FF4F1A",
                      flexShrink: 0, marginTop: "6px",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#0F0F0F", marginBottom: "2px" }}>
                        {n.title}
                      </div>
                      {n.body && (
                        <div style={{
                          fontSize: "11px", color: "#6E6E6E", lineHeight: 1.4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {n.body}
                        </div>
                      )}
                      <div style={{ fontSize: "10px", color: "#A3A3A3", marginTop: "2px" }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid #F0F0EE",
            textAlign: "center",
          }}>
            <a
              href="/notifications"
              style={{
                fontSize: "12px", fontWeight: 600, color: "#FF4F1A",
                textDecoration: "none",
              }}
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
