import { createAdminClient } from "@/lib/supabase/admin";

/** Check if user is facilitator of a specific group (or admin) */
export async function isFacilitatorOf(userId: string, groupId: string): Promise<boolean> {
  const admin = createAdminClient();

  // Admins have implicit facilitator access to all groups
  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (adminRole) return true;

  // Check facilitator role in specific group
  const { data: membership } = await admin
    .from("forum_group_members")
    .select("role")
    .eq("user_id", userId)
    .eq("forum_group_id", groupId)
    .eq("role", "facilitator")
    .maybeSingle();
  return !!membership;
}

/** Get groups a user explicitly facilitates (role = 'facilitator'). No admin bypass. */
export async function getFacilitatorGroups(
  userId: string
): Promise<{ id: string; name: string; slug: string }[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("forum_group_members")
    .select("forum_groups(id, name, slug)")
    .eq("user_id", userId)
    .eq("role", "facilitator");

  return (data ?? []).map(
    (m) => m.forum_groups as unknown as { id: string; name: string; slug: string }
  );
}
