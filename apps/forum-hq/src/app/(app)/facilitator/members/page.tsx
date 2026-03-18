import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFacilitatorGroups, isFacilitatorOf } from "@/lib/auth/facilitator";
import Link from "next/link";

export default async function FacilitatorMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group: groupSlug } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const facilitatedGroups = await getFacilitatorGroups(user.id);
  if (facilitatedGroups.length === 0) redirect("/");

  // Auto-select if only one group
  if (!groupSlug && facilitatedGroups.length === 1) {
    redirect(`/facilitator/members?group=${facilitatedGroups[0].slug}`);
  }

  if (!groupSlug) redirect("/facilitator");

  const selectedGroup = facilitatedGroups.find((g) => g.slug === groupSlug);
  if (!selectedGroup) redirect("/facilitator");

  const hasAccess = await isFacilitatorOf(user.id, selectedGroup.id);
  if (!hasAccess) redirect("/facilitator");

  const admin = createAdminClient();

  // Get members of this group with profiles
  const { data: memberships } = await admin
    .from("forum_group_members")
    .select("user_id, role, profiles(id, first_name, last_name, email, business_name, role_title, avatar_url)")
    .eq("forum_group_id", selectedGroup.id)
    .order("joined_at");

  const members = (memberships ?? []).map((m) => {
    const p = m.profiles as unknown as {
      id: string; first_name: string; last_name: string; email: string;
      business_name: string | null; role_title: string | null; avatar_url: string | null;
    };
    return { ...p, groupRole: m.role as string };
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          <Link href={`/facilitator?group=${groupSlug}`} style={{ color: "#FF4F1A", textDecoration: "none" }}>
            Facilitator
          </Link>
          {" / "}
          {selectedGroup.name}
        </div>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Members
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          {members.length} member{members.length !== 1 ? "s" : ""} in {selectedGroup.name}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            No members yet
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Members are added by a system admin.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#E5E5E5", borderRadius: "12px", overflow: "hidden" }}>
          {members.map((member, idx) => {
            const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || member.email;
            const initial = (member.first_name || member.email || "?")[0].toUpperCase();

            return (
              <Link
                key={member.id}
                href={`/facilitator/members/${member.id}?group=${groupSlug}`}
                className="animate-fade-up"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 20px",
                  background: "#FFFFFF",
                  animationDelay: `${idx * 0.03}s`,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* Avatar */}
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={fullName}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(255,79,26,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontFamily: "var(--font-syne)",
                      fontWeight: 700,
                      color: "#FF4F1A",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "14px", color: "#0F0F0F" }}>
                      {fullName}
                    </span>
                    {member.groupRole === "facilitator" && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--font-syne)",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "20px",
                          background: "rgba(255,79,26,0.10)",
                          color: "#FF4F1A",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Facilitator
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#A3A3A3", marginTop: "1px" }}>
                    {[member.business_name, member.role_title].filter(Boolean).join(" · ") || member.email}
                  </div>
                </div>

                {/* Email */}
                <div style={{ fontSize: "12px", color: "#A3A3A3", flexShrink: 0 }}>
                  {member.email}
                </div>

                {/* Arrow */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
