"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { respondToEvent } from "@/lib/google/calendar";
import { revalidatePath } from "next/cache";

export async function rsvpToSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const sessionId = formData.get("session_id") as string;
  const response = formData.get("response") as "accepted" | "declined" | "tentative";
  const comment = formData.get("comment") as string | null;
  if (!sessionId || !response) return;

  const admin = createAdminClient();

  // Get session + group calendar info
  const { data: session } = await admin
    .from("sessions")
    .select("google_event_id, forum_group_id, forum_groups(google_calendar_id)")
    .eq("id", sessionId)
    .single();

  if (!session?.google_event_id || !session.forum_group_id) return;

  const group = session.forum_groups as unknown as { google_calendar_id: string | null } | null;
  if (!group?.google_calendar_id) return;

  // Verify the user is a member of this group
  const { data: membership } = await admin
    .from("forum_group_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("forum_group_id", session.forum_group_id)
    .maybeSingle();
  if (!membership) return;

  // Get user's email
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();
  if (!profile?.email) return;

  await respondToEvent(
    group.google_calendar_id,
    session.google_event_id,
    profile.email,
    response,
    comment || undefined,
  );

  revalidatePath(`/sessions/${sessionId}`);
}
