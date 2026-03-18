import { createAdminClient } from "@/lib/supabase/admin";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  post_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

/** Get unread notification count for a user. */
export async function getUnreadCount(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

/** Get recent notifications for a user. */
export async function getNotifications(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<AppNotification[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("id, type, title, body, link, post_id, actor_id, read_at, created_at, profiles:actor_id(first_name, last_name, avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    post_id: n.post_id,
    actor_id: n.actor_id,
    read_at: n.read_at,
    created_at: n.created_at,
    actor: n.profiles as unknown as AppNotification["actor"],
  }));
}

/** Mark a single notification as read. */
export async function markAsRead(notificationId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
}

/** Mark all notifications as read for a user. */
export async function markAllAsRead(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
