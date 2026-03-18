"use client";

import { useState, useMemo } from "react";
import EmailBlastForm from "../announcements/EmailBlastForm";
import { sendEmailBlast, adminTogglePin, deleteAnyPost } from "../announcements/actions";

/* ─── Types ─── */

interface Post {
  id: string;
  title: string | null;
  body: string;
  post_type: string;
  is_pinned: boolean;
  is_global: boolean;
  created_at: string;
  author_id: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
  post_audiences: { forum_group_id: string }[];
}

interface Group {
  id: string;
  name: string;
}

interface Props {
  emailBlasts: Post[];
  announcements: Post[];
  groups: Group[];
  groupMap: Record<string, string>;
  groupMemberCounts: Record<string, number>;
  totalMembers: number;
}

/* ─── Helpers ─── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " \u00B7 " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function stripEmailPrefix(title: string | null): string {
  if (!title) return "(No subject)";
  return title.replace(/^\[Email\]\s*/, "");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "\u2026";
}

function authorName(profiles: Post["profiles"]): string {
  if (!profiles) return "Unknown";
  return `${profiles.first_name} ${profiles.last_name}`.trim() || "Unknown";
}

/* ─── Styles ─── */

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: "0",
  borderBottom: "1px solid #E5E5E5",
  marginBottom: "24px",
};

const tabBaseStyle: React.CSSProperties = {
  padding: "12px 20px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#6E6E6E",
  background: "none",
  border: "none",
  borderBottom: "2px solid transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "color 0.15s, border-color 0.15s",
  fontFamily: "inherit",
};

const tabActiveOverride: React.CSSProperties = {
  color: "#0F0F0F",
  fontWeight: 700,
  borderBottom: "2px solid #FF4F1A",
};

const countBadgeStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  background: "#F7F7F6",
  color: "#6E6E6E",
  borderRadius: "10px",
  padding: "1px 7px",
  lineHeight: "16px",
};

const countBadgeActiveStyle: React.CSSProperties = {
  ...countBadgeStyle,
  background: "rgba(255, 79, 26, 0.08)",
  color: "#FF4F1A",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: "13px",
  border: "1px solid #E5E5E5",
  borderRadius: "8px",
  fontFamily: "inherit",
  color: "#0F0F0F",
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box" as const,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A3A3A3' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: "30px",
  cursor: "pointer",
};

const audienceBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: "10px",
  background: "rgba(255, 79, 26, 0.07)",
  color: "#FF4F1A",
};

const pinBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "11px",
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: "10px",
  background: "rgba(255, 79, 26, 0.07)",
  color: "#FF4F1A",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E5E5",
  borderRadius: "6px",
  cursor: "pointer",
  padding: "5px 12px",
  fontSize: "11px",
  fontWeight: 600,
  color: "#6E6E6E",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const deleteButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  color: "#A3A3A3",
};

/* ─── Component ─── */

export default function CommunicationsHub({
  emailBlasts,
  announcements,
  groups,
  groupMap,
  groupMemberCounts,
  totalMembers,
}: Props) {
  const [activeTab, setActiveTab] = useState("compose");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabs = [
    { id: "compose", label: "Compose", count: null },
    { id: "sent", label: "Sent", count: emailBlasts.length },
    { id: "announcements", label: "Announcements", count: announcements.length },
  ];

  /* ─── Filtered + sorted sent emails ─── */

  const filteredBlasts = useMemo(() => {
    let result = [...emailBlasts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        stripEmailPrefix(p.title).toLowerCase().includes(q)
      );
    }

    if (groupFilter) {
      result = result.filter((p) => {
        if (groupFilter === "__global") return p.is_global;
        return p.post_audiences.some((a) => a.forum_group_id === groupFilter);
      });
    }

    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

    return result;
  }, [emailBlasts, search, groupFilter, sortOrder]);

  /* ─── Total recipients estimate ─── */

  const totalRecipients = useMemo(() => {
    let sum = 0;
    for (const blast of emailBlasts) {
      if (blast.is_global) {
        sum += totalMembers;
      } else {
        const groupIds = new Set(blast.post_audiences.map((a) => a.forum_group_id));
        for (const gid of groupIds) {
          sum += groupMemberCounts[gid] || 0;
        }
      }
    }
    return sum;
  }, [emailBlasts, totalMembers, groupMemberCounts]);

  /* ─── Audience label for a blast ─── */

  function audienceLabel(post: Post): string {
    if (post.is_global) return `All Members (${totalMembers})`;
    const names = post.post_audiences
      .map((a) => {
        const name = groupMap[a.forum_group_id] || "Unknown Group";
        const count = groupMemberCounts[a.forum_group_id];
        return count ? `${name} (${count})` : name;
      });
    return names.length > 0 ? names.join(", ") : "No audience";
  }

  /* ─── Tab icons ─── */

  const composeIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  const sentIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );

  const announcementIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );

  /* ─── Render ─── */

  return (
    <div>
      {/* Tab bar */}
      <div style={tabBarStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...tabBaseStyle,
              ...(activeTab === tab.id ? tabActiveOverride : {}),
            }}
          >
            {tab.id === "compose" && composeIcon}
            {tab.id === "sent" && sentIcon}
            {tab.id === "announcements" && announcementIcon}
            {tab.label}
            {tab.count !== null && (
              <span style={activeTab === tab.id ? countBadgeActiveStyle : countBadgeStyle}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Compose Tab ─── */}
      {activeTab === "compose" && (
        <div>
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#6E6E6E",
                padding: "8px 12px",
                background: "#F7F7F6",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6E6E6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              You will receive a copy of all emails you send.
            </div>
          </div>
          <EmailBlastForm groups={groups} sendAction={sendEmailBlast} defaultExpanded />
        </div>
      )}

      {/* ─── Sent Tab ─── */}
      {activeTab === "sent" && (
        <div>
          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "12px 16px",
              background: "#F7F7F6",
              borderRadius: "10px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#0F0F0F",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {emailBlasts.length} email{emailBlasts.length !== 1 ? "s" : ""} sent
            </div>
            <span style={{ color: "#E5E5E5" }}>\u00B7</span>
            <div style={{ color: "#6E6E6E", fontWeight: 500 }}>
              {totalRecipients.toLocaleString()} total recipients
            </div>
          </div>

          {/* Filter row */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Search by subject\u2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, flex: "1 1 200px", minWidth: "180px" }}
            />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              style={{ ...selectStyle, flex: "0 0 auto", minWidth: "160px" }}
            >
              <option value="">All Audiences</option>
              <option value="__global">All Members</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              style={{ ...selectStyle, flex: "0 0 auto", minWidth: "140px" }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Sent email list */}
          {filteredBlasts.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "48px 28px",
                textAlign: "center",
              }}
            >
              {emailBlasts.length === 0 ? (
                <>
                  <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>
                    \u2709
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#0F0F0F",
                      marginBottom: "6px",
                    }}
                  >
                    No emails sent yet
                  </div>
                  <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
                    Use the Compose tab to send your first email blast.
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#0F0F0F",
                      marginBottom: "6px",
                    }}
                  >
                    No matching emails
                  </div>
                  <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
                    Try adjusting your search or filter criteria.
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredBlasts.map((blast, idx) => {
                const isExpanded = expandedId === blast.id;
                return (
                  <div
                    key={blast.id}
                    className="card card-hover"
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      animationDelay: `${idx * 0.03}s`,
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : blast.id)}
                  >
                    {/* Header row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#0F0F0F",
                            marginBottom: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {stripEmailPrefix(blast.title)}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                            fontSize: "12px",
                            color: "#A3A3A3",
                          }}
                        >
                          <span>{formatDate(blast.created_at)}</span>
                          <span>\u00B7</span>
                          <span style={{ color: "#6E6E6E" }}>
                            {authorName(blast.profiles)}
                          </span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <span style={audienceBadgeStyle}>
                          {audienceLabel(blast)}
                        </span>
                      </div>
                    </div>

                    {/* Preview / expanded body */}
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6E6E6E",
                        lineHeight: 1.5,
                        marginTop: "8px",
                        whiteSpace: isExpanded ? "pre-wrap" : "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {isExpanded ? blast.body : truncate(blast.body, 120)}
                    </div>

                    {/* Expand indicator */}
                    {!isExpanded && blast.body.length > 120 && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#FF4F1A",
                          fontWeight: 600,
                          marginTop: "6px",
                        }}
                      >
                        Click to expand
                      </div>
                    )}
                    {isExpanded && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#A3A3A3",
                          fontWeight: 600,
                          marginTop: "8px",
                        }}
                      >
                        Click to collapse
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Announcements Tab ─── */}
      {activeTab === "announcements" && (
        <div>
          {announcements.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "48px 28px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>
                \uD83D\uDD14
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "#0F0F0F",
                  marginBottom: "6px",
                }}
              >
                No announcements yet
              </div>
              <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
                Announcements posted outside of email blasts will appear here.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {announcements.map((post, idx) => (
                <div
                  key={post.id}
                  className="card"
                  style={{
                    padding: "16px 20px",
                    position: "relative",
                    animationDelay: `${idx * 0.03}s`,
                  }}
                >
                  {/* Badges row */}
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                    {post.is_pinned && (
                      <span style={pinBadgeStyle}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF4F1A" stroke="none">
                          <path d="M16 2L14.5 3.5 18.5 7.5 20 6c.8-.8.8-2 0-2.8L16.8 2c-.8-.8-2-.8-2.8 0zM2 22l5.5-2.5 10-10-4-4-10 10z" />
                        </svg>
                        Pinned
                      </span>
                    )}
                    {post.is_global && (
                      <span
                        style={{
                          ...audienceBadgeStyle,
                          background: "rgba(15, 15, 15, 0.05)",
                          color: "#6E6E6E",
                        }}
                      >
                        All Members
                      </span>
                    )}
                    {!post.is_global && post.post_audiences.length > 0 && (
                      post.post_audiences.map((a) => (
                        <span
                          key={a.forum_group_id}
                          style={{
                            ...audienceBadgeStyle,
                            background: "rgba(15, 15, 15, 0.05)",
                            color: "#6E6E6E",
                          }}
                        >
                          {groupMap[a.forum_group_id] || "Group"}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Title + body */}
                  {post.title && (
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0F0F0F",
                        marginBottom: "4px",
                      }}
                    >
                      {post.title}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6E6E6E",
                      lineHeight: 1.5,
                      marginBottom: "10px",
                      wordBreak: "break-word",
                    }}
                  >
                    {truncate(post.body, 200)}
                  </div>

                  {/* Footer: author + date + actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#A3A3A3" }}>
                      {authorName(post.profiles)} \u00B7 {formatDate(post.created_at)}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <form action={adminTogglePin}>
                        <input type="hidden" name="id" value={post.id} />
                        <input
                          type="hidden"
                          name="pinned"
                          value={post.is_pinned ? "false" : "true"}
                        />
                        <button type="submit" style={smallButtonStyle}>
                          {post.is_pinned ? "Unpin" : "Pin"}
                        </button>
                      </form>
                      <form
                        action={deleteAnyPost}
                        onSubmit={(e) => {
                          if (!confirm("Delete this announcement? This cannot be undone.")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={post.id} />
                        <button type="submit" style={deleteButtonStyle}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
