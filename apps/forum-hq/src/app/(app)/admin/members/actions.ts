"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function inviteUser(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const businessName = formData.get("business_name") as string;
  const roleTitle = formData.get("role_title") as string;
  const groupIds = formData.getAll("group_ids") as string[];
  const role = formData.get("role") as string | null;
  const onboardingPath = formData.get("onboarding_path") as string;

  if (!email) return;

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError) {
    console.error("Invite error:", inviteError.message);
    return;
  }

  const userId = inviteData.user.id;

  await admin.from("profiles").upsert({
    id: userId,
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    business_name: businessName || null,
    role_title: roleTitle || null,
    onboarding_path: onboardingPath || null,
  });

  // Audit: member joined
  await logAudit(userId, "member_joined", { email, first_name: firstName, last_name: lastName, method: "invite" });

  if (role === "admin") {
    await admin.from("user_roles").upsert({ user_id: userId, role: "admin" });
    await logAudit(userId, "admin_added", {});
  }

  for (const groupId of groupIds) {
    const { data: group } = await admin.from("forum_groups").select("name").eq("id", groupId).single();
    const memberRole = role === "facilitator" ? "facilitator" : "member";
    await admin.from("forum_group_members").upsert({
      user_id: userId,
      forum_group_id: groupId,
      role: memberRole,
    });
    await logAudit(userId, "group_assigned", { group_id: groupId, group_name: group?.name ?? groupId, role: memberRole });
  }

  await logAudit(userId, "invite_sent", { email });

  revalidatePath("/admin/members");
}

export async function addMemberWithoutInvite(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const businessName = formData.get("business_name") as string;
  const roleTitle = formData.get("role_title") as string;
  const groupIds = formData.getAll("group_ids") as string[];
  const role = formData.get("role") as string | null;
  const onboardingPath = formData.get("onboarding_path") as string;

  if (!email) return;

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

  await admin.from("profiles").upsert({
    id: userId,
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    business_name: businessName || null,
    role_title: roleTitle || null,
    onboarding_path: onboardingPath || null,
  });

  await logAudit(userId, "member_joined", { email, first_name: firstName, last_name: lastName, method: "manual" });

  if (role === "admin") {
    await admin.from("user_roles").upsert({ user_id: userId, role: "admin" });
    await logAudit(userId, "admin_added", {});
  }

  for (const groupId of groupIds) {
    const { data: group } = await admin.from("forum_groups").select("name").eq("id", groupId).single();
    const memberRole = role === "facilitator" ? "facilitator" : "member";
    await admin.from("forum_group_members").upsert({
      user_id: userId,
      forum_group_id: groupId,
      role: memberRole,
    });
    await logAudit(userId, "group_assigned", { group_id: groupId, group_name: group?.name ?? groupId, role: memberRole });
  }

  revalidatePath("/admin/members");
}

export async function sendInviteEmail(formData: FormData) {
  const admin = createAdminClient();
  const email = formData.get("email") as string;
  if (!email) return;

  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) {
    console.error("Send invite error:", error.message);
  }

  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).single();
  if (profile) {
    await logAudit(profile.id, "invite_sent", { email });
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

  await logAudit(userId, "profile_updated", { fields: ["first_name", "last_name", "business_name", "role_title"] });

  if (groupId !== currentGroupId) {
    if (currentGroupId && groupId) {
      // Transfer
      const [{ data: fromGroup }, { data: toGroup }] = await Promise.all([
        admin.from("forum_groups").select("name").eq("id", currentGroupId).single(),
        admin.from("forum_groups").select("name").eq("id", groupId).single(),
      ]);
      await admin.from("forum_group_members").delete().eq("user_id", userId).eq("forum_group_id", currentGroupId);
      await admin.from("forum_group_members").upsert({ user_id: userId, forum_group_id: groupId });
      await logAudit(userId, "group_transferred", {
        from_group_id: currentGroupId, from_group: fromGroup?.name ?? currentGroupId,
        to_group_id: groupId, to_group: toGroup?.name ?? groupId,
      });
    } else if (currentGroupId) {
      const { data: group } = await admin.from("forum_groups").select("name").eq("id", currentGroupId).single();
      await admin.from("forum_group_members").delete().eq("user_id", userId).eq("forum_group_id", currentGroupId);
      await logAudit(userId, "group_removed", { group_id: currentGroupId, group_name: group?.name ?? currentGroupId });
    } else if (groupId) {
      const { data: group } = await admin.from("forum_groups").select("name").eq("id", groupId).single();
      await admin.from("forum_group_members").upsert({ user_id: userId, forum_group_id: groupId });
      await logAudit(userId, "group_assigned", { group_id: groupId, group_name: group?.name ?? groupId });
    }
  }

  revalidatePath("/admin/members");
}

export async function removeMemberFromGroup(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;
  const groupId = formData.get("group_id") as string;

  const { data: group } = await admin.from("forum_groups").select("name").eq("id", groupId).single();

  await admin.from("forum_group_members").delete().eq("user_id", userId).eq("forum_group_id", groupId);

  await logAudit(userId, "group_removed", { group_id: groupId, group_name: group?.name ?? groupId });

  revalidatePath("/admin/members");
}

export async function archiveMember(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;

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

  revalidatePath("/admin/members");
}

export async function restoreMember(formData: FormData) {
  const admin = createAdminClient();
  const userId = formData.get("user_id") as string;

  await admin.from("profiles").update({ archived_at: null }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });

  await logAudit(userId, "member_restored", {});

  revalidatePath("/admin/members");
}
