import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: profileId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch profile + group membership in parallel
  const [{ data: profile }, { data: membership }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, email, business_name, role_title, avatar_url, linkedin_url, website_url, bio, industry, company_revenue_range, employee_count_range, city, state, country")
      .eq("id", profileId)
      .eq("community_visible", true)
      .single(),
    admin
      .from("forum_group_members")
      .select("joined_at, forum_groups(name, badge_color)")
      .eq("user_id", profileId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile) redirect("/directory");

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Member";
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const isYou = profile.id === user.id;

  const group = membership?.forum_groups as unknown as { name: string; badge_color: string | null } | null;
  const groupColor = group?.badge_color || "#FF4F1A";
  const joinedAt = membership?.joined_at
    ? new Date(membership.joined_at as string).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");

  return (
    <div className="animate-fade-up" style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Back link */}
      <Link
        href="/directory"
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontSize: "13px", color: "#6E6E6E", textDecoration: "none",
          marginBottom: "20px", fontWeight: 500,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Directory
      </Link>

      {/* Profile header card */}
      <div style={{
        background: "#FFFFFF", borderRadius: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
        overflow: "hidden", marginBottom: "16px",
      }}>
        {/* Color accent */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${groupColor}, ${groupColor}66)` }} />

        <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
          {/* Avatar */}
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={name}
              style={{
                width: "80px", height: "80px", borderRadius: "50%",
                objectFit: "cover", margin: "0 auto 16px",
                border: `3px solid ${groupColor}20`,
                display: "block",
              }}
            />
          ) : (
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: `${groupColor}12`, border: `3px solid ${groupColor}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", fontWeight: 700, color: groupColor,
              margin: "0 auto 16px",
            }}>
              {initials}
            </div>
          )}

          {/* Name + badges */}
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0F0F0F", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            {name}
            {isYou && (
              <span style={{
                fontSize: "11px", fontWeight: 600, color: groupColor,
                background: `${groupColor}12`, padding: "2px 8px", borderRadius: "10px",
                marginLeft: "8px", verticalAlign: "middle",
              }}>
                You
              </span>
            )}
          </h1>

          {/* Role + Business */}
          {profile.role_title && (
            <div style={{ fontSize: "14px", color: "#6E6E6E", marginBottom: "2px" }}>
              {profile.role_title}
            </div>
          )}
          {profile.business_name && (
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F0F0F" }}>
              {profile.business_name}
            </div>
          )}

          {/* Group + Join date */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
            {group && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: groupColor }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#6E6E6E" }}>{group.name}</span>
              </div>
            )}
            {joinedAt && (
              <span style={{ fontSize: "12px", color: "#A3A3A3" }}>
                Member since {joinedAt}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
            {!isYou && (
              <Link
                href={`/messages?to=${profile.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "9px 20px", borderRadius: "10px",
                  background: "#FF4F1A", color: "#FFFFFF",
                  fontSize: "13px", fontWeight: 600, textDecoration: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Message
              </Link>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "9px 20px", borderRadius: "10px",
                  border: "1px solid #EAEAE8", background: "#FFFFFF",
                  fontSize: "13px", fontWeight: 600, color: "#0F0F0F", textDecoration: "none",
                }}
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
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "9px 20px", borderRadius: "10px",
                  border: "1px solid #EAEAE8", background: "#FFFFFF",
                  fontSize: "13px", fontWeight: 600, color: "#0F0F0F", textDecoration: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* About section */}
      {(profile.bio || profile.industry || location) && (
        <div style={{
          background: "#FFFFFF", borderRadius: "14px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          padding: "24px", marginBottom: "16px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6E6E6E", marginBottom: "14px" }}>
            About
          </div>

          {profile.bio && (
            <p style={{ fontSize: "14px", color: "#0F0F0F", lineHeight: 1.6, margin: "0 0 16px", whiteSpace: "pre-wrap" }}>
              {profile.bio}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {profile.industry && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Industry</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F0F0F" }}>{profile.industry}</div>
              </div>
            )}
            {location && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Location</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F0F0F" }}>{location}</div>
              </div>
            )}
            {profile.company_revenue_range && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Revenue</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F0F0F" }}>{profile.company_revenue_range}</div>
              </div>
            )}
            {profile.employee_count_range && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Team Size</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F0F0F" }}>{profile.employee_count_range}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact info — only visible to self */}
      {isYou && (
        <div style={{
          background: "#FFFFFF", borderRadius: "14px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
          padding: "24px", marginBottom: "16px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6E6E6E", marginBottom: "14px" }}>
            Your Contact Info
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            {profile.email}
          </div>
          <Link href="/profile" style={{ fontSize: "13px", color: "#FF4F1A", fontWeight: 600, textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
            Edit your profile →
          </Link>
        </div>
      )}
    </div>
  );
}
