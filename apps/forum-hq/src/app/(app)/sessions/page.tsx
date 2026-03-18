import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import SessionsClient from "./SessionsClient";
import { getEventAttendees } from "@/lib/google/calendar";

export type SessionRsvpData = {
  confirmed: number;
  total: number;
  avatars: { avatar_url: string | null; first_name: string; last_name: string }[];
};

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("forum_group_members")
    .select("forum_group_id, forum_groups(google_calendar_id)")
    .eq("user_id", user.id);

  const groupIds = (memberships ?? []).map((m) => m.forum_group_id);
  const calendarByGroup: Record<string, string> = {};
  for (const m of memberships ?? []) {
    const g = m.forum_groups as unknown as { google_calendar_id: string | null } | null;
    if (g?.google_calendar_id) calendarByGroup[m.forum_group_id] = g.google_calendar_id;
  }

  const { data: sessions } = groupIds.length
    ? await admin
        .from("sessions")
        .select("id, title, description, starts_at, duration_minutes, video_call_url, session_type, forum_group_id, google_event_id, forum_groups(name)")
        .in("forum_group_id", groupIds)
        .order("starts_at")
    : { data: [] };

  // Flatten group name into each session
  const sessionsWithGroup = (sessions ?? []).map((s) => ({
    ...s,
    group_name: (s.forum_groups as unknown as { name: string } | null)?.name ?? null,
  }));

  // Fetch RSVP data for next 3 upcoming sessions that have calendar events
  const rsvpData: Record<string, SessionRsvpData> = {};
  const now = new Date().toISOString();
  const upcomingWithEvents = sessionsWithGroup
    .filter((s) => s.starts_at >= now && s.google_event_id && s.forum_group_id && calendarByGroup[s.forum_group_id])
    .slice(0, 3);

  // Fetch member profiles for groups that have upcoming sessions
  const groupIdsForRsvp = [...new Set(upcomingWithEvents.map((s) => s.forum_group_id).filter(Boolean))];
  const membersByGroup: Record<string, { email: string; first_name: string; last_name: string; avatar_url: string | null }[]> = {};

  if (groupIdsForRsvp.length > 0) {
    const { data: allMembers } = await admin
      .from("forum_group_members")
      .select("forum_group_id, profiles(first_name, last_name, email, avatar_url)")
      .in("forum_group_id", groupIdsForRsvp);

    for (const m of allMembers ?? []) {
      const p = m.profiles as unknown as { first_name: string; last_name: string; email: string; avatar_url: string | null } | null;
      if (!p) continue;
      if (!membersByGroup[m.forum_group_id]) membersByGroup[m.forum_group_id] = [];
      membersByGroup[m.forum_group_id].push(p);
    }
  }

  await Promise.all(
    upcomingWithEvents.map(async (s) => {
      const calId = calendarByGroup[s.forum_group_id!];
      try {
        const attendees = await getEventAttendees(calId, s.google_event_id!);
        const rsvpMap: Record<string, string> = {};
        for (const a of attendees) rsvpMap[a.email.toLowerCase()] = a.responseStatus;

        const groupMembers = membersByGroup[s.forum_group_id!] ?? [];
        const confirmed = groupMembers.filter((m) => rsvpMap[m.email.toLowerCase()] === "accepted");

        rsvpData[s.id] = {
          confirmed: confirmed.length,
          total: groupMembers.length,
          avatars: confirmed.slice(0, 5).map((m) => ({
            avatar_url: m.avatar_url,
            first_name: m.first_name,
            last_name: m.last_name,
          })),
        };
      } catch {
        // Calendar API unavailable for this session
      }
    })
  );

  return <SessionsClient sessions={sessionsWithGroup} rsvpData={rsvpData} />;
}
