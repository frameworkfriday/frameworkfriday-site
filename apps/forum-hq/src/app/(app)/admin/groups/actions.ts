"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { syncGroupMembersToUpcomingEvents } from "@/lib/google/sync";

export async function createGroup(formData: FormData) {
  const admin = createAdminClient();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) return;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  await admin.from("forum_groups").insert({ name, slug, description: description || null });
  revalidatePath("/admin/groups");
}

export async function updateGroup(formData: FormData) {
  const admin = createAdminClient();
  const groupId = formData.get("group_id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  await admin.from("forum_groups").update({
    name,
    description: description || null,
  }).eq("id", groupId);

  revalidatePath("/admin/groups");
}

export async function addMemberToGroup(formData: FormData) {
  const admin = createAdminClient();
  const groupId = formData.get("group_id") as string;
  const userId = formData.get("user_id") as string;
  if (!groupId || !userId) return;

  await admin.from("forum_group_members").upsert({ forum_group_id: groupId, user_id: userId });

  // Update upcoming calendar events to include the new member
  await syncGroupMembersToUpcomingEvents(groupId);

  revalidatePath("/admin/groups");
}

export async function removeMemberFromGroup(formData: FormData) {
  const admin = createAdminClient();
  const groupId = formData.get("group_id") as string;
  const userId = formData.get("user_id") as string;

  await admin.from("forum_group_members")
    .delete()
    .eq("forum_group_id", groupId)
    .eq("user_id", userId);

  // Update upcoming calendar events to remove the member
  await syncGroupMembersToUpcomingEvents(groupId);

  revalidatePath("/admin/groups");
}

export async function toggleFacilitatorRole(formData: FormData) {
  const admin = createAdminClient();
  const groupId = formData.get("group_id") as string;
  const userId = formData.get("user_id") as string;
  const currentRole = formData.get("current_role") as string;
  if (!groupId || !userId) return;

  const newRole = currentRole === "facilitator" ? "member" : "facilitator";

  await admin
    .from("forum_group_members")
    .update({ role: newRole })
    .eq("forum_group_id", groupId)
    .eq("user_id", userId);

  revalidatePath("/admin/groups");
}
