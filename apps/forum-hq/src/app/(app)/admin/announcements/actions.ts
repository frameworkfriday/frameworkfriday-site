"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyGroups, notifyAll } from "@/lib/notifications/create";
import { sendEmail } from "@/lib/email/gmail";
import { emailBlastTemplate } from "@/lib/email/templates";

export async function createAdminPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  // Verify admin
  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRole) return;

  const body = formData.get("body") as string;
  const title = (formData.get("title") as string) || null;
  const post_type = (formData.get("post_type") as string) || "announcement";
  const is_global = formData.get("is_global") === "true";
  const groupIdsRaw = (formData.get("group_ids") as string) || "";

  if (!body?.trim()) return;

  const { data: post } = await admin.from("posts").insert({
    author_id: user.id,
    title: title?.trim() || null,
    body: body.trim(),
    post_type,
    is_global,
  }).select("id").single();

  if (!post) return;

  const groupIds = groupIdsRaw.split(",").filter(Boolean);
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
    : "Admin";

  const notification = {
    type: "new_post" as const,
    title: title?.trim() || `New ${post_type} from ${authorName}`,
    body: body.trim().slice(0, 200),
    link: `/announcements/${post.id}`,
    post_id: post.id,
    actor_id: user.id,
  };

  if (is_global) {
    await notifyAll(notification, user.id);
  } else if (groupIds.length > 0) {
    await notifyGroups(groupIds, notification, user.id);
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

export async function deleteAnyPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRole) return;

  const id = formData.get("id") as string;
  if (!id) return;

  await admin.from("posts").delete().eq("id", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

export async function adminTogglePin(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRole) return;

  const id = formData.get("id") as string;
  const pinned = formData.get("pinned") === "true";
  if (!id) return;

  await admin.from("posts").update({ is_pinned: pinned }).eq("id", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

export async function sendEmailBlast(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRole) return;

  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const audience = formData.get("audience") as string;
  if (!subject?.trim() || !body?.trim()) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const authorName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Forum HQ";

  let emails: string[] = [];
  if (audience === "all") {
    // All non-archived members (from profiles, not just group members)
    const { data: allProfiles } = await admin
      .from("profiles")
      .select("email")
      .is("archived_at", null);
    emails = (allProfiles ?? []).map((p) => p.email).filter(Boolean);
  } else {
    const groupIds = audience.split(",").filter(Boolean);
    if (groupIds.length > 0) {
      const { data: members } = await admin
        .from("forum_group_members")
        .select("user_id, profiles(email)")
        .in("forum_group_id", groupIds);
      const uniqueEmails = new Set<string>();
      (members ?? []).forEach((m) => {
        const p = m.profiles as unknown as { email: string } | null;
        if (p?.email) uniqueEmails.add(p.email);
      });
      emails = [...uniqueEmails];
    }
  }

  if (emails.length === 0) return;

  const template = emailBlastTemplate({ subject: subject.trim(), body: body.trim(), authorName });

  for (const email of emails) {
    try {
      await sendEmail(email, template.subject, template.html);
    } catch {
      // Continue on individual failure
    }
  }

  // Audit trail post
  const { data: post } = await admin.from("posts").insert({
    author_id: user.id,
    title: `[Email] ${subject.trim()}`,
    body: body.trim(),
    post_type: "announcement",
    is_global: audience === "all",
  }).select("id").single();

  if (post && audience !== "all") {
    const groupIds = audience.split(",").filter(Boolean);
    if (groupIds.length > 0) {
      await admin.from("post_audiences").insert(
        groupIds.map((forum_group_id) => ({ post_id: post.id, forum_group_id })),
      );
    }
  }

  revalidatePath("/admin/announcements");
}
