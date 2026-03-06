"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Verify the current user is an admin (server-side, bypasses RLS)
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!data) throw new Error("Not authorized");
  return user.id;
}

export async function saveRecap(payload: {
  id: string | null;
  sprint_id: string;
  day_number: number;
  is_published: boolean;
  recording_url: string | null;
  recap_summary: string | null;
  key_takeaways: string | null;
  resources: unknown[] | null;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const row = {
    sprint_id: payload.sprint_id,
    day_number: payload.day_number,
    is_published: payload.is_published,
    recording_url: payload.recording_url,
    recap_summary: payload.recap_summary,
    key_takeaways: payload.key_takeaways,
    resources: payload.resources,
    published_at: payload.is_published ? new Date().toISOString() : null,
  };

  if (payload.id) {
    const { error } = await admin
      .from("sprint_daily_recaps")
      .update(row)
      .eq("id", payload.id);

    if (error) throw new Error(error.message);
    return { id: payload.id };
  } else {
    const { data, error } = await admin
      .from("sprint_daily_recaps")
      .insert(row)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: data.id };
  }
}
