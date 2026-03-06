"use client";

import {
  Settings,
  Calendar,
  Video,
  Upload,
  FileText,
} from "lucide-react";
import type { Sprint, SprintTemplatePublic, PhaseInfo } from "@/lib/types/sprint";
import { cn } from "@/lib/utils";

interface Props {
  template: SprintTemplatePublic | null;
  sprint: Sprint;
  phaseInfo: PhaseInfo;
  showRecaps: boolean;
  onSetupClick: () => void;
  onSubmitWork: () => void;
}

export function SprintNav({ template, sprint, phaseInfo, showRecaps, onSetupClick, onSubmitWork }: Props) {
  // Determine which zoom URL to show based on active day
  const getJoinUrl = () => {
    if (phaseInfo.activeDay === 1) return sprint.zoom_url_day1;
    if (phaseInfo.activeDay === 2) return sprint.zoom_url_day2;
    if (phaseInfo.activeDay === 3) return sprint.zoom_url_day3;
    return null;
  };

  const joinUrl = getJoinUrl();
  const submitUrl = template?.submit_work_url;
  const showJoinSession =
    phaseInfo.phase === "active" && phaseInfo.activeDay !== 4 && joinUrl;

  return (
    <nav className="sticky top-14 z-40 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-3 py-3 overflow-x-auto">
        {showRecaps && (
          <a
            href="#daily-recaps"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <FileText size={14} />
            Recaps
          </a>
        )}

        <button
          onClick={onSetupClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <Settings size={14} />
          Getting Set Up
        </button>

        <a
          href="#schedule"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <Calendar size={14} />
          Schedule
        </a>

        {showJoinSession && (
          <a
            href={joinUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Video size={14} />
            Join Session
          </a>
        )}

        {submitUrl && (
          <button
            onClick={onSubmitWork}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
              "bg-primary text-white hover:bg-primary-hover"
            )}
          >
            <Upload size={14} />
            Submit Work
          </button>
        )}
      </div>
    </nav>
  );
}
