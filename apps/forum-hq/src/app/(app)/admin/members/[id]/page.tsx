import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import MemberEditClient from "./MemberEditClient";

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: profile }, { data: adminRoles }, { data: memberships }, { data: groups }, { data: auditLogs }] =
    await Promise.all([
      admin
        .from("profiles")
        .select(`
          id, first_name, last_name, email, business_name, role_title,
          avatar_url, linkedin_url, website_url, community_visible,
          archived_at, created_at, onboarding_completed_at, onboarding_path,
          phone, address_line1, address_line2, city, state, zip, country, timezone,
          bio, industry, company_revenue_range, employee_count_range,
          birthday, spouse_partner_name, goals, referral_source
        `)
        .eq("id", id)
        .single(),
      admin.from("user_roles").select("user_id").eq("user_id", id).eq("role", "admin"),
      admin.from("forum_group_members").select("forum_group_id, role, forum_groups(id, name)").eq("user_id", id),
      admin.from("forum_groups").select("id, name").order("name"),
      admin
        .from("member_audit_log")
        .select("id, action, details, performed_by, created_at")
        .eq("member_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (!profile) notFound();

  const isAdmin = (adminRoles ?? []).length > 0;
  const memberGroups = (memberships ?? []).map((m) => {
    const g = m.forum_groups as unknown as { id: string; name: string } | null;
    return {
      id: g?.id ?? m.forum_group_id,
      name: g?.name ?? m.forum_group_id,
      role: m.role ?? "member",
    };
  });

  return (
    <MemberEditClient
      member={profile}
      isAdmin={isAdmin}
      memberGroups={memberGroups}
      allGroups={groups ?? []}
      auditLogs={auditLogs ?? []}
    />
  );
}
