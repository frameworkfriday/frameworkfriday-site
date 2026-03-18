import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/gmail";
import {
  newAnnouncementEmail,
  newCommentEmail,
} from "@/lib/email/templates";

interface NotificationData {
  type: "new_post" | "new_comment" | "mention" | "new_event";
  title: string;
  body?: string;
  link?: string;
  post_id?: string;
  actor_id?: string;
}

/** Create in-app notifications for specific users + send emails based on preferences. */
export async function notifyUsers(
  userIds: string[],
  notification: NotificationData,
): Promise<void> {
  if (userIds.length === 0) return;
  const admin = createAdminClient();

  // Insert in-app notifications
  const rows = userIds.map((user_id) => ({
    user_id,
    type: notification.type,
    title: notification.title,
    body: notification.body || null,
    link: notification.link || null,
    post_id: notification.post_id || null,
    actor_id: notification.actor_id || null,
  }));

  await admin.from("notifications").insert(rows);

  // Check email preferences and send
  const emailPrefColumn = getEmailPrefColumn(notification.type);
  if (!emailPrefColumn) return;

  const { data: prefs } = await admin
    .from("notification_preferences")
    .select("user_id, email_announcements, email_direct_mentions, email_comment_replies, email_new_events, email_group_posts")
    .in("user_id", userIds);

  // Users without preferences row get defaults (true for most)
  const prefsMap = new Map(
    (prefs ?? []).map((p) => [
      p.user_id,
      (p as Record<string, unknown>)[emailPrefColumn] as boolean | null,
    ]),
  );

  const usersToEmail = userIds.filter((uid) => {
    const pref = prefsMap.get(uid);
    return pref === undefined ? getDefaultForType(notification.type) : pref;
  });

  if (usersToEmail.length === 0) return;

  // Fetch emails
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", usersToEmail);

  if (!profiles || profiles.length === 0) return;

  // Build email content based on type
  for (const profile of profiles) {
    try {
      const emailContent = buildEmailForNotification(notification);
      if (emailContent) {
        await sendEmail(profile.email, emailContent.subject, emailContent.html);
      }
    } catch {
      // Don't block on email failures — notification is already saved in-app
    }
  }
}

/** Notify all members of a specific group. */
export async function notifyGroup(
  groupId: string,
  notification: NotificationData,
  excludeUserId?: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("forum_group_members")
    .select("user_id")
    .eq("forum_group_id", groupId);

  const userIds = (members ?? [])
    .map((m) => m.user_id)
    .filter((uid) => uid !== excludeUserId);

  await notifyUsers(userIds, notification);
}

/** Notify members across multiple groups (deduplicates). */
export async function notifyGroups(
  groupIds: string[],
  notification: NotificationData,
  excludeUserId?: string,
): Promise<void> {
  if (groupIds.length === 0) return;
  const admin = createAdminClient();

  const { data: members } = await admin
    .from("forum_group_members")
    .select("user_id")
    .in("forum_group_id", groupIds);

  const uniqueIds = [...new Set((members ?? []).map((m) => m.user_id))].filter(
    (uid) => uid !== excludeUserId,
  );

  await notifyUsers(uniqueIds, notification);
}

/** Notify all members globally. */
export async function notifyAll(
  notification: NotificationData,
  excludeUserId?: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("forum_group_members")
    .select("user_id");

  const uniqueIds = [...new Set((members ?? []).map((m) => m.user_id))].filter(
    (uid) => uid !== excludeUserId,
  );

  await notifyUsers(uniqueIds, notification);
}

function getEmailPrefColumn(type: string): string | null {
  switch (type) {
    case "new_post":
      return "email_announcements";
    case "new_comment":
      return "email_comment_replies";
    case "mention":
      return "email_direct_mentions";
    case "new_event":
      return "email_new_events";
    default:
      return null;
  }
}

function getDefaultForType(type: string): boolean {
  switch (type) {
    case "new_post":
      return true;
    case "new_comment":
      return true;
    case "mention":
      return true;
    case "new_event":
      return true;
    default:
      return false;
  }
}

function buildEmailForNotification(
  notification: NotificationData,
): { subject: string; html: string } | null {
  switch (notification.type) {
    case "new_post":
      return newAnnouncementEmail({
        groupName: "your group",
        title: notification.title,
        bodyPreview: notification.body || "",
        authorName: "Forum HQ",
        postId: notification.post_id || "",
      });
    case "new_comment":
      return newCommentEmail({
        postTitle: notification.title,
        commentBody: notification.body || "",
        authorName: "A member",
        postId: notification.post_id || "",
      });
    default:
      return null;
  }
}
