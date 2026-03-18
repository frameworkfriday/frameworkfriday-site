import { google, calendar_v3 } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

export function getCalendarClient(): calendar_v3.Calendar {
  return google.calendar({ version: "v3", auth: oauth2Client });
}

/** Create a new Google Calendar for a forum group. Returns the calendarId. */
export async function createCalendar(groupName: string): Promise<string> {
  const cal = getCalendarClient();
  const res = await cal.calendars.insert({
    requestBody: {
      summary: `Forum: ${groupName}`,
      description: `Session calendar for ${groupName} — managed by Forum HQ`,
      timeZone: "America/New_York",
    },
  });
  return res.data.id!;
}

interface SessionData {
  title: string;
  description?: string | null;
  starts_at: string;
  duration_minutes: number;
  video_call_url?: string | null;
  session_type?: string | null;
}

/** Create a calendar event for a session. Returns the eventId. */
export async function createEvent(
  calendarId: string,
  session: SessionData,
  attendeeEmails: string[],
): Promise<string> {
  const cal = getCalendarClient();
  const start = new Date(session.starts_at);
  const end = new Date(start.getTime() + session.duration_minutes * 60_000);

  const res = await cal.events.insert({
    calendarId,
    sendUpdates: "all",
    requestBody: {
      summary: session.title,
      description: buildDescription(session),
      start: { dateTime: start.toISOString(), timeZone: "America/New_York" },
      end: { dateTime: end.toISOString(), timeZone: "America/New_York" },
      attendees: attendeeEmails.map((email) => ({ email })),
      conferenceData: session.video_call_url
        ? undefined
        : undefined,
      location: session.video_call_url || undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 1440 },
          { method: "popup", minutes: 30 },
        ],
      },
    },
  });
  return res.data.id!;
}

/** Update an existing calendar event. */
export async function updateEvent(
  calendarId: string,
  eventId: string,
  session: SessionData,
  attendeeEmails: string[],
): Promise<void> {
  const cal = getCalendarClient();
  const start = new Date(session.starts_at);
  const end = new Date(start.getTime() + session.duration_minutes * 60_000);

  await cal.events.update({
    calendarId,
    eventId,
    sendUpdates: "all",
    requestBody: {
      summary: session.title,
      description: buildDescription(session),
      start: { dateTime: start.toISOString(), timeZone: "America/New_York" },
      end: { dateTime: end.toISOString(), timeZone: "America/New_York" },
      attendees: attendeeEmails.map((email) => ({ email })),
      location: session.video_call_url || undefined,
    },
  });
}

/** Cancel a calendar event (sends cancellation to attendees). */
export async function cancelEvent(
  calendarId: string,
  eventId: string,
): Promise<void> {
  const cal = getCalendarClient();
  await cal.events.delete({
    calendarId,
    eventId,
    sendUpdates: "all",
  });
}

export interface AttendeeRsvp {
  email: string;
  responseStatus: "needsAction" | "accepted" | "declined" | "tentative";
}

/** Get attendee RSVP statuses for an event. */
export async function getEventAttendees(
  calendarId: string,
  eventId: string,
): Promise<AttendeeRsvp[]> {
  const cal = getCalendarClient();
  const res = await cal.events.get({ calendarId, eventId });
  return (res.data.attendees || []).map((a) => ({
    email: a.email!,
    responseStatus: (a.responseStatus as AttendeeRsvp["responseStatus"]) || "needsAction",
  }));
}

/** Update RSVP status for a specific attendee on an event. */
export async function respondToEvent(
  calendarId: string,
  eventId: string,
  attendeeEmail: string,
  response: "accepted" | "declined" | "tentative",
  comment?: string,
): Promise<void> {
  const cal = getCalendarClient();
  const res = await cal.events.get({ calendarId, eventId });
  const attendees = res.data.attendees || [];

  const updated = attendees.map((a) => {
    if (a.email?.toLowerCase() === attendeeEmail.toLowerCase()) {
      return { ...a, responseStatus: response, comment: comment || a.comment };
    }
    return a;
  });

  await cal.events.patch({
    calendarId,
    eventId,
    sendUpdates: "none",
    requestBody: { attendees: updated },
  });
}

function buildDescription(session: SessionData): string {
  const parts: string[] = [];
  if (session.session_type) {
    parts.push(`Type: ${session.session_type.replace(/_/g, " ")}`);
  }
  if (session.description) {
    parts.push("", session.description);
  }
  if (session.video_call_url) {
    parts.push("", `Join: ${session.video_call_url}`);
  }
  parts.push("", "Managed by Forum HQ — frameworkfriday.ai");
  return parts.join("\n");
}
