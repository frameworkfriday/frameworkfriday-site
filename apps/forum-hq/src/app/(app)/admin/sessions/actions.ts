"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  syncSessionToCalendar,
  cancelSessionCalendarEvent,
} from "@/lib/google/sync";

const SESSION_TYPE_LABELS: Record<string, string> = {
  forum_session: "Forum Session",
  office_hours: "Office Hours",
  ad_hoc: "Session",
};

export async function createSession(formData: FormData) {
  const admin = createAdminClient();
  let title = (formData.get("title") as string)?.trim() || "";
  const description = formData.get("description") as string;
  const session_type = formData.get("session_type") as string;
  const forum_group_id = formData.get("forum_group_id") as string;
  const starts_at = formData.get("starts_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string) || 90;
  const video_call_url = formData.get("video_call_url") as string;
  const facilitator_id = formData.get("facilitator_id") as string;

  if (!starts_at || !session_type) return;

  // Auto-generate title from group name + session type if not provided
  if (!title && forum_group_id) {
    const { data: group } = await admin.from("forum_groups").select("name").eq("id", forum_group_id).single();
    const typeLabel = SESSION_TYPE_LABELS[session_type] ?? "Session";
    title = group ? `${group.name} — ${typeLabel}` : typeLabel;
  } else if (!title && !forum_group_id && session_type === "office_hours") {
    title = "Framework Friday — Office Hours";
  } else if (!title) {
    title = SESSION_TYPE_LABELS[session_type] ?? "Session";
  }

  const sessionData = {
    title,
    description: description?.trim() || null,
    session_type,
    forum_group_id: forum_group_id || null,
    starts_at: new Date(starts_at).toISOString(),
    duration_minutes,
    video_call_url: video_call_url?.trim() || null,
    facilitator_id: facilitator_id || null,
  };

  const { data } = await admin.from("sessions").insert(sessionData).select("id").single();

  // Sync to Google Calendar if session has a group and no custom call URL
  const hasOwnUrl = !!video_call_url?.trim();
  if (data?.id && forum_group_id && !hasOwnUrl) {
    await syncSessionToCalendar(data.id, sessionData, forum_group_id);
  }

  revalidatePath("/admin/sessions");
}

export async function assignGroup(formData: FormData) {
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const forum_group_id = formData.get("forum_group_id") as string;
  if (!id) return;

  // Cancel old calendar event if exists
  await cancelSessionCalendarEvent(id);

  await admin
    .from("sessions")
    .update({ forum_group_id: forum_group_id || null, google_event_id: null })
    .eq("id", id);

  // Create new event for the new group
  if (forum_group_id) {
    const { data: session } = await admin
      .from("sessions")
      .select("title, description, starts_at, duration_minutes, video_call_url, session_type")
      .eq("id", id)
      .single();

    if (session) {
      await syncSessionToCalendar(id, session, forum_group_id);
    }
  }

  revalidatePath("/admin/sessions");
}

export async function assignFacilitator(formData: FormData) {
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const facilitator_id = formData.get("facilitator_id") as string;
  if (!id) return;
  await admin
    .from("sessions")
    .update({ facilitator_id: facilitator_id || null })
    .eq("id", id);
  revalidatePath("/admin/sessions");
}

export async function bulkCreateSessions(formData: FormData) {
  const admin = createAdminClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const session_type = formData.get("session_type") as string;
  const starts_at = formData.get("starts_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string) || 90;
  const video_call_url = formData.get("video_call_url") as string;
  const facilitator_id = formData.get("facilitator_id") as string;
  const groupIdsRaw = formData.get("group_ids") as string;

  if (!title || !starts_at || !session_type || !groupIdsRaw) return;

  const hasOwnUrl = !!video_call_url?.trim();

  // Cross-group mode: create a single session with no group
  if (groupIdsRaw === "cross_group") {
    const typeLabel = SESSION_TYPE_LABELS[session_type] ?? "Session";
    let sessionTitle = title
      .replace(/\{group\}/gi, "Framework Friday")
      .replace(/\{type\}/gi, typeLabel);

    const sessionData = {
      title: sessionTitle.trim(),
      description: description?.trim() || null,
      session_type,
      forum_group_id: null,
      starts_at: new Date(starts_at).toISOString(),
      duration_minutes,
      video_call_url: video_call_url?.trim() || null,
      facilitator_id: facilitator_id || null,
    };

    await admin.from("sessions").insert(sessionData).select("id").single();
    revalidatePath("/admin/sessions");
    return;
  }

  let groupIds: string[];

  if (groupIdsRaw === "all") {
    const { data: groups } = await admin.from("forum_groups").select("id");
    groupIds = (groups ?? []).map((g) => g.id);
  } else {
    groupIds = groupIdsRaw.split(",").filter(Boolean);
  }

  if (groupIds.length === 0) return;

  // Fetch group names for {group} placeholder
  const { data: groups } = await admin
    .from("forum_groups")
    .select("id, name")
    .in("id", groupIds);
  const groupNameMap = Object.fromEntries((groups ?? []).map((g) => [g.id, g.name]));

  for (const groupId of groupIds) {
    const groupName = groupNameMap[groupId] ?? "";
    const typeLabel = SESSION_TYPE_LABELS[session_type] ?? "Session";
    let sessionTitle = title
      .replace(/\{group\}/gi, groupName)
      .replace(/\{type\}/gi, typeLabel);

    const sessionData = {
      title: sessionTitle.trim(),
      description: description?.trim() || null,
      session_type,
      forum_group_id: groupId,
      starts_at: new Date(starts_at).toISOString(),
      duration_minutes,
      video_call_url: video_call_url?.trim() || null,
      facilitator_id: facilitator_id || null,
    };

    const { data } = await admin.from("sessions").insert(sessionData).select("id").single();

    // Sync to Google Calendar unless user provided their own call URL
    if (data?.id && !hasOwnUrl) {
      await syncSessionToCalendar(data.id, sessionData, groupId);
    }
  }

  revalidatePath("/admin/sessions");
}

export async function deleteSession(formData: FormData) {
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  if (!id) return;

  // Cancel calendar event before deleting
  await cancelSessionCalendarEvent(id);

  await admin.from("sessions").delete().eq("id", id);
  revalidatePath("/admin/sessions");
}
