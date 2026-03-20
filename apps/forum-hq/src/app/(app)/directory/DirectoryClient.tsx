"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  role_title: string | null;
  email: string;
  avatar_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}

export default function DirectoryClient({ profiles, currentUserId, userGroups }: { profiles: Profile[]; currentUserId: string; userGroups: Record<string, { name: string; color: string; joinedAt: string }> }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = profiles.filter((p) => {
    const q = query.toLowerCase();
    if (!q) return true;
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
    const biz = (p.business_name ?? "").toLowerCase();
    const groupName = (userGroups[p.id]?.name ?? "").toLowerCase();
    return name.includes(q) || biz.includes(q) || groupName.includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
            Community
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
            Directory
          </h1>
          <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
            {profiles.length} member{profiles.length !== 1 ? "s" : ""} in the Framework Friday community
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A3A3A3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or business..."
            style={{
              paddingLeft: "32px",
              paddingRight: "12px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "13px",
              border: "1px solid #E5E5E5",
              borderRadius: "10px",
              fontFamily: "inherit",
              color: "#0F0F0F",
              background: "#FFFFFF",
              outline: "none",
              width: "240px",
            }}
          />
        </div>
      </div>

      {/* Empty state */}
      {profiles.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            No members in the directory yet
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Members who opt into community visibility will appear here.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#6E6E6E" }}>No members match &ldquo;{query}&rdquo;</div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {filtered.map((profile, idx) => {
            const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Member";
            const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
            const isYou = profile.id === currentUserId;

            return (
              <div
                key={profile.id}
                className={`card card-hover animate-fade-up delay-${Math.min(idx + 1, 6)}`}
                style={{ padding: "18px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={name}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(255,79,26,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#FF4F1A",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#0F0F0F",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </div>
                      {isYou && (
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "#FF4F1A", background: "rgba(255,79,26,0.10)", padding: "1px 6px", borderRadius: "10px" }}>
                          You
                        </span>
                      )}
                    </div>
                    {profile.business_name && (
                      <div style={{ fontSize: "12px", color: "#6E6E6E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {profile.business_name}
                      </div>
                    )}
                    {profile.role_title && (
                      <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "2px" }}>
                        {profile.role_title}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profile.email}
                    </div>

                    {/* Forum group + join date */}
                    {userGroups[profile.id] && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <div style={{
                            width: "6px", height: "6px", borderRadius: "50%",
                            background: userGroups[profile.id].color,
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#6E6E6E" }}>
                            {userGroups[profile.id].name}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#A3A3A3" }}>
                          Joined {new Date(userGroups[profile.id].joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}

                    {/* Social links */}
                    {(profile.linkedin_url || profile.website_url) && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                        {profile.linkedin_url && (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="LinkedIn"
                            style={{ color: "#A3A3A3", transition: "color 0.15s" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0077B5")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#A3A3A3")}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {profile.website_url && (
                          <a
                            href={profile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Website"
                            style={{ color: "#A3A3A3", transition: "color 0.15s" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#FF4F1A")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#A3A3A3")}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Message button */}
                    {!isYou && (
                      <button
                        onClick={() => router.push(`/messages?to=${profile.id}`)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          marginTop: "10px", padding: "6px 14px", borderRadius: "8px",
                          border: "1px solid #EAEAE8", background: "#FAFAF8",
                          fontSize: "12px", fontWeight: 600, color: "#0F0F0F",
                          cursor: "pointer", transition: "all 0.15s ease",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FF4F1A";
                          e.currentTarget.style.color = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#FF4F1A";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#FAFAF8";
                          e.currentTarget.style.color = "#0F0F0F";
                          e.currentTarget.style.borderColor = "#EAEAE8";
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Message
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
