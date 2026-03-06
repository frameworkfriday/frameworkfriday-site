"use client";

import { useState } from "react";
import {
  Video,
  Upload,
  ChevronDown,
  ChevronUp,
  Calendar,
  Laptop,
  Link2,
  Copy,
  Trophy,
  Lightbulb,
} from "lucide-react";
import type {
  Sprint,
  SprintTemplatePublic,
  ScheduleDayWithDate,
  PhaseInfo,
} from "@/lib/types/sprint";
import { cn } from "@/lib/utils";

interface Props {
  sprint: Sprint;
  template: SprintTemplatePublic | null;
  scheduleWithDates: ScheduleDayWithDate[];
  phaseInfo: PhaseInfo;
  onSubmitWork: () => void;
}

export function ScheduleSection({
  sprint,
  template,
  scheduleWithDates,
  phaseInfo,
  onSubmitWork,
}: Props) {
  const [expandedDay, setExpandedDay] = useState<number | null>(
    phaseInfo.activeDay
  );

  const shortTz =
    new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value || "";

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const getZoomUrl = (dayNum: number) => {
    if (dayNum === 1) return sprint.zoom_url_day1;
    if (dayNum === 2) return sprint.zoom_url_day2;
    if (dayNum === 3) return sprint.zoom_url_day3;
    return null;
  };

  // Session topics per day from schedule config
  const getDayTopics = (dayNum: number) => {
    // These are standard across all sprints
    const topics: Record<number, { live: string[]; workshop: string[] }> = {
      1: {
        live: [
          "Introduction to the Decision Sprint framework",
          "Understanding what makes a workflow AI-ready",
          "Initial workflow brainstorming",
        ],
        workshop: [
          "Complete workflow inventory with your Companion",
          "Prioritize your shortlist using the framework criteria",
          "Document your top 3 candidate workflows",
        ],
      },
      2: {
        live: [
          "Deep-dive into your selected workflows",
          "Mapping current state vs. future state",
          "Identifying automation opportunities",
        ],
        workshop: [
          "Create detailed workflow maps with your Companion",
          "Document pain points and decision points",
          "Identify data sources and dependencies",
        ],
      },
      3: {
        live: [
          "Translating workflows into agent specifications",
          "Defining success criteria and guardrails",
          "Planning implementation approach",
        ],
        workshop: [
          "Complete agent-ready specifications",
          "Document acceptance criteria",
          "Prepare any remaining questions for Day 4",
        ],
      },
    };
    return topics[dayNum];
  };

  // Format session time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const sessionTimeDisplay = sprint.session_time
    ? formatTime(sprint.session_time)
    : "1:00 PM";

  return (
    <section id="schedule" className="mt-12">
      <h2 className="text-2xl font-bold text-center text-gray-900">
        Your Schedule
      </h2>
      <p className="text-sm text-gray-500 text-center mt-1">
        Times shown in your timezone ({shortTz}) · Tap a day for details
      </p>

      <div className="mt-6 space-y-3">
        {scheduleWithDates.map((day) => {
          const isExpanded = expandedDay === day.day;
          const isActive = phaseInfo.activeDay === day.day;
          const isPast =
            phaseInfo.phase === "post-sprint" ||
            (phaseInfo.activeDay && day.day < phaseInfo.activeDay);
          const isBuffer = day.day === 4; // Thursday buffer
          const isDay4 = day.day === 5; // Friday Day 4

          // Buffer day (day 4 in schedule = Thursday)
          if (isBuffer) {
            return (
              <div
                key={day.day}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400"
              >
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                  Buffer
                </span>
                <span>
                  {day.date} · Completion Buffer
                </span>
              </div>
            );
          }

          const dayNumber = day.day <= 3 ? day.day : 4;
          const zoomUrl = getZoomUrl(dayNumber);
          const topics = getDayTopics(dayNumber);

          return (
            <div
              key={day.day}
              className={cn(
                "rounded-xl border transition-colors",
                isActive
                  ? "border-primary/30 bg-primary-light/30"
                  : isDay4
                    ? "border-primary/20 bg-primary-light/20"
                    : "border-gray-200 bg-white"
              )}
            >
              <button
                onClick={() => toggleDay(day.day)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
              >
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold text-white",
                    isDay4
                      ? "bg-primary"
                      : isPast
                        ? "bg-gray-400"
                        : "bg-gray-900"
                  )}
                >
                  Day {dayNumber}
                </span>
                {isDay4 && <span className="text-base">🎯</span>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{day.topic}</p>
                  <p className="text-sm text-gray-500">
                    {isDay4
                      ? "Thursday or Friday \u00b7 You choose when booking"
                      : `${day.dayOfWeek}, ${day.date} \u00b7 ${sessionTimeDisplay}`}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  {/* Day 4 special content */}
                  {isDay4 ? (
                    <Day4Content template={template} />
                  ) : (
                    <>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mb-3">
                        {zoomUrl && (
                          <a
                            href={zoomUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a7340] text-white text-sm font-medium hover:bg-[#156335] transition-colors"
                          >
                            <Video size={14} />
                            Join on Google Meet
                          </a>
                        )}
                        {template?.submit_work_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSubmitWork();
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Upload size={14} />
                            Submit Work
                          </button>
                        )}
                      </div>

                      {template?.submit_work_url && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                          <Link2 size={12} />
                          <span>Can&apos;t use the popup?</span>
                          <a
                            href={template.submit_work_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-600"
                          >
                            Open submission form
                          </a>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                template.submit_work_url!
                              )
                            }
                            className="p-0.5 hover:text-gray-600"
                            title="Copy link"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      )}

                      {/* Two-column: Live Session + Workshop */}
                      {topics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar size={14} className="text-gray-500" />
                              <h4 className="font-semibold text-sm text-gray-900">
                                Live Session (60 min)
                              </h4>
                            </div>
                            <ul className="space-y-2">
                              {topics.live.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-600 flex items-start gap-2"
                                >
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Laptop size={14} className="text-gray-500" />
                              <h4 className="font-semibold text-sm text-gray-900">
                                AI-Assisted Workshop (1-2 hours)
                              </h4>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                              <p className="text-xs text-yellow-800">
                                <Lightbulb
                                  size={12}
                                  className="inline mr-1"
                                />
                                <strong>Starter Prompt Required:</strong>{" "}
                                You&apos;ll receive a starter prompt after the
                                live session (via chat &amp; email) to use with
                                your Companion.
                              </p>
                            </div>
                            <ul className="space-y-2">
                              {topics.workshop.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-600 flex items-start gap-2"
                                >
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Buffer day note for Day 3 */}
                      {dayNumber === 3 && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            <Lightbulb size={12} className="inline mr-1" />
                            Thursday is a buffer day for completion—use it if
                            needed
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Day4Content({
  template,
}: {
  template: SprintTemplatePublic | null;
}) {
  return (
    <div>
      {/* Celebration banner */}
      <div className="bg-primary-light rounded-xl p-4 mb-4 flex items-center gap-3">
        <Trophy size={20} className="text-primary" />
        <div>
          <p className="font-semibold text-gray-900">You made it! 🎉</p>
          <p className="text-sm text-gray-600">
            Completing this Decision Sprint is a major accomplishment.
            Regardless of your verdict, you&apos;ve done the hard work of
            preparing your organization for AI transformation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-gray-500" />
            <h4 className="font-semibold text-sm text-gray-900">
              Book your 1:1 Review Session
            </h4>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              Review of your completed artifacts
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              Receive your Go or Provisional Go verdict
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              Next steps based on your outcome
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              Q&A and closing
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          {template?.booking_url_day4 ? (
            <a
              href={template.booking_url_day4}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl bg-gray-50 text-center text-sm font-medium text-primary hover:bg-gray-100 transition-colors"
            >
              Book your time slot →
            </a>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 text-center text-sm text-gray-400 italic">
              Booking link coming soon
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500">👥</span>
              <h4 className="font-semibold text-sm text-gray-900">
                Invite Your Decision Maker
              </h4>
            </div>
            <p className="text-xs text-gray-500">
              If you&apos;re not the CEO/decision maker, please invite them to
              join the call to discuss next steps together. When booking your
              time slot, there&apos;s a field to add an invitee—use that to
              include them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
