"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitFeedback(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const feedback_type = formData.get("feedback_type") as string;
  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const context = (formData.get("context") as string)?.trim() || null;
  const severity = (formData.get("severity") as string) || null;

  if (!feedback_type || !subject || !body) {
    return { error: "Subject and description are required." };
  }

  const validTypes = ["friction", "suggestion", "question", "praise"];
  if (!validTypes.includes(feedback_type)) {
    return { error: "Invalid feedback type." };
  }

  const admin = createAdminClient();

  // Get the user's forum_group_id
  const { data: membership } = await admin
    .from("forum_group_members")
    .select("forum_group_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const forum_group_id = membership?.forum_group_id ?? null;

  const { error } = await admin.from("member_feedback").insert({
    user_id: user.id,
    forum_group_id,
    feedback_type,
    subject,
    body,
    context,
    severity: feedback_type === "friction" ? severity : null,
    status: "new",
  });

  if (error) return { error: "Failed to submit feedback. Please try again." };

  revalidatePath("/feedback");
  return { success: true };
}

export async function getUserFeedback() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();

  const { data } = await admin
    .from("member_feedback")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
