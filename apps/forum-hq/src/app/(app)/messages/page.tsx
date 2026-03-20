import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getConversations, getOrCreateConversation } from "./actions";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  // Handle ?to=<userId> — create or find conversation and redirect
  if (params.to) {
    const conversationId = await getOrCreateConversation(params.to);
    redirect(`/messages/${conversationId}`);
  }

  const conversations = await getConversations();

  return (
    <div className="animate-fade-up" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#0F0F0F",
          marginBottom: 4,
        }}
      >
        Messages
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#6E6E6E",
          marginBottom: 24,
        }}
      >
        Your direct conversations with other members.
      </p>

      {conversations.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#F7F7F6",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#0F0F0F",
              marginBottom: 6,
            }}
          >
            No messages yet
          </p>
          <p style={{ fontSize: 14, color: "#6E6E6E" }}>
            Start a conversation from the{" "}
            <Link
              href="/"
              style={{ color: "#FF4F1A", textDecoration: "none", fontWeight: 600 }}
            >
              Home page
            </Link>
            .
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          {conversations.map((convo, index) => {
            const other = convo.participants[0];
            const name = other
              ? `${other.first_name} ${other.last_name}`.trim()
              : "Unknown";
            const preview = convo.lastMessage
              ? convo.lastMessage.body.length > 80
                ? convo.lastMessage.body.slice(0, 80) + "..."
                : convo.lastMessage.body
              : "No messages yet";
            const time = convo.lastMessage
              ? formatRelativeTime(convo.lastMessage.created_at)
              : "";

            return (
              <Link
                key={convo.id}
                href={`/messages/${convo.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  textDecoration: "none",
                  borderBottom:
                    index < conversations.length - 1
                      ? "1px solid #F0F0EE"
                      : "none",
                  transition: "background 0.15s ease",
                }}
              >
                {/* Avatar */}
                {other?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={other.avatar_url}
                    alt={name}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: "#F0F0EE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#6E6E6E",
                    }}
                  >
                    {getInitials(other?.first_name ?? "?", other?.last_name ?? "")}
                  </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#0F0F0F",
                      }}
                    >
                      {name}
                    </span>
                    {time && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#A3A3A3",
                          flexShrink: 0,
                          marginLeft: 12,
                        }}
                      >
                        {time}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6E6E6E",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {preview}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
