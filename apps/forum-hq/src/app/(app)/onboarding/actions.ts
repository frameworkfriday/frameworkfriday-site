"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

// Save profile without redirecting — used by step 3 before showing the All Set screen
export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  await admin.from("profiles").upsert({
    id: user.id,
    email: user.email,
    first_name: (formData.get("first_name") as string) || null,
    last_name: (formData.get("last_name") as string) || null,
    business_name: (formData.get("business_name") as string) || null,
    role_title: (formData.get("role_title") as string) || null,
    community_visible: formData.get("community_visible") === "true",
    avatar_url: (formData.get("avatar_url") as string) || null,
    linkedin_url: (formData.get("linkedin_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    onboarding_completed_at: new Date().toISOString(),
  });

  // Save notification preferences
  await admin.from("notification_preferences").upsert({
    user_id: user.id,
    email_announcements: formData.get("email_announcements") === "true",
    email_direct_mentions: formData.get("email_direct_mentions") === "true",
    email_comment_replies: formData.get("email_comment_replies") === "true",
    email_new_events: formData.get("email_new_events") === "true",
    email_group_posts: formData.get("email_group_posts") === "true",
    in_app_group_posts: formData.get("in_app_group_posts") === "true",
  });
}

// Legacy — kept for compatibility
export async function completeOnboarding(formData: FormData) {
  await saveProfile(formData);
  redirect("/");
}
