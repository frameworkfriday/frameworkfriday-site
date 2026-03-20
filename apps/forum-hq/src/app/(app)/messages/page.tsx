import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const admin = createAdminClient();

  // Fetch conversations and group members in parallel
  const [conversations, { data: memberships }] = await Promise.all([
    getConversations(),
    admin
      .from("forum_group_members")
      .select("forum_group_id")
      .eq("user_id", user.id)
      .limit(1),
  ]);

  const groupId = memberships?.[0]?.forum_group_id ?? null;

  // Fetch group members (excluding current user) for the "New conversation" section
  let groupMembers: { user_id: string; first_name: string; last_name: string; avatar_url: string | null; role_title: string | null }[] = [];
  if (groupId) {
    const { data: peers } = await admin
      .from("forum_group_members")
      .select("user_id, profiles(first_name, last_name, avatar_url, role_title)")
      .eq("forum_group_id", groupId)
      .neq("user_id", user.id);

    groupMembers = (peers ?? []).map((p) => {
      const profile = p.profiles as unknown as { first_name: string; last_name: string; avatar_url: string | null; role_title: string | null } | null;
      return {
        user_id: p.user_id,
        first_name: profile?.first_name ?? "Unknown",
        last_name: profile?.last_name ?? "",
        avatar_url: profile?.avatar_url ?? null,
        role_title: profile?.role_title ?? null,
      };
    });
  }

  // Track which members already have conversations
  const existingConvoUserIds = new Set(
    conversations.flatMap((c) => c.participants.map((p) => p.id))
  );
  const membersWithoutConvo = groupMembers.filter((m) => !existingConvoUserIds.has(m.user_id));

  return (
    <div className="animate-fade-up" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F0F0F", marginBottom: 4 }}>
        Messages
      </h1>
      <p style={{ fontSize: 14, color: "#6E6E6E", marginBottom: 24 }}>
        Direct conversations with your group members.
      </p>

      {/* Existing conversations */}
      {conversations.length > 0 && (
        <div style={{
          background: "#FFFFFF", borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          overflow: "hidden", marginBottom: 20,
        }}>
          {conversations.map((convo, index) => {
            const other = convo.participants[0];
            const name = other ? `${other.first_name} ${other.last_name}`.trim() : "Unknown";
            const preview = convo.lastMessage
              ? convo.lastMessage.body.length > 80 ? convo.lastMessage.body.slice(0, 80) + "..." : convo.lastMessage.body
              : "No messages yet";
            const time = convo.lastMessage ? formatRelativeTime(convo.lastMessage.created_at) : "";

            return (
              <Link
                key={convo.id}
                href={`/messages/${convo.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px", textDecoration: "none",
                  borderBottom: index < conversations.length - 1 ? "1px solid #F0F0EE" : "none",
                }}
              >
                {other?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={other.avatar_url} alt={name} style={{ width: 44, height: 44, borderRadius: 22, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: "#F0F0EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: "#6E6E6E" }}>
                    {getInitials(other?.first_name ?? "?", other?.last_name ?? "")}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0F0F0F" }}>{name}</span>
                    {time && <span style={{ fontSize: 12, color: "#A3A3A3", flexShrink: 0, marginLeft: 12 }}>{time}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "#6E6E6E", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Group members to start new conversations */}
      {membersWithoutConvo.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
            letterSpacing: "0.08em", color: "#6E6E6E", marginBottom: 10,
            paddingLeft: 4,
          }}>
            {conversations.length > 0 ? "Start a new conversation" : "Your group members"}
          </div>
          <div style={{
            background: "#FFFFFF", borderRadius: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}>
            {membersWithoutConvo.map((member, index) => {
              const name = `${member.first_name} ${member.last_name}`.trim();
              return (
                <Link
                  key={member.user_id}
                  href={`/messages?to=${member.user_id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 20px", textDecoration: "none",
                    borderBottom: index < membersWithoutConvo.length - 1 ? "1px solid #F0F0EE" : "none",
                  }}
                >
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatar_url} alt={name} style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: "#F0F0EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: "#6E6E6E" }}>
                      {getInitials(member.first_name, member.last_name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0F0F0F", display: "block" }}>{name}</span>
                    {member.role_title && (
                      <span style={{ fontSize: 12, color: "#A3A3A3" }}>{member.role_title}</span>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Truly empty — no members, no conversations */}
      {conversations.length === 0 && membersWithoutConvo.length === 0 && (
        <div style={{
          background: "#FFFFFF", borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F7F7F6", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0F0F0F", marginBottom: 6 }}>No messages yet</p>
          <p style={{ fontSize: 14, color: "#6E6E6E" }}>
            You&apos;ll be able to message group members once assigned to a group.
          </p>
        </div>
      )}
    </div>
  );
}
