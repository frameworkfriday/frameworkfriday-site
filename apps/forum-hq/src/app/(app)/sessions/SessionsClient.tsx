"use client";

import { useState } from "react";
import Link from "next/link";
import type { SessionRsvpData } from "./page";

type Session = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  duration_minutes: number;
  video_call_url: string | null;
  session_type: string;
  group_name: string | null;
};

const SESSION_TYPES: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  forum_session: { label: "Forum Session", color: "#FF4F1A", bg: "rgba(255,79,26,0.10)", dot: "#FF4F1A" },
  office_hours:  { label: "Office Hours",  color: "#6E6E6E", bg: "#F0F0F0",             dot: "#A3A3A3" },
  ad_hoc:        { label: "Ad Hoc",        color: "#3B82F6", bg: "rgba(59,130,246,0.08)", dot: "#3B82F6" },
};

function typeInfo(type: string) {
  return SESSION_TYPES[type] ?? SESSION_TYPES.forum_session;
}

function isPast(iso: string) { return new Date(iso) < new Date(); }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Session card (shared) ─────────────────────────────────────────────────────

function SessionCard({ session, idx = 0, rsvp }: { session: Session; idx?: number; rsvp?: SessionRsvpData }) {
  const past = isPast(session.starts_at);
  const type = typeInfo(session.session_type);

  return (
    <Link
      href={`/sessions/${session.id}`}
      style={{
        padding: "16px 20px",
        background: "#FFFFFF",
        border: "1px solid #EBEBEB",
        borderRadius: "14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        opacity: past ? 0.65 : 1,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D4D4D4"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#EBEBEB"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Date block */}
      <div
        style={{
          width: "48px",
          flexShrink: 0,
          textAlign: "center",
          padding: "7px 5px",
          borderRadius: "10px",
          background: past ? "#F7F7F6" : type.bg,
          border: `1px solid ${past ? "#E5E5E5" : "transparent"}`,
        }}
      >
        <div style={{ fontSize: "19px", fontFamily: "var(--font-syne)", fontWeight: 800, color: past ? "#A3A3A3" : type.color, lineHeight: 1 }}>
          {new Date(session.starts_at).getDate()}
        </div>
        <div style={{ fontSize: "9px", color: past ? "#A3A3A3" : type.color, fontWeight: 600, letterSpacing: "0.05em", marginTop: "2px" }}>
          {new Date(session.starts_at).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
          <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "14px", color: past ? "#6E6E6E" : "#0F0F0F" }}>
            {session.title}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-syne)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              padding: "2px 7px",
              borderRadius: "10px",
              background: type.bg,
              color: type.color,
              textTransform: "uppercase",
            }}
          >
            {type.label}
          </span>
        </div>
        <div style={{ fontSize: "12px", color: "#A3A3A3", marginBottom: session.description || session.group_name ? "5px" : 0 }}>
          {formatDate(session.starts_at)} &middot; {formatTime(session.starts_at)} &middot; {session.duration_minutes} min
        </div>
        {session.group_name && (
          <div style={{ fontSize: "11px", color: "#A3A3A3", marginBottom: (session.description || rsvp) ? "4px" : 0, display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            {session.group_name}
          </div>
        )}
        {/* RSVP avatar stack */}
        {rsvp && !past && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: session.description ? "4px" : 0 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {rsvp.avatars.map((a, i) => {
                const initials = `${a.first_name?.[0] ?? ""}${a.last_name?.[0] ?? ""}`.toUpperCase();
                const s: React.CSSProperties = {
                  width: "22px", height: "22px", borderRadius: "50%",
                  border: "2px solid #FFFFFF", flexShrink: 0,
                  marginLeft: i === 0 ? 0 : "-6px", position: "relative", zIndex: 5 - i,
                };
                return a.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={a.avatar_url} alt="" style={{ ...s, objectFit: "cover" }} />
                ) : (
                  <div key={i} style={{ ...s, background: "rgba(255,79,26,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "8px", color: "#FF4F1A" }}>
                    {initials}
                  </div>
                );
              })}
              {rsvp.confirmed > rsvp.avatars.length && (
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: "2px solid #FFFFFF", background: "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "8px", color: "#6E6E6E", marginLeft: "-6px", position: "relative", zIndex: 0, flexShrink: 0 }}>
                  +{rsvp.confirmed - rsvp.avatars.length}
                </div>
              )}
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: rsvp.confirmed > 0 ? "#22C55E" : "#A3A3A3" }}>
              {rsvp.confirmed}/{rsvp.total} confirmed
            </span>
          </div>
        )}
        {session.description && (
          <div style={{ fontSize: "13px", color: "#6E6E6E", lineHeight: 1.5 }}>{session.description}</div>
        )}
      </div>

      {/* Join button */}
      {session.video_call_url && !past && (
        <a
          href={session.video_call_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "8px 14px",
            borderRadius: "10px",
            background: "#0F0F0F",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "none",
            flexShrink: 0,
            fontFamily: "var(--font-syne)",
            letterSpacing: "0.03em",
          }}
        >
          Join
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </Link>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────

function CalendarView({ sessions }: { sessions: Session[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Map day-of-month → sessions
  const sessionsByDay: Record<number, Session[]> = {};
  for (const s of sessions) {
    const d = new Date(s.starts_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!sessionsByDay[day]) sessionsByDay[day] = [];
      sessionsByDay[day].push(s);
    }
  }

  const selectedSessions = selectedDay ? (sessionsByDay[selectedDay] ?? []) : [];

  const prev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const next = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <button
          onClick={prev}
          style={{ background: "none", border: "1px solid #E5E5E5", borderRadius: "7px", cursor: "pointer", padding: "6px 12px", fontSize: "13px", color: "#6E6E6E" }}
        >
          ←
        </button>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "15px", color: "#0F0F0F" }}>
          {MONTH_NAMES[month]} {year}
        </div>
        <button
          onClick={next}
          style={{ background: "none", border: "1px solid #E5E5E5", borderRadius: "7px", cursor: "pointer", padding: "6px 12px", fontSize: "13px", color: "#6E6E6E" }}
        >
          →
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", fontFamily: "var(--font-syne)", fontWeight: 600, color: "#A3A3A3", letterSpacing: "0.06em", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px",
          background: "#F0F0F0",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #E5E5E5",
        }}
      >
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasSessions = day ? (sessionsByDay[day]?.length ?? 0) > 0 : false;
          const isSelected = day === selectedDay;
          const daySessions = day ? (sessionsByDay[day] ?? []) : [];

          return (
            <div
              key={i}
              onClick={() => day && hasSessions && setSelectedDay(isSelected ? null : day)}
              style={{
                background: isSelected ? "#0F0F0F" : "#FFFFFF",
                minHeight: "64px",
                padding: "8px",
                cursor: day && hasSessions ? "pointer" : "default",
                position: "relative",
                transition: "background 0.1s",
              }}
            >
              {day && (
                <>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: isToday ? "#FF4F1A" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontFamily: "var(--font-syne)",
                      fontWeight: isToday ? 700 : 400,
                      color: isSelected ? "#FFFFFF" : isToday ? "#FFFFFF" : "#0F0F0F",
                    }}
                  >
                    {day}
                  </div>

                  {/* Session dots */}
                  {daySessions.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "4px" }}>
                      {daySessions.map((s) => {
                        const t = typeInfo(s.session_type);
                        return (
                          <div
                            key={s.id}
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isSelected ? "rgba(255,255,255,0.6)" : t.dot,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day sessions */}
      {selectedDay && selectedSessions.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "10px" }}>
            {MONTH_NAMES[month]} {selectedDay}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {selectedSessions.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SessionsClient({ sessions, rsvpData = {} }: { sessions: Session[]; rsvpData?: Record<string, SessionRsvpData> }) {
  const [view, setView] = useState<"list" | "calendar">("list");

  const upcoming = sessions.filter((s) => !isPast(s.starts_at));
  const past = sessions.filter((s) => isPast(s.starts_at));

  const toggleBtn = (v: "list" | "calendar") => ({
    padding: "6px 14px",
    borderRadius: "7px",
    border: "none",
    cursor: "pointer" as const,
    fontFamily: "var(--font-syne)" as const,
    fontSize: "12px" as const,
    fontWeight: 600 as const,
    letterSpacing: "0.03em" as const,
    background: view === v ? "#0F0F0F" : "transparent",
    color: view === v ? "#FFFFFF" : "#6E6E6E",
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FF4F1A", marginBottom: "6px" }}>
            Sessions
          </div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: "28px", color: "#0F0F0F", margin: 0, letterSpacing: "-0.02em" }}>
            Your Schedule
          </h1>
        </div>

        {/* View toggle */}
        {sessions.length > 0 && (
          <div style={{ display: "flex", background: "#F0F0F0", padding: "3px", borderRadius: "10px" }}>
            <button onClick={() => setView("list")} style={toggleBtn("list")}>List</button>
            <button onClick={() => setView("calendar")} style={toggleBtn("calendar")}>Calendar</button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div
          style={{ padding: "48px 28px", textAlign: "center", background: "#FFFFFF", border: "1px solid #EBEBEB", borderRadius: "14px" }}
        >
          <div
            style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "rgba(255,79,26,0.10)", display: "flex",
              alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4F1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 600, fontSize: "15px", color: "#0F0F0F", marginBottom: "6px" }}>
            Sessions will appear here
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E6E" }}>
            Your facilitator will schedule sessions before your cohort begins.
          </div>
        </div>
      )}

      {/* Calendar view */}
      {view === "calendar" && sessions.length > 0 && (
        <CalendarView sessions={sessions} />
      )}

      {/* List view */}
      {view === "list" && sessions.length > 0 && (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "12px" }}>
                Upcoming
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {upcoming.map((s, i) => <SessionCard key={s.id} session={s} idx={i} rsvp={rsvpData[s.id]} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-syne)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A3A3A3", marginBottom: "12px" }}>
                Past
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {past.map((s, i) => <SessionCard key={s.id} session={s} idx={i} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
