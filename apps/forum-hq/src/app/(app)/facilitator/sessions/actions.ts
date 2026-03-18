"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isFacilitatorOf } from "@/lib/auth/facilitator";
import { revalidatePath } from "next/cache";
import {
  syncSessionToCalendar,
  updateSessionCalendarEvent,
  cancelSessionCalendarEvent,
} from "@/lib/google/sync";

export async function createFacilitatorSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const forumGroupId = formData.get("forum_group_id") as string;
  if (!forumGroupId) return;

  const hasAccess = await isFacilitatorOf(user.id, forumGroupId);
  if (!hasAccess) return;

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const session_type = formData.get("session_type") as string;
  const starts_at = formData.get("starts_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string) || 90;
  const video_call_url = formData.get("video_call_url") as string;
  const facilitator_id = formData.get("facilitator_id") as string;

  if (!title || !starts_at || !session_type) return;

  const sessionData = {
    title: title.trim(),
    description: description?.trim() || null,
    session_type,
    forum_group_id: forumGroupId,
    starts_at: new Date(starts_at).toISOString(),
    duration_minutes,
    video_call_url: video_call_url?.trim() || null,
    facilitator_id: facilitator_id || null,
  };

  const admin = createAdminClient();
  const { data } = await admin.from("sessions").insert(sessionData).select("id").single();

  // Sync to Google Calendar
  if (data?.id) {
    await syncSessionToCalendar(data.id, sessionData, forumGroupId);
  }

  revalidatePath("/facilitator/sessions");
}

export async function updateFacilitatorSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const forumGroupId = formData.get("forum_group_id") as string;
  const sessionId = formData.get("id") as string;
  if (!forumGroupId || !sessionId) return;

  const hasAccess = await isFacilitatorOf(user.id, forumGroupId);
  if (!hasAccess) return;

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const session_type = formData.get("session_type") as string;
  const starts_at = formData.get("starts_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string) || 90;
  const video_call_url = formData.get("video_call_url") as string;
  const facilitator_id = formData.get("facilitator_id") as string;

  if (!title || !starts_at || !session_type) return;

  const sessionData = {
    title: title.trim(),
    description: description?.trim() || null,
    session_type,
    starts_at: new Date(starts_at).toISOString(),
    duration_minutes,
    video_call_url: video_call_url?.trim() || null,
    facilitator_id: facilitator_id || null,
  };

  const admin = createAdminClient();
  await admin.from("sessions").update(sessionData).eq("id", sessionId);

  // Update Google Calendar event
  await updateSessionCalendarEvent(sessionId, sessionData, forumGroupId);

  revalidatePath("/facilitator/sessions");
}

export async function deleteFacilitatorSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const forumGroupId = formData.get("forum_group_id") as string;
  const sessionId = formData.get("id") as string;
  if (!forumGroupId || !sessionId) return;

  const hasAccess = await isFacilitatorOf(user.id, forumGroupId);
  if (!hasAccess) return;

  // Cancel calendar event before deleting
  await cancelSessionCalendarEvent(sessionId);

  const admin = createAdminClient();
  await admin.from("sessions").delete().eq("id", sessionId);

  revalidatePath("/facilitator/sessions");
}
