import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function ForumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Get user's forum group(s) and members
  const { data: memberships } = await admin
    .from("forum_group_members")
    .select(`
      joined_at,
      forum_groups (id, name, description)
    `)
    .eq("user_id", user.id);

  const groupIds = (memberships ?? [])
    .map((m) => (m.forum_groups as unknown as { id: string; name: string; description: string | null } | null)?.id)
    .filter(Boolean) as string[];

  // Get peers in same groups (include self for full member list)
  const { data: peers } = groupIds.length
    ? await admin
        .from("forum_group_members")
        .select(`
          user_id,
          joined_at,
          profiles (first_name, last_name, email, business_name, role_title, avatar_url, linkedin_url, website_url)
        `)
        .in("forum_group_id", groupIds)
    : { data: [] };

  const group = (memberships?.[0]?.forum_groups as unknown as { id: string; name: string; description: string | null } | null) ?? null;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-syne)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#FF4F1A",
            marginBottom: "6px",
          }}
        >
          Your Forum
        </div>
        <h1
          style={{
            fontFamily: "var(--font-syne)",
            fontWeight: 700,
            fontSize: "28px",
            color: "#0F0F0F",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {group?.name ?? "Your Group"}
        </h1>
        {group?.description && (
          <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
            {group.description}
          </p>
        )}
      </div>

      {/* Members grid */}
      {!peers || peers.length === 0 ? (
        <div
          className="card animate-fade-up"
          style={{
            padding: "48px 28px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255,79,26,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            Your group members will appear here
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Members are added by your facilitator before Session 1.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {(peers ?? []).map((peer, idx) => {
            const p = peer.profiles as unknown as { first_name: string; last_name: string; email: string; business_name: string | null; role_title: string | null; avatar_url: string | null; linkedin_url: string | null; website_url: string | null } | null;
            if (!p) return null;
            const name = `${p.first_name} ${p.last_name}`.trim() || "Member";
            const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
            const isYou = peer.user_id === user.id;
            return (
              <div
                key={peer.user_id}
                className={`card card-hover animate-fade-up delay-${Math.min(idx + 1, 6)}`}
                style={{ padding: "20px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.avatar_url}
                      alt={name}
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(255,79,26,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "15px",
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
                          fontFamily: "var(--font-syne)",
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
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "#FF4F1A", background: "rgba(255,79,26,0.10)", padding: "1px 6px", borderRadius: "20px", flexShrink: 0 }}>
                          You
                        </span>
                      )}
                    </div>
                    {p.business_name && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6E6E6E",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.business_name}
                      </div>
                    )}
                    {p.role_title && (
                      <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "2px" }}>
                        {p.role_title}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.email}
                    </div>
                    {(p.linkedin_url || p.website_url) && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        {p.linkedin_url && (
                          <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ color: "#A3A3A3", transition: "color 0.15s" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {p.website_url && (
                          <a href={p.website_url} target="_blank" rel="noopener noreferrer" title="Website" style={{ color: "#A3A3A3", transition: "color 0.15s" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </a>
                        )}
                      </div>
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
