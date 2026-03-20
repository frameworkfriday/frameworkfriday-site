import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import DirectoryClient from "./DirectoryClient";

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all community-visible profiles and their forum group memberships
  const [{ data: profiles }, { data: groupMemberships }, { data: groups }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, business_name, role_title, email, avatar_url, linkedin_url, website_url")
      .eq("community_visible", true)
      .order("last_name"),
    admin
      .from("forum_group_members")
      .select("user_id, forum_group_id, joined_at"),
    admin
      .from("forum_groups")
      .select("id, name, badge_color"),
  ]);

  // Build a map: user_id → { groupName, badgeColor }
  const groupMap: Record<string, { id: string; name: string; badge_color: string | null }> = {};
  for (const g of groups ?? []) {
    groupMap[g.id] = g;
  }
  const userGroupMap: Record<string, { name: string; color: string; joinedAt: string }> = {};
  for (const m of groupMemberships ?? []) {
    const g = groupMap[m.forum_group_id];
    if (g) {
      userGroupMap[m.user_id] = { name: g.name, color: g.badge_color || "#6E6E6E", joinedAt: (m as { joined_at: string }).joined_at };
    }
  }

  return <DirectoryClient profiles={profiles ?? []} currentUserId={user.id} userGroups={userGroupMap} />;
}
