"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyGroups, notifyAll } from "@/lib/notifications/create";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const body = formData.get("body") as string;
  const title = (formData.get("title") as string) || null;
  const post_type = (formData.get("post_type") as string) || "discussion";
  const is_global = formData.get("is_global") === "true";
  const groupIdsRaw = (formData.get("group_ids") as string) || "";

  if (!body?.trim()) return;

  // Check role for announcement type
  if (post_type === "announcement") {
    const { data: adminRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const { data: facMemberships } = await admin
      .from("forum_group_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "facilitator");

    if (!adminRole && (!facMemberships || facMemberships.length === 0)) return;
  }

  const { data: post } = await admin.from("posts").insert({
    author_id: user.id,
    title: title?.trim() || null,
    body: body.trim(),
    post_type,
    is_global,
  }).select("id").single();

  if (!post) return;

  // Insert audience entries
  const groupIds = groupIdsRaw.split(",").filter(Boolean);
  if (!is_global && groupIds.length > 0) {
    await admin.from("post_audiences").insert(
      groupIds.map((forum_group_id) => ({ post_id: post.id, forum_group_id })),
    );
  }

  // Fetch author name for notifications
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const authorName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "A member";

  // Send notifications
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

  revalidatePath("/announcements");
}

export async function editPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const body = formData.get("body") as string;
  const title = formData.get("title") as string;

  if (!id || !body?.trim()) return;

  // Only the author can edit
  const { data: post } = await admin.from("posts").select("author_id").eq("id", id).single();
  if (!post || post.author_id !== user.id) return;

  await admin.from("posts").update({
    body: body.trim(),
    title: title?.trim() || null,
    edited_at: new Date().toISOString(),
  }).eq("id", id);

  revalidatePath("/announcements");
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const id = formData.get("id") as string;
  if (!id) return;

  // Check: author, admin, or facilitator of post's group
  const { data: post } = await admin
    .from("posts")
    .select("author_id, is_global, post_audiences(forum_group_id)")
    .eq("id", id)
    .single();

  if (!post) return;

  const isAuthor = post.author_id === user.id;

  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!isAuthor && !adminRole) {
    // Check facilitator of post's group
    const audiences = (post.post_audiences as unknown as { forum_group_id: string }[]) ?? [];
    const groupIds = audiences.map((a) => a.forum_group_id);
    if (groupIds.length > 0) {
      const { data: facCheck } = await admin
        .from("forum_group_members")
        .select("forum_group_id")
        .eq("user_id", user.id)
        .eq("role", "facilitator")
        .in("forum_group_id", groupIds);
      if (!facCheck || facCheck.length === 0) return;
    } else {
      return;
    }
  }

  await admin.from("posts").delete().eq("id", id);
  revalidatePath("/announcements");
}

export async function createComment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const post_id = formData.get("post_id") as string;
  const body = formData.get("body") as string;

  if (!post_id || !body?.trim()) return;

  await admin.from("comments").insert({
    post_id,
    author_id: user.id,
    body: body.trim(),
  });

  // Notify the post author (if not self)
  const { data: post } = await admin
    .from("posts")
    .select("author_id, title")
    .eq("id", post_id)
    .single();

  if (post && post.author_id !== user.id) {
    const { data: commenter } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const commenterName = commenter
      ? `${commenter.first_name} ${commenter.last_name}`.trim()
      : "Someone";

    const { notifyUsers } = await import("@/lib/notifications/create");
    await notifyUsers([post.author_id], {
      type: "new_comment",
      title: `${commenterName} commented on your post`,
      body: body.trim().slice(0, 200),
      link: `/announcements/${post_id}`,
      post_id,
      actor_id: user.id,
    });
  }

  revalidatePath(`/announcements/${post_id}`);
  revalidatePath("/announcements");
}

export async function editComment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const body = formData.get("body") as string;

  if (!id || !body?.trim()) return;

  const { data: comment } = await admin.from("comments").select("author_id, post_id").eq("id", id).single();
  if (!comment || comment.author_id !== user.id) return;

  await admin.from("comments").update({
    body: body.trim(),
    edited_at: new Date().toISOString(),
  }).eq("id", id);

  revalidatePath(`/announcements/${comment.post_id}`);
}

export async function deleteComment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const id = formData.get("id") as string;
  if (!id) return;

  const { data: comment } = await admin
    .from("comments")
    .select("author_id, post_id")
    .eq("id", id)
    .single();

  if (!comment) return;

  const isAuthor = comment.author_id === user.id;

  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!isAuthor && !adminRole) {
    // Check facilitator
    const { data: post } = await admin
      .from("posts")
      .select("post_audiences(forum_group_id)")
      .eq("id", comment.post_id)
      .single();

    const audiences = (post?.post_audiences as unknown as { forum_group_id: string }[]) ?? [];
    const groupIds = audiences.map((a) => a.forum_group_id);
    if (groupIds.length > 0) {
      const { data: facCheck } = await admin
        .from("forum_group_members")
        .select("forum_group_id")
        .eq("user_id", user.id)
        .eq("role", "facilitator")
        .in("forum_group_id", groupIds);
      if (!facCheck || facCheck.length === 0) return;
    } else {
      return;
    }
  }

  await admin.from("comments").delete().eq("id", id);
  revalidatePath(`/announcements/${comment.post_id}`);
}

export async function togglePin(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  // Only admins can pin
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
  revalidatePath("/announcements");
}
