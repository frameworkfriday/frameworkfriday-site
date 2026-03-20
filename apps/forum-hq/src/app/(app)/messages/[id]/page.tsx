import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMessages } from "../actions";
import ChatInput from "./ChatInput";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Verify user is a participant and get other participant info
  const { data: participants } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);

  const isParticipant = (participants ?? []).some((p) => p.user_id === user.id);
  if (!isParticipant) redirect("/messages");

  const otherUserId = (participants ?? []).find((p) => p.user_id !== user.id)?.user_id;

  // Fetch other participant's profile and user's group color
  const { data: otherProfile } = otherUserId
    ? await admin
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("id", otherUserId)
        .single()
    : { data: null };

  // Get the current user's group badge color for message bubbles
  const { data: membership } = await admin
    .from("forum_group_members")
    .select("forum_groups(badge_color)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const groupColor =
    (membership?.forum_groups as unknown as { badge_color: string | null } | null)
      ?.badge_color ?? "#FF4F1A";

  const messages = await getMessages(conversationId);

  const otherName = otherProfile
    ? `${otherProfile.first_name} ${otherProfile.last_name}`.trim()
    : "Unknown";

  return (
    <div
      className="animate-fade-up"
      style={{
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 120px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <Link
          href="/messages"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#FFFFFF",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            textDecoration: "none",
            color: "#0F0F0F",
            fontSize: 18,
            flexShrink: 0,
            transition: "background 0.15s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        {otherProfile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={otherProfile.avatar_url}
            alt={otherName}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "#F0F0EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "#6E6E6E",
            }}
          >
            {getInitials(
              otherProfile?.first_name ?? "?",
              otherProfile?.last_name ?? ""
            )}
          </div>
        )}
        <div>
          <h1
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0F0F0F",
              margin: 0,
            }}
          >
            {otherName}
          </h1>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: 14,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <p style={{ fontSize: 14, color: "#A3A3A3", textAlign: "center" }}>
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender_id === user.id;
            // Show avatar if it's the first message or the sender changed
            const showAvatar =
              index === 0 || messages[index - 1].sender_id !== msg.sender_id;
            // Show timestamp if it's the last message from this sender in a row
            const showTime =
              index === messages.length - 1 ||
              messages[index + 1].sender_id !== msg.sender_id;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isOwn ? "flex-end" : "flex-start",
                  marginTop: showAvatar && index > 0 ? 12 : 0,
                }}
              >
                {/* Avatar + name for other person's messages */}
                {!isOwn && showAvatar && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    {msg.sender.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.sender.avatar_url}
                        alt={`${msg.sender.first_name} ${msg.sender.last_name}`}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: "#F0F0EE",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#6E6E6E",
                        }}
                      >
                        {getInitials(msg.sender.first_name, msg.sender.last_name)}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#6E6E6E",
                      }}
                    >
                      {msg.sender.first_name}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: isOwn
                      ? `${groupColor}14`
                      : "#F0F0EE",
                    color: "#0F0F0F",
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    marginLeft: !isOwn ? 32 : 0,
                  }}
                >
                  {msg.body}
                </div>

                {/* Timestamp */}
                {showTime && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#A3A3A3",
                      marginTop: 4,
                      marginLeft: !isOwn ? 32 : 0,
                    }}
                  >
                    {formatMessageTime(msg.created_at)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Chat input */}
      <ChatInput conversationId={conversationId} currentUserId={user.id} />
    </div>
  );
}
