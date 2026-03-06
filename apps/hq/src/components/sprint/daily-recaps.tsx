"use client";

import { useState } from "react";
import {
  Play,
  ExternalLink,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  SprintDailyRecap,
  ScheduleDayWithDate,
  PhaseInfo,
  SprintTemplatePublic,
} from "@/lib/types/sprint";
import { cn } from "@/lib/utils";

interface Props {
  recaps: SprintDailyRecap[];
  scheduleWithDates: ScheduleDayWithDate[];
  phaseInfo: PhaseInfo;
  template: SprintTemplatePublic | null;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

const SPRINT_DAYS = [1, 2, 3] as const;

export function DailyRecaps({ recaps, scheduleWithDates, phaseInfo }: Props) {
  // Build entries for all 3 days, merging published recap data where available
  const dayEntries = [...SPRINT_DAYS].reverse().map((dayNum) => {
    const recap = recaps.find((r) => r.day_number === dayNum) ?? null;
    const scheduleDay = scheduleWithDates.find(
      (s) => s.day === dayNum && s.hasSession
    );
    return {
      dayNumber: dayNum,
      recap,
      isPublished: recap?.is_published ?? false,
      topic: scheduleDay?.topic ?? `Day ${dayNum}`,
      date: scheduleDay?.date ?? "",
    };
  });

  // Auto-expand latest published day
  const latestPublished = dayEntries.find((e) => e.isPublished);
  const [expandedDay, setExpandedDay] = useState<number | null>(
    latestPublished?.dayNumber ?? null
  );

  const toggleDay = (dayNumber: number) => {
    setExpandedDay(expandedDay === dayNumber ? null : dayNumber);
  };

  return (
    <section id="daily-recaps" className="mt-8">
      <h2 className="text-2xl font-bold text-center text-gray-900">
        Daily Recaps
      </h2>
      <p className="text-sm text-gray-500 text-center mt-1">
        Tap a day to view the full recap
      </p>

      <div className="mt-6 space-y-3">
        {dayEntries.map((entry) => {
          const isExpanded = expandedDay === entry.dayNumber;
          const isActive =
            entry.isPublished && phaseInfo.activeDay === entry.dayNumber;

          return (
            <div
              key={entry.dayNumber}
              className={cn(
                "rounded-xl border transition-colors",
                !entry.isPublished
                  ? "border-gray-100 bg-gray-50"
                  : isActive
                    ? "border-primary/30 bg-primary-light/30"
                    : "border-gray-200 bg-white"
              )}
            >
              <button
                onClick={() => entry.isPublished && toggleDay(entry.dayNumber)}
                disabled={!entry.isPublished}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 text-left",
                  entry.isPublished
                    ? "cursor-pointer"
                    : "cursor-default opacity-50"
                )}
              >
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0",
                    entry.isPublished ? "bg-gray-900" : "bg-gray-300"
                  )}
                >
                  Day {entry.dayNumber}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-semibold",
                      entry.isPublished ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {entry.topic}
                  </p>
                  <p
                    className={cn(
                      "text-sm",
                      entry.isPublished ? "text-gray-500" : "text-gray-300"
                    )}
                  >
                    {entry.date}
                  </p>
                </div>

                {entry.isPublished ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {entry.recap?.recording_url && (
                      <Play size={14} className="text-gray-400" />
                    )}
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 text-xs font-medium flex-shrink-0">
                    Coming Soon
                  </span>
                )}
              </button>

              {isExpanded && entry.isPublished && entry.recap && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    {/* Left column: highlights + takeaways */}
                    <div className="space-y-6">
                      {entry.recap.recap_summary && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileText size={16} className="text-primary" />
                            <h3 className="font-semibold text-gray-900">
                              Session Highlights
                            </h3>
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {entry.recap.recap_summary}
                          </div>
                        </div>
                      )}

                      {entry.recap.key_takeaways && (
                        <div className="bg-warm-50 rounded-xl p-5 border border-warm-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={16} className="text-primary" />
                            <h3 className="font-semibold text-gray-900">
                              Key Takeaways
                            </h3>
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {entry.recap.key_takeaways}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right column: recording + resources */}
                    <div className="space-y-4">
                      {entry.recap.recording_url && (
                        <a
                          href={normalizeUrl(entry.recap.recording_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                            <Play size={16} className="text-white ml-0.5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Watch Recording
                            </p>
                            <p className="text-xs text-gray-500">
                              View the full session replay
                            </p>
                          </div>
                          <ExternalLink
                            size={14}
                            className="ml-auto text-gray-400 group-hover:text-gray-600"
                          />
                        </a>
                      )}

                      {entry.recap.resources &&
                        entry.recap.resources.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Resources
                            </h4>
                            <div className="space-y-2">
                              {entry.recap.resources.map((resource) => (
                                <a
                                  key={resource.id}
                                  href={normalizeUrl(resource.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <ExternalLink
                                    size={14}
                                    className="text-gray-400"
                                  />
                                  {resource.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
