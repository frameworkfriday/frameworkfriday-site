"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarSprint {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  status: string;
}

interface SprintCalendarProps {
  sprints: CalendarSprint[];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  published: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  archived: "bg-gray-50 text-gray-400 border-gray-100",
};

export function SprintCalendar({ sprints }: SprintCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build sprint lookup by date
  const sprintsByDate = new Map<number, CalendarSprint[]>();
  sprints.forEach((sprint) => {
    const d = new Date(sprint.start_date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      // Sprint runs for 5 days (Mon-Fri)
      for (let i = 0; i < 5; i++) {
        const sprintDay = day + i;
        if (sprintDay <= daysInMonth) {
          const existing = sprintsByDate.get(sprintDay) || [];
          existing.push(sprint);
          sprintsByDate.set(sprintDay, existing);
        }
      }
    }
  });

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Sprint Calendar
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells for days before first of month */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30"
          />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const daySprints = sprintsByDate.get(day) || [];
          const dayOfWeek = (firstDay + i) % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <div
              key={day}
              className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 ${
                isWeekend ? "bg-gray-50/50" : ""
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                  isToday(day)
                    ? "bg-primary text-white font-bold"
                    : "text-gray-600"
                }`}
              >
                {day}
              </span>
              {daySprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium border truncate ${
                    STATUS_COLORS[sprint.status] || STATUS_COLORS.draft
                  }`}
                  title={sprint.title}
                >
                  {sprint.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
