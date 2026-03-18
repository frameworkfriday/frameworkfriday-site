import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { getFacilitatorGroups } from "@/lib/auth/facilitator";
import Link from "next/link";

export default async function FacilitatorMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string }>;
}) {
  const { id } = await params;
  const { group: groupSlug } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user is admin — redirect to admin edit page
  const admin = createAdminClient();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleRow) redirect(`/admin/members/${id}`);

  // Verify facilitator access
  const facilitatedGroups = await getFacilitatorGroups(user.id);
  if (facilitatedGroups.length === 0) redirect("/");

  const selectedGroup = groupSlug
    ? facilitatedGroups.find((g) => g.slug === groupSlug)
    : facilitatedGroups[0];
  if (!selectedGroup) redirect("/facilitator");

  // Verify member belongs to facilitator's group
  const { data: membership } = await admin
    .from("forum_group_members")
    .select("user_id, role")
    .eq("user_id", id)
    .eq("forum_group_id", selectedGroup.id)
    .maybeSingle();

  if (!membership) notFound();

  // Fetch full profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email, business_name, role_title, avatar_url, linkedin_url, website_url, community_visible, created_at, onboarding_completed_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Fetch all group memberships for this member
  const { data: allMemberships } = await admin
    .from("forum_group_members")
    .select("forum_group_id, role, forum_groups(name)")
    .eq("user_id", id);

  const memberGroups = (allMemberships ?? []).map((m) => {
    const g = m.forum_groups as unknown as { name: string } | null;
    return { name: g?.name ?? "Unknown", role: m.role as string };
  });

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unnamed";
  const initials = [profile.first_name, profile.last_name]
    .map((n) => n?.[0] ?? "")
    .join("")
    .toUpperCase() || profile.email[0]?.toUpperCase() || "?";
  const isFacilitator = membership.role === "facilitator";

  const valueStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#0F0F0F",
    fontWeight: 500,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6E6E6E",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "4px",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0F0F0F",
    marginBottom: "14px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <Link
          href={`/facilitator/members?group=${groupSlug ?? selectedGroup.slug}`}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#A3A3A3",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "12px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Members
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={fullName}
              style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(255,79,26,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 700, color: "#FF4F1A", flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
                {fullName}
              </h1>
              {isFacilitator && (
                <span style={{
                  display: "inline-flex", alignItems: "center", padding: "2px 10px",
                  borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                  background: "rgba(255,79,26,0.1)", color: "#FF4F1A",
                }}>
                  Facilitator
                </span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "#6E6E6E", marginTop: "2px" }}>
              {profile.email}
              {profile.business_name && <span style={{ color: "#A3A3A3" }}> · {profile.business_name}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="session-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>
        {/* Left: Profile info */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={sectionTitle}>Profile</div>

          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <div style={labelStyle}>First Name</div>
              <div style={valueStyle}>{profile.first_name || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>Last Name</div>
              <div style={valueStyle}>{profile.last_name || "—"}</div>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={labelStyle}>Email</div>
            <div style={valueStyle}>
              <a href={`mailto:${profile.email}`} style={{ color: "#0F0F0F", textDecoration: "none" }}>
                {profile.email}
              </a>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={labelStyle}>Business Name</div>
            <div style={valueStyle}>{profile.business_name || "—"}</div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={labelStyle}>Role / Title</div>
            <div style={valueStyle}>{profile.role_title || "—"}</div>
          </div>

          {/* Social links */}
          {(profile.linkedin_url || profile.website_url) && (
            <div style={{ borderTop: "1px solid #EEEEED", paddingTop: "18px" }}>
              <div style={{ ...sectionTitle, marginBottom: "12px" }}>Links</div>
              <div style={{ display: "flex", gap: "16px" }}>
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "#0077B5", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "#FF4F1A", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Info cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Directory */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Directory</div>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "13px", fontWeight: 600,
              color: profile.community_visible ? "#22C55E" : "#A3A3A3",
            }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: profile.community_visible ? "#22C55E" : "#D4D4D4",
              }} />
              {profile.community_visible ? "Visible in community directory" : "Hidden from community directory"}
            </div>
          </div>

          {/* Groups */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Groups</div>
            {memberGroups.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#A3A3A3" }}>Not in any group.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {memberGroups.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", background: "#FAFAF9", borderRadius: "8px",
                      border: "1px solid #F0F0EE",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F0F0F" }}>{g.name}</span>
                    {g.role === "facilitator" && (
                      <span style={{
                        fontSize: "10px", fontWeight: 600, padding: "1px 8px",
                        borderRadius: "20px", background: "rgba(255,79,26,0.1)", color: "#FF4F1A",
                      }}>
                        Facilitator
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account info */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={sectionTitle}>Account Info</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6E6E6E" }}>Joined</span>
                <span style={{ color: "#0F0F0F", fontWeight: 500 }}>
                  {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6E6E6E" }}>Onboarding</span>
                <span style={{ color: profile.onboarding_completed_at ? "#22C55E" : "#A3A3A3", fontWeight: 500 }}>
                  {profile.onboarding_completed_at
                    ? `Completed ${new Date(profile.onboarding_completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "Not completed"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
