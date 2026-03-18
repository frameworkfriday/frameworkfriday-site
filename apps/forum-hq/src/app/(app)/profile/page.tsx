import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: profile }, { data: notifPrefs }] = await Promise.all([
    admin
      .from("profiles")
      .select("first_name, last_name, email, business_name, role_title, avatar_url, linkedin_url, website_url, community_visible")
      .eq("id", user.id)
      .single(),
    admin
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const hasPassword = user.app_metadata?.providers?.includes("email") ||
    user.identities?.some((i: { provider: string }) => i.provider === "email") || false;

  return (
    <ProfileClient
      userId={user.id}
      hasPassword={hasPassword}
      profile={{
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        email: profile?.email ?? user.email ?? "",
        businessName: profile?.business_name ?? "",
        roleTitle: profile?.role_title ?? "",
        avatarUrl: profile?.avatar_url ?? "",
        linkedinUrl: profile?.linkedin_url ?? "",
        websiteUrl: profile?.website_url ?? "",
        communityVisible: profile?.community_visible ?? true,
      }}
      notificationPreferences={{
        emailAnnouncements: notifPrefs?.email_announcements ?? true,
        emailDirectMentions: notifPrefs?.email_direct_mentions ?? true,
        emailCommentReplies: notifPrefs?.email_comment_replies ?? true,
        emailNewEvents: notifPrefs?.email_new_events ?? true,
        emailGroupPosts: notifPrefs?.email_group_posts ?? false,
        inAppGroupPosts: notifPrefs?.in_app_group_posts ?? true,
      }}
    />
  );
}
