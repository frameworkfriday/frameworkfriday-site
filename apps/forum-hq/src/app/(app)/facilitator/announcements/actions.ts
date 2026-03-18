"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isFacilitatorOf } from "@/lib/auth/facilitator";
import { revalidatePath } from "next/cache";
import { notifyGroup } from "@/lib/notifications/create";
import { sendEmail } from "@/lib/email/gmail";
import { emailBlastTemplate } from "@/lib/email/templates";

export async function createFacilitatorPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const body = formData.get("body") as string;
  const title = (formData.get("title") as string) || null;
  const post_type = (formData.get("post_type") as string) || "announcement";
  const groupIdsRaw = (formData.get("group_ids") as string) || "";
  const is_global = formData.get("is_global") === "true";

  if (!body?.trim()) return;

  // Verify facilitator access to all specified groups
  const groupIds = groupIdsRaw.split(",").filter(Boolean);
  for (const gid of groupIds) {
    const hasAccess = await isFacilitatorOf(user.id, gid);
    if (!hasAccess) return;
  }

  const { data: post } = await admin.from("posts").insert({
    author_id: user.id,
    title: title?.trim() || null,
    body: body.trim(),
    post_type,
    is_global,
  }).select("id").single();

  if (!post) return;

  if (!is_global && groupIds.length > 0) {
    await admin.from("post_audiences").insert(
      groupIds.map((forum_group_id) => ({ post_id: post.id, forum_group_id })),
    );
  }

  // Fetch author name
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const authorName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Your facilitator";

  const notification = {
    type: "new_post" as const,
    title: title?.trim() || `New ${post_type} from ${authorName}`,
    body: body.trim().slice(0, 200),
    link: `/announcements/${post.id}`,
    post_id: post.id,
    actor_id: user.id,
  };

  for (const gid of groupIds) {
    await notifyGroup(gid, notification, user.id);
  }

  revalidatePath("/facilitator/announcements");
  revalidatePath("/announcements");
}

export async function deleteFacilitatorPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;
  const forumGroupId = formData.get("forum_group_id") as string;
  if (!id || !forumGroupId) return;

  const hasAccess = await isFacilitatorOf(user.id, forumGroupId);
  if (!hasAccess) return;

  const admin = createAdminClient();
  await admin.from("posts").delete().eq("id", id);
  revalidatePath("/facilitator/announcements");
  revalidatePath("/announcements");
}

export async function deleteFacilitatorComment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;
  const forumGroupId = formData.get("forum_group_id") as string;
  if (!id || !forumGroupId) return;

  const hasAccess = await isFacilitatorOf(user.id, forumGroupId);
  if (!hasAccess) return;

  const admin = createAdminClient();
  const { data: comment } = await admin.from("comments").select("post_id").eq("id", id).single();
  await admin.from("comments").delete().eq("id", id);

  if (comment) {
    revalidatePath(`/announcements/${comment.post_id}`);
  }
  revalidatePath("/facilitator/announcements");
}

export async function sendFacilitatorEmail(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const forumGroupId = formData.get("forum_group_id") as string;
  if (!forumGroupId) return;

  const hasAccess = await isFacilitatorOf(user.id, forumGroupId);
  if (!hasAccess) return;

  const admin = createAdminClient();
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  if (!subject?.trim() || !body?.trim()) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const authorName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Your facilitator";

  const { data: members } = await admin
    .from("forum_group_members")
    .select("user_id, profiles(email)")
    .eq("forum_group_id", forumGroupId)
    .neq("user_id", user.id);

  const emails = (members ?? [])
    .map((m) => (m.profiles as unknown as { email: string } | null)?.email)
    .filter(Boolean) as string[];

  if (emails.length === 0) return;

  const template = emailBlastTemplate({ subject: subject.trim(), body: body.trim(), authorName });

  for (const email of emails) {
    try {
      await sendEmail(email, template.subject, template.html);
    } catch {
      // Continue on individual failure
    }
  }

  revalidatePath("/facilitator/announcements");
}
