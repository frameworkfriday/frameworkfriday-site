import { createAdminClient } from "@/lib/supabase/admin";
import AddMemberForm from "./AddMemberForm";
import MembersListClient from "./MembersListClient";

export default async function AdminMembersPage() {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: adminRoles }, { data: facilitatorRoles }, { data: memberships }, { data: groups }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, first_name, last_name, email, business_name, role_title, industry, archived_at, created_at, onboarding_path, phone, city, state")
        .order("last_name"),
      admin.from("user_roles").select("user_id").eq("role", "admin"),
      admin.from("forum_group_members").select("user_id").eq("role", "facilitator"),
      admin.from("forum_group_members").select("user_id, forum_group_id"),
      admin.from("forum_groups").select("id, name").order("name"),
    ]);

  const adminIds = (adminRoles ?? []).map((r) => r.user_id);
  const facilitatorIds = [...new Set((facilitatorRoles ?? []).map((r) => r.user_id))];
  const allGroups = groups ?? [];
  const groupMap = Object.fromEntries(allGroups.map((g) => [g.id, g.name]));

  const userGroups: Record<string, { id: string; name: string }[]> = {};
  for (const m of memberships ?? []) {
    if (!userGroups[m.user_id]) userGroups[m.user_id] = [];
    userGroups[m.user_id].push({ id: m.forum_group_id, name: groupMap[m.forum_group_id] ?? m.forum_group_id });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
          Admin
        </div>
        <h1 style={{ fontWeight: 800, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
          Members
        </h1>
        <p style={{ fontSize: "14px", color: "#6E6E6E", margin: "6px 0 0" }}>
          Search, filter, and manage all registered members.
        </p>
      </div>

      {/* Add Member Form */}
      <AddMemberForm groups={allGroups} />

      {/* Members list with search/filter/pagination */}
      <MembersListClient
        members={profiles ?? []}
        adminIds={adminIds}
        facilitatorIds={facilitatorIds}
        userGroups={userGroups}
        allGroups={allGroups}
      />
    </div>
  );
}
