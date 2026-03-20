"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

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
  notifications: Notification[];
  markReadAction: (formData: FormData) => Promise<void>;
  markAllReadAction: () => Promise<void>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_LABELS: Record<string, string> = {
  new_post: "New Post",
  new_comment: "Comment",
  mention: "Mention",
  new_event: "New Event",
};

const TYPE_COLORS: Record<string, string> = {
  new_post: "#FF4F1A",
  new_comment: "#3B82F6",
  mention: "#8B5CF6",
  new_event: "#10B981",
};

export default function NotificationsList({ notifications, markReadAction, markAllReadAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleClick = (n: Notification) => {
    if (!n.read_at) {
      const fd = new FormData();
      fd.set("id", n.id);
      startTransition(async () => {
        await markReadAction(fd);
      });
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllReadAction();
    });
  };

  return (
    <div>
      {unreadCount > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          <button
            onClick={handleMarkAll}
            disabled={isPending}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              color: "#FF4F1A",
              padding: 0,
              opacity: isPending ? 0.5 : 1,
            }}
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div style={{
          padding: "48px 24px",
          textAlign: "center",
          background: "white",
          borderRadius: "14px",
          border: "1px solid #E8E8E6",
        }}>
          <div style={{ fontSize: "14px", color: "#A3A3A3" }}>No notifications yet</div>
          <div style={{ fontSize: "12px", color: "#CCCCCC", marginTop: "4px" }}>
            You&apos;ll see activity from your Forum community here.
          </div>
        </div>
      ) : (
        <div style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #E8E8E6",
          overflow: "hidden",
        }}>
          {notifications.map((n) => {
            const actorName = n.actor
              ? `${n.actor.first_name} ${n.actor.last_name}`.trim()
              : null;

            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: "14px 18px",
                  cursor: n.link ? "pointer" : "default",
                  background: n.read_at ? "transparent" : "rgba(255,79,26,0.02)",
                  borderBottom: "1px solid #F0F0EE",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (n.link) (e.currentTarget as HTMLElement).style.background = n.read_at ? "#FAFAF9" : "rgba(255,79,26,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.read_at ? "transparent" : "rgba(255,79,26,0.02)"; }}
              >
                {/* Unread dot */}
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: n.read_at ? "transparent" : "#FF4F1A",
                  flexShrink: 0,
                  marginTop: "6px",
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: TYPE_COLORS[n.type] || "#6E6E6E",
                    }}>
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    <span style={{ fontSize: "11px", color: "#A3A3A3" }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>

                  <div style={{
                    fontSize: "13px",
                    fontWeight: n.read_at ? 500 : 600,
                    color: "#0F0F0F",
                    marginBottom: "2px",
                  }}>
                    {n.title}
                  </div>

                  {(n.body || actorName) && (
                    <div style={{
                      fontSize: "12px",
                      color: "#6E6E6E",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {actorName && <span style={{ fontWeight: 500 }}>{actorName}: </span>}
                      {n.body}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
