"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCalendar,
  createEvent,
  updateEvent,
  cancelEvent,
} from "./calendar";

/**
 * Ensure a group has a Google Calendar. Creates one if missing.
 * Returns the calendarId.
 */
export async function ensureGroupCalendar(groupId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: group } = await admin
    .from("forum_groups")
    .select("id, name, google_calendar_id")
    .eq("id", groupId)
    .single();

  if (!group) return null;

  if (group.google_calendar_id) return group.google_calendar_id;

  // Create a new calendar for this group
  const calendarId = await createCalendar(group.name);
  await admin
    .from("forum_groups")
    .update({ google_calendar_id: calendarId })
    .eq("id", groupId);

  return calendarId;
}

/** Get all member emails for a forum group. */
export async function getGroupMemberEmails(groupId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("forum_group_members")
    .select("user_id, profiles(email)")
    .eq("forum_group_id", groupId);

  if (!members) return [];

  return members
    .map((m) => {
      const profile = m.profiles as unknown as { email: string } | null;
      return profile?.email;
    })
    .filter((e): e is string => !!e);
}

interface SessionForCalendar {
  title: string;
  description?: string | null;
  starts_at: string;
  duration_minutes: number;
  video_call_url?: string | null;
  session_type?: string | null;
}

/**
 * Create a Google Calendar event for a session and store the eventId.
 * Ensures the group has a calendar first.
 */
export async function syncSessionToCalendar(
  sessionId: string,
  session: SessionForCalendar,
  groupId: string,
): Promise<void> {
  try {
    const calendarId = await ensureGroupCalendar(groupId);
    if (!calendarId) return;

    const emails = await getGroupMemberEmails(groupId);
    const eventId = await createEvent(calendarId, session, emails);

    const admin = createAdminClient();
    await admin
      .from("sessions")
      .update({ google_event_id: eventId })
      .eq("id", sessionId);
  } catch (err) {
    console.error("[Calendar] Failed to create event:", err);
  }
}

/**
 * Update a Google Calendar event with new session details.
 */
export async function updateSessionCalendarEvent(
  sessionId: string,
  session: SessionForCalendar,
  groupId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Get the existing event ID
    const { data: existing } = await admin
      .from("sessions")
      .select("google_event_id")
      .eq("id", sessionId)
      .single();

    if (!existing?.google_event_id) {
      // No event yet — create one
      await syncSessionToCalendar(sessionId, session, groupId);
      return;
    }

    const { data: group } = await admin
      .from("forum_groups")
      .select("google_calendar_id")
      .eq("id", groupId)
      .single();

    if (!group?.google_calendar_id) return;

    const emails = await getGroupMemberEmails(groupId);
    await updateEvent(group.google_calendar_id, existing.google_event_id, session, emails);
  } catch (err) {
    console.error("[Calendar] Failed to update event:", err);
  }
}

/**
 * Cancel a Google Calendar event when a session is deleted.
 */
export async function cancelSessionCalendarEvent(sessionId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: session } = await admin
      .from("sessions")
      .select("google_event_id, forum_group_id, forum_groups(google_calendar_id)")
      .eq("id", sessionId)
      .single();

    if (!session?.google_event_id || !session.forum_group_id) return;

    const group = session.forum_groups as unknown as { google_calendar_id: string | null } | null;
    if (!group?.google_calendar_id) return;

    await cancelEvent(group.google_calendar_id, session.google_event_id);
  } catch (err) {
    console.error("[Calendar] Failed to cancel event:", err);
  }
}

/**
 * When a member is added/removed from a group, update all upcoming session events.
 */
export async function syncGroupMembersToUpcomingEvents(groupId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: group } = await admin
      .from("forum_groups")
      .select("google_calendar_id")
      .eq("id", groupId)
      .single();

    if (!group?.google_calendar_id) return;

    // Get all upcoming sessions with calendar events
    const { data: sessions } = await admin
      .from("sessions")
      .select("id, title, description, starts_at, duration_minutes, video_call_url, session_type, google_event_id")
      .eq("forum_group_id", groupId)
      .not("google_event_id", "is", null)
      .gte("starts_at", new Date().toISOString());

    if (!sessions?.length) return;

    const emails = await getGroupMemberEmails(groupId);

    for (const session of sessions) {
      try {
        await updateEvent(group.google_calendar_id, session.google_event_id!, session, emails);
      } catch (err) {
        console.error(`[Calendar] Failed to update event for session ${session.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[Calendar] Failed to sync group members:", err);
  }
}
