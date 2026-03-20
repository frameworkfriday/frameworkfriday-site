"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";

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
    phone: (formData.get("phone") as string) || null,
    birthday: (formData.get("birthday") as string) || null,
    bio: (formData.get("bio") as string) || null,
    avatar_url: (formData.get("avatar_url") as string) || null,
    business_name: (formData.get("business_name") as string) || null,
    role_title: (formData.get("role_title") as string) || null,
    industry: (formData.get("industry") as string) || null,
    company_revenue_range: (formData.get("company_revenue_range") as string) || null,
    employee_count_range: (formData.get("employee_count_range") as string) || null,
    linkedin_url: (formData.get("linkedin_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    city: (formData.get("city") as string) || null,
    state: (formData.get("state") as string) || null,
    timezone: (formData.get("timezone") as string) || null,
    goals: (formData.get("goals") as string) || null,
    referral_source: (formData.get("referral_source") as string) || null,
    community_visible: formData.get("community_visible") === "true",
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

  // Log the onboarding completion in audit log
  await logAudit(user.id, "profile_updated", {
    source: "onboarding",
    fields: [
      "first_name", "last_name", "phone", "birthday", "bio", "avatar_url",
      "business_name", "role_title", "industry", "company_revenue_range",
      "employee_count_range", "linkedin_url", "website_url",
      "city", "state", "timezone", "goals", "referral_source",
      "community_visible",
    ],
    agreed_to_terms: formData.get("agreed_to_terms") === "true",
    agreed_to_confidentiality: formData.get("agreed_to_confidentiality") === "true",
  });
}

// Legacy — kept for compatibility
export async function completeOnboarding(formData: FormData) {
  await saveProfile(formData);
  redirect("/");
}
