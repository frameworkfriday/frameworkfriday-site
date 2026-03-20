"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { syncGroupMembersToUpcomingEvents } from "@/lib/google/sync";
import { logAudit } from "@/lib/audit";

export async function updateMemberProfile(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  if (!userId) return;

  // Get current profile to detect what changed
  const { data: current } = await admin.from("profiles").select("*").eq("id", userId).single();

  const updates: Record<string, unknown> = {
    first_name: (formData.get("first_name") as string) || null,
    last_name: (formData.get("last_name") as string) || null,
    business_name: (formData.get("business_name") as string) || null,
    role_title: (formData.get("role_title") as string) || null,
    linkedin_url: (formData.get("linkedin_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    community_visible: formData.get("community_visible") === "true",
    avatar_url: (formData.get("avatar_url") as string) || null,
    onboarding_path: (formData.get("onboarding_path") as string) || null,
    phone: (formData.get("phone") as string) || null,
    address_line1: (formData.get("address_line1") as string) || null,
    address_line2: (formData.get("address_line2") as string) || null,
    city: (formData.get("city") as string) || null,
    state: (formData.get("state") as string) || null,
    zip: (formData.get("zip") as string) || null,
    country: (formData.get("country") as string) || null,
    timezone: (formData.get("timezone") as string) || null,
    bio: (formData.get("bio") as string) || null,
    industry: (formData.get("industry") as string) || null,
    company_revenue_range: (formData.get("company_revenue_range") as string) || null,
    employee_count_range: (formData.get("employee_count_range") as string) || null,
    birthday: (formData.get("birthday") as string) || null,
    spouse_partner_name: (formData.get("spouse_partner_name") as string) || null,
    goals: (formData.get("goals") as string) || null,
    referral_source: (formData.get("referral_source") as string) || null,
  };

  await admin.from("profiles").update(updates).eq("id", userId);

  // Log which fields changed
  if (current) {
    const changedFields = Object.keys(updates).filter(
      (key) => String(updates[key] ?? "") !== String((current as Record<string, unknown>)[key] ?? "")
    );
    if (changedFields.length > 0) {
      await logAudit(userId, "profile_updated", { fields: changedFields });
    }
  }

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function toggleAdminRole(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const isAdmin = formData.get("is_admin") === "true";
  if (!userId) return;

  if (isAdmin) {
    await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    await logAudit(userId, "admin_removed", {});
  } else {
    await admin.from("user_roles").upsert({ user_id: userId, role: "admin" });
    await logAudit(userId, "admin_added", {});
  }

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function addToGroup(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const groupId = formData.get("group_id") as string;
  if (!userId || !groupId) return;

  // Get group name for audit log
  const { data: group } = await admin.from("forum_groups").select("name").eq("id", groupId).single();

  await admin.from("forum_group_members").upsert({
    user_id: userId,
    forum_group_id: groupId,
  });

  await logAudit(userId, "group_assigned", { group_id: groupId, group_name: group?.name ?? groupId });
  await syncGroupMembersToUpcomingEvents(groupId);

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function removeFromGroup(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const groupId = formData.get("group_id") as string;
  if (!userId || !groupId) return;

  const { data: group } = await admin.from("forum_groups").select("name").eq("id", groupId).single();

  await admin.from("forum_group_members")
    .delete()
    .eq("user_id", userId)
    .eq("forum_group_id", groupId);

  await logAudit(userId, "group_removed", { group_id: groupId, group_name: group?.name ?? groupId });
  await syncGroupMembersToUpcomingEvents(groupId);

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function toggleFacilitator(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const groupId = formData.get("group_id") as string;
  const currentRole = formData.get("current_role") as string;
  if (!userId || !groupId) return;

  const newRole = currentRole === "facilitator" ? "member" : "facilitator";
  const { data: group } = await admin.from("forum_groups").select("name").eq("id", groupId).single();

  await admin.from("forum_group_members")
    .update({ role: newRole })
    .eq("user_id", userId)
    .eq("forum_group_id", groupId);

  await logAudit(
    userId,
    newRole === "facilitator" ? "facilitator_added" : "facilitator_removed",
    { group_id: groupId, group_name: group?.name ?? groupId }
  );

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function archiveMemberAction(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  if (!userId) return;

  // Log group removals before deleting
  const { data: memberships } = await admin.from("forum_group_members")
    .select("forum_group_id, forum_groups(name)")
    .eq("user_id", userId);

  await admin.from("forum_group_members").delete().eq("user_id", userId);
  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("profiles").update({ archived_at: new Date().toISOString() }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });

  const groupNames = (memberships ?? []).map((m) => {
    const g = m.forum_groups as unknown as { name: string } | null;
    return g?.name ?? m.forum_group_id;
  });

  await logAudit(userId, "member_archived", { removed_from_groups: groupNames });

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function restoreMemberAction(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  if (!userId) return;

  await admin.from("profiles").update({ archived_at: null }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });

  await logAudit(userId, "member_restored", {});

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function sendInviteEmailAction(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  if (!email) return;

  // Get user id from email for audit
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).single();

  await admin.auth.admin.inviteUserByEmail(email);

  if (profile) {
    await logAudit(profile.id, "invite_sent", { email });
  }

  revalidatePath("/admin/members");
}
