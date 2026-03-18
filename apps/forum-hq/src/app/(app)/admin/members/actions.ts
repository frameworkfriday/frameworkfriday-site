"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function inviteUser(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const businessName = formData.get("business_name") as string;
  const roleTitle = formData.get("role_title") as string;
  const groupId = formData.get("group_id") as string | null;

  if (!email) return;

  // Invite user by email (sends magic link)
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError) {
    console.error("Invite error:", inviteError.message);
    return;
  }

  const userId = inviteData.user.id;

  // Upsert profile
  await admin.from("profiles").upsert({
    id: userId,
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    business_name: businessName || null,
    role_title: roleTitle || null,
  });

  // Assign to group if selected
  if (groupId) {
    await admin.from("forum_group_members").upsert({
      user_id: userId,
      forum_group_id: groupId,
    });
  }

  revalidatePath("/admin/members");
}

export async function addMemberWithoutInvite(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const businessName = formData.get("business_name") as string;
  const roleTitle = formData.get("role_title") as string;
  const groupId = formData.get("group_id") as string | null;

  if (!email) return;

  // Create user without sending any email (email_confirm: false so inviteUserByEmail works later)
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { first_name: firstName || "", last_name: lastName || "" },
  });

  if (createError) {
    console.error("Create user error:", createError.message);
    return;
  }

  const userId = userData.user.id;

  // Upsert profile
  await admin.from("profiles").upsert({
    id: userId,
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    business_name: businessName || null,
    role_title: roleTitle || null,
  });

  // Assign to group if selected
  if (groupId) {
    await admin.from("forum_group_members").upsert({
      user_id: userId,
      forum_group_id: groupId,
    });
  }

  revalidatePath("/admin/members");
}

export async function sendInviteEmail(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  if (!email) return;

  // Re-invite — sends magic link to existing unconfirmed user
  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) {
    console.error("Send invite error:", error.message);
  }

  revalidatePath("/admin/members");
}

export async function updateMember(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const businessName = formData.get("business_name") as string;
  const roleTitle = formData.get("role_title") as string;
  const groupId = formData.get("group_id") as string | null;
  const currentGroupId = formData.get("current_group_id") as string | null;

  await admin.from("profiles").update({
    first_name: firstName || null,
    last_name: lastName || null,
    business_name: businessName || null,
    role_title: roleTitle || null,
  }).eq("id", userId);

  // Handle group reassignment
  if (groupId !== currentGroupId) {
    if (currentGroupId) {
      await admin.from("forum_group_members")
        .delete()
        .eq("user_id", userId)
        .eq("forum_group_id", currentGroupId);
    }
    if (groupId) {
      await admin.from("forum_group_members").upsert({
        user_id: userId,
        forum_group_id: groupId,
      });
    }
  }

  revalidatePath("/admin/members");
}

export async function removeMemberFromGroup(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const groupId = formData.get("group_id") as string;

  await admin.from("forum_group_members")
    .delete()
    .eq("user_id", userId)
    .eq("forum_group_id", groupId);

  revalidatePath("/admin/members");
}

export async function archiveMember(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;

  // Remove from all groups
  await admin.from("forum_group_members")
    .delete()
    .eq("user_id", userId);

  // Remove any roles (admin, etc.)
  await admin.from("user_roles")
    .delete()
    .eq("user_id", userId);

  // Set archived_at timestamp
  await admin.from("profiles")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", userId);

  // Ban the auth user so they can't log in
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });

  revalidatePath("/admin/members");
}

export async function restoreMember(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;

  // Clear archived_at
  await admin.from("profiles")
    .update({ archived_at: null })
    .eq("id", userId);

  // Unban the auth user
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });

  revalidatePath("/admin/members");
}
