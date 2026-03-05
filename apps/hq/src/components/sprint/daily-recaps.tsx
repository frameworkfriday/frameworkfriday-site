"use client";

import { useState } from "react";
import {
  Play,
  ExternalLink,
  Lightbulb,
  FileText,
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

export function DailyRecaps({ recaps, scheduleWithDates, phaseInfo }: Props) {
  // Show newest day first
  const recapsReversed = [...recaps].reverse();

  // Auto-select current day if available, otherwise latest
  const defaultTab =
    phaseInfo.activeDay &&
    recapsReversed.find((r) => r.day_number === phaseInfo.activeDay)
      ? phaseInfo.activeDay
      : recapsReversed[0]?.day_number ?? 1;

  const [activeDay, setActiveDay] = useState(defaultTab);
  const activeRecap = recaps.find((r) => r.day_number === activeDay);
  const activeDayInfo = scheduleWithDates[activeDay - 1];

  if (recaps.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Day tabs */}
      <div className="flex gap-2 mb-4">
        {recapsReversed.map((recap) => (
          <button
            key={recap.day_number}
            onClick={() => setActiveDay(recap.day_number)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeDay === recap.day_number
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Day {recap.day_number}
          </button>
        ))}
      </div>

      {/* Active recap content */}
      {activeRecap && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {/* Day header */}
          <div className="bg-primary-light px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Day {activeRecap.day_number}
              {activeDayInfo && ` — ${activeDayInfo.topic}`}
            </h2>
            {activeDayInfo && (
              <p className="text-sm text-gray-500 mt-0.5">{activeDayInfo.date}</p>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Left column: highlights + takeaways */}
              <div className="space-y-6">
                {activeRecap.recap_summary && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-primary" />
                      <h3 className="font-semibold text-gray-900">
                        Session Highlights
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {activeRecap.recap_summary}
                    </div>
                  </div>
                )}

                {activeRecap.key_takeaways && (
                  <div className="bg-warm-50 rounded-xl p-5 border border-warm-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={16} className="text-primary" />
                      <h3 className="font-semibold text-gray-900">
                        Key Takeaways
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {activeRecap.key_takeaways}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: recording + resources */}
              <div className="space-y-4">
                {activeRecap.recording_url && (
                  <a
                    href={activeRecap.recording_url}
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

                {activeRecap.resources && activeRecap.resources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Resources
                    </h4>
                    <div className="space-y-2">
                      {activeRecap.resources.map((resource) => (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink size={14} className="text-gray-400" />
                          {resource.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
