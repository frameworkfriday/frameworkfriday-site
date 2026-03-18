import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import MemberEditClient from "./MemberEditClient";

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: profile }, { data: adminRoles }, { data: memberships }, { data: groups }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, first_name, last_name, email, business_name, role_title, avatar_url, linkedin_url, website_url, community_visible, archived_at, created_at, onboarding_completed_at")
        .eq("id", id)
        .single(),
      admin.from("user_roles").select("user_id").eq("user_id", id).eq("role", "admin"),
      admin.from("forum_group_members").select("forum_group_id, role, forum_groups(id, name)").eq("user_id", id),
      admin.from("forum_groups").select("id, name").order("name"),
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
    />
  );
}
