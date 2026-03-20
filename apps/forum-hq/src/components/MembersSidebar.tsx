"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface MemberProfile {
  first_name: string;
  last_name: string;
  email: string;
  business_name: string | null;
  role_title: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}

interface Member {
  user_id: string;
  profile: MemberProfile;
}

interface MembersSidebarProps {
  members: Member[];
  currentUserId: string;
  groupId: string;
  groupColor: string;
}

export default function MembersSidebar({
  members,
  currentUserId,
  groupId,
  groupColor,
}: MembersSidebarProps) {
  const router = useRouter();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channelName = `presence:group-${groupId}`;
    let channel: RealtimeChannel | null = null;

    channel = supabase.channel(channelName, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel!.presenceState();
        const ids = new Set<string>(Object.keys(state));
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel!.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [groupId, currentUserId]);

  const onlineCount = onlineIds.size;

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aOnline = onlineIds.has(a.user_id) ? 1 : 0;
      const bOnline = onlineIds.has(b.user_id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      // Current user first within their group
      if (a.user_id === currentUserId) return -1;
      if (b.user_id === currentUserId) return 1;
      const aName = `${a.profile.first_name} ${a.profile.last_name}`;
      const bName = `${b.profile.first_name} ${b.profile.last_name}`;
      return aName.localeCompare(bName);
    });
  }, [members, onlineIds, currentUserId]);

  const handleMessage = useCallback(
    (userId: string) => {
      router.push(`/messages?to=${userId}`);
    },
    [router]
  );

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        padding: "20px",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#6E6E6E",
          }}
        >
          Forum Members
        </span>
        {onlineCount > 0 && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#22C55E",
            }}
          >
            {onlineCount} online
          </span>
        )}
      </div>

      {/* Member list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sortedMembers.map((member, index) => {
          const isCurrentUser = member.user_id === currentUserId;
          const isOnline = onlineIds.has(member.user_id);
          const initials = `${member.profile.first_name?.[0] ?? ""}${member.profile.last_name?.[0] ?? ""}`.toUpperCase();
          const fullName = `${member.profile.first_name} ${member.profile.last_name}`;

          return (
            <div
              key={member.user_id}
              className={`animate-fade-up delay-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                borderRadius: "10px",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F9F9F9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Avatar with presence dot */}
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: "36px",
                  height: "36px",
                }}
              >
                {member.profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.profile.avatar_url}
                    alt={fullName}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: `${groupColor}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "13px",
                      color: groupColor,
                    }}
                  >
                    {initials}
                  </div>
                )}
                {/* Presence dot */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "0px",
                    right: "0px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: isOnline ? "#22C55E" : "#D1D5DB",
                    border: "1.5px solid #FFFFFF",
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fullName}
                  </span>
                  {isCurrentUser && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: groupColor,
                        background: `${groupColor}14`,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    >
                      You
                    </span>
                  )}
                </div>
                {member.profile.role_title && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#8C8C8C",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: "1px",
                    }}
                  >
                    {member.profile.role_title}
                  </div>
                )}
                {/* Links */}
                {(member.profile.linkedin_url || member.profile.website_url) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "3px",
                    }}
                  >
                    {member.profile.linkedin_url && (
                      <a
                        href={member.profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#A3A3A3",
                          transition: "color 0.15s ease",
                          lineHeight: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#0A66C2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#A3A3A3";
                        }}
                        title="LinkedIn"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                    {member.profile.website_url && (
                      <a
                        href={member.profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#A3A3A3",
                          transition: "color 0.15s ease",
                          lineHeight: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#1A1A1A";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#A3A3A3";
                        }}
                        title="Website"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Message button (not for current user) */}
              {!isCurrentUser && (
                <button
                  onClick={() => handleMessage(member.user_id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "6px",
                    color: "#A3A3A3",
                    transition: "all 0.15s ease",
                    lineHeight: 0,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F0F0F0";
                    e.currentTarget.style.color = "#1A1A1A";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#A3A3A3";
                  }}
                  title={`Message ${member.profile.first_name}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
