"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { syncGroupMembersToUpcomingEvents } from "@/lib/google/sync";

export async function updateMemberProfile(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  if (!userId) return;

  await admin.from("profiles").update({
    first_name: (formData.get("first_name") as string) || null,
    last_name: (formData.get("last_name") as string) || null,
    business_name: (formData.get("business_name") as string) || null,
    role_title: (formData.get("role_title") as string) || null,
    linkedin_url: (formData.get("linkedin_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    community_visible: formData.get("community_visible") === "true",
    avatar_url: (formData.get("avatar_url") as string) || null,
  }).eq("id", userId);

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function toggleAdminRole(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const isAdmin = formData.get("is_admin") === "true";
  if (!userId) return;

  if (isAdmin) {
    // Remove admin role
    await admin.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
  } else {
    // Add admin role
    await admin.from("user_roles").upsert({ user_id: userId, role: "admin" });
  }

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function addToGroup(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const groupId = formData.get("group_id") as string;
  if (!userId || !groupId) return;

  await admin.from("forum_group_members").upsert({
    user_id: userId,
    forum_group_id: groupId,
  });

  await syncGroupMembersToUpcomingEvents(groupId);

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function removeFromGroup(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const groupId = formData.get("group_id") as string;
  if (!userId || !groupId) return;

  await admin.from("forum_group_members")
    .delete()
    .eq("user_id", userId)
    .eq("forum_group_id", groupId);

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

  await admin.from("forum_group_members")
    .update({ role: newRole })
    .eq("user_id", userId)
    .eq("forum_group_id", groupId);

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function archiveMemberAction(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  if (!userId) return;

  // Remove from all groups
  await admin.from("forum_group_members").delete().eq("user_id", userId);

  // Remove any roles
  await admin.from("user_roles").delete().eq("user_id", userId);

  // Set archived_at
  await admin.from("profiles")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", userId);

  // Ban auth user
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function restoreMemberAction(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  if (!userId) return;

  await admin.from("profiles")
    .update({ archived_at: null })
    .eq("id", userId);

  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}

export async function sendInviteEmailAction(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  if (!email) return;

  await admin.auth.admin.inviteUserByEmail(email);

  revalidatePath("/admin/members");
}
