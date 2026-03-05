import {
  format,
  parseISO,
  addDays,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";
import type {
  PhaseInfo,
  ScheduleDay,
  ScheduleDayWithDate,
  SprintPhase,
} from "@/lib/types/sprint";

/**
 * Compute the current phase of a sprint based on its start date.
 * The sprint runs Mon-Wed (Days 1-3), Thu is buffer, Fri is Day 4.
 */
export function computePhase(startDate: string): PhaseInfo {
  const start = startOfDay(parseISO(startDate));
  const today = startOfDay(new Date());
  const dayOffset = differenceInCalendarDays(today, start);

  if (dayOffset < 0) {
    return { phase: "pre-sprint", activeDay: null, currentDayIndex: -1 };
  }

  if (dayOffset >= 0 && dayOffset <= 2) {
    // Days 1-3 (Mon-Wed)
    return {
      phase: "active",
      activeDay: dayOffset + 1,
      currentDayIndex: dayOffset,
    };
  }

  if (dayOffset === 3) {
    // Thursday — buffer day
    return { phase: "buffer", activeDay: null, currentDayIndex: 3 };
  }

  if (dayOffset === 4) {
    // Friday — Day 4
    return { phase: "active", activeDay: 4, currentDayIndex: 4 };
  }

  // Past sprint
  return { phase: "post-sprint", activeDay: null, currentDayIndex: -1 };
}

/**
 * Generate schedule days with actual dates from the start date.
 */
export function generateScheduleWithDates(
  scheduleConfig: ScheduleDay[],
  startDate: string
): ScheduleDayWithDate[] {
  const start = parseISO(startDate);

  return scheduleConfig.map((day, index) => {
    const dayDate = addDays(start, index);
    return {
      ...day,
      date: format(dayDate, "MMMM d"),
      isoDate: format(dayDate, "yyyy-MM-dd"),
    };
  });
}

/**
 * Format the sprint date range for display.
 * e.g., "March 2-6, 2026"
 */
export function formatSprintDateRange(startDate: string): string {
  const start = parseISO(startDate);
  const end = addDays(start, 4); // 5-day sprint (Mon-Fri)

  const startMonth = format(start, "MMMM");
  const endMonth = format(end, "MMMM");
  const startDay = format(start, "d");
  const endDay = format(end, "d");
  const year = format(start, "yyyy");

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Convert session time from template timezone to user's local timezone.
 */
export function convertSessionTime(
  sessionTime: string,
  timezone: string,
  date: string
): string {
  try {
    // Parse the session time (e.g., "13:00") with the sprint date and timezone
    const [hours, minutes] = sessionTime.split(":").map(Number);
    const dateObj = parseISO(date);
    dateObj.setHours(hours, minutes, 0, 0);

    // Format in user's local timezone
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(dateObj);
  } catch {
    return sessionTime;
  }
}

/**
 * Get a display-friendly phase label.
 */
export function getPhaseLabel(phase: SprintPhase): string {
  switch (phase) {
    case "pre-sprint":
      return "Upcoming";
    case "active":
      return "Active";
    case "buffer":
      return "Buffer Day";
    case "post-sprint":
      return "Completed";
  }
}
