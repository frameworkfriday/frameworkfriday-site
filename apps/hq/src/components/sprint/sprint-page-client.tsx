"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type {
  Sprint,
  SprintTemplatePublic,
  SprintDailyRecap,
} from "@/lib/types/sprint";
import { computePhase, generateScheduleWithDates } from "@/lib/sprint-utils";
import { SprintHeader } from "./sprint-header";
import { SprintNav } from "./sprint-nav";
import { DailyRecaps } from "./daily-recaps";
import { ScheduleSection } from "./schedule-section";
import { GettingSetUp } from "./getting-set-up";
import { TimeCommitment } from "./time-commitment";
import { WhatToExpect } from "./what-to-expect";
import { TroubleshootingFAQ } from "./troubleshooting-faq";
import { TipsForSuccess } from "./tips-for-success";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Settings,
  BookOpen,
} from "lucide-react";
import { SubmitWorkDialog } from "./submit-work-dialog";

/* ------------------------------------------------------------------ */
/*  SectionCard — colored header banner + white content card           */
/* ------------------------------------------------------------------ */

function SectionCard({
  id,
  title,
  subtitle,
  icon,
  color,
  children,
  collapsible,
  expanded,
  onToggle,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: "primary" | "dark" | "light";
  children: React.ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const bgClass = {
    primary: "bg-primary",
    dark: "bg-gray-900",
    light: "bg-gray-100",
  }[color];
  const textClass = color === "light" ? "text-gray-900" : "text-white";
  const subClass = color === "light" ? "text-gray-500" : "text-white/70";
  const chevronClass = color === "light" ? "text-gray-400" : "text-white/50";

  return (
    <div
      id={id}
      className="mt-10 first:mt-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
    >
      {collapsible ? (
        <button
          onClick={onToggle}
          className={`${bgClass} px-6 py-4 w-full flex items-center justify-between cursor-pointer`}
        >
          <div className="text-left">
            <h2
              className={`text-xl font-bold ${textClass} flex items-center gap-2`}
            >
              {icon}
              {title}
            </h2>
            {subtitle && (
              <p className={`text-sm ${subClass} mt-0.5 ml-7`}>{subtitle}</p>
            )}
          </div>
          {expanded ? (
            <ChevronUp size={20} className={chevronClass} />
          ) : (
            <ChevronDown size={20} className={chevronClass} />
          )}
        </button>
      ) : (
        <div className={`${bgClass} px-6 py-4`}>
          <h2
            className={`text-xl font-bold ${textClass} flex items-center gap-2`}
          >
            {icon}
            {title}
          </h2>
          {subtitle && (
            <p className={`text-sm ${subClass} mt-0.5 ml-7`}>{subtitle}</p>
          )}
        </div>
      )}
      {(!collapsible || expanded) && (
        <div className="bg-white p-4">{children}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SprintPageClient                                                   */
/* ------------------------------------------------------------------ */

interface Props {
  sprint: Sprint;
  template: SprintTemplatePublic | null;
  recaps: SprintDailyRecap[];
  dateRange: string;
}

export function SprintPageClient({
  sprint,
  template,
  recaps,
  dateRange,
}: Props) {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [setupCollapsed, setSetupCollapsed] = useState(true);
  const setupRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const recapsRef = useRef<HTMLDivElement>(null);

  const phaseInfo = computePhase(sprint.start_date);
  const scheduleWithDates = template?.schedule_config
    ? generateScheduleWithDates(template.schedule_config, sprint.start_date)
    : [];

  const fireConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    const end = Date.now() + 3000;
    const colors = ["#FF4F1A", "#22c55e", "#f59e0b", "#3b82f6"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    const visited = localStorage.getItem("sprint-hq-visited");
    if (!visited) {
      localStorage.setItem("sprint-hq-visited", "true");
      setGuideExpanded(true);
      setSetupCollapsed(false);
    }

    // Day 4 confetti
    if (phaseInfo.activeDay === 4) {
      const confettiShown = sessionStorage.getItem(
        `confetti-${sprint.id}`
      );
      if (!confettiShown) {
        sessionStorage.setItem(`confetti-${sprint.id}`, "true");
        setTimeout(fireConfetti, 500);
      }
    }
  }, [phaseInfo.activeDay, sprint.id, fireConfetti]);

  const publishedRecaps = recaps.filter((r) => r.is_published);
  const hasRecaps = publishedRecaps.length > 0;

  const showRecapsFirst =
    hasRecaps ||
    phaseInfo.phase === "active" ||
    phaseInfo.phase === "buffer" ||
    phaseInfo.phase === "post-sprint";

  const scrollToSetup = () => {
    setSetupCollapsed(false);
    setTimeout(() => {
      setupRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Timezone for schedule subtitle
  const shortTz =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone.split("/")
      .pop()
      ?.replace(/_/g, " ") ?? "";

  return (
    <div className="min-h-screen bg-white">
      <SprintHeader dateRange={dateRange} />
      <SprintNav
        template={template}
        sprint={sprint}
        phaseInfo={phaseInfo}
        showRecaps={showRecapsFirst}
        onSetupClick={scrollToSetup}
        onSubmitWork={() => setSubmitDialogOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        {showRecapsFirst ? (
          <>
            <div ref={recapsRef}>
              <SectionCard
                id="daily-recaps"
                title="Daily Recaps"
                subtitle="Tap a day to view the full recap"
                icon={<FileText size={20} />}
                color="primary"
              >
                <DailyRecaps
                  recaps={publishedRecaps}
                  scheduleWithDates={scheduleWithDates}
                  phaseInfo={phaseInfo}
                  template={template}
                />
              </SectionCard>
            </div>
            <div ref={scheduleRef}>
              <SectionCard
                id="schedule"
                title="Your Schedule"
                subtitle={`Times in your timezone (${shortTz}) · Tap a day for details`}
                icon={<Calendar size={20} />}
                color="dark"
              >
                <ScheduleSection
                  sprint={sprint}
                  template={template}
                  scheduleWithDates={scheduleWithDates}
                  phaseInfo={phaseInfo}
                  onSubmitWork={() => setSubmitDialogOpen(true)}
                />
              </SectionCard>
            </div>
            <div ref={setupRef}>
              <SectionCard
                id="getting-set-up"
                title="Getting Set Up"
                subtitle="Before Day 1 checklist"
                icon={<Settings size={20} />}
                color="primary"
                collapsible
                expanded={!setupCollapsed}
                onToggle={() => setSetupCollapsed((prev) => !prev)}
              >
                <GettingSetUp template={template} />
              </SectionCard>
            </div>
          </>
        ) : (
          <>
            <div ref={setupRef}>
              <SectionCard
                id="getting-set-up"
                title="Getting Set Up"
                subtitle="Before Day 1 checklist"
                icon={<Settings size={20} />}
                color="primary"
              >
                <GettingSetUp template={template} />
              </SectionCard>
            </div>
            <div ref={scheduleRef}>
              <SectionCard
                id="schedule"
                title="Your Schedule"
                subtitle={`Times in your timezone (${shortTz}) · Tap a day for details`}
                icon={<Calendar size={20} />}
                color="dark"
              >
                <ScheduleSection
                  sprint={sprint}
                  template={template}
                  scheduleWithDates={scheduleWithDates}
                  phaseInfo={phaseInfo}
                  onSubmitWork={() => setSubmitDialogOpen(true)}
                />
              </SectionCard>
            </div>
            {hasRecaps && (
              <div ref={recapsRef}>
                <SectionCard
                  id="daily-recaps"
                  title="Daily Recaps"
                  subtitle="Tap a day to view the full recap"
                  icon={<FileText size={20} />}
                  color="primary"
                >
                  <DailyRecaps
                    recaps={publishedRecaps}
                    scheduleWithDates={scheduleWithDates}
                    phaseInfo={phaseInfo}
                    template={template}
                  />
                </SectionCard>
              </div>
            )}
          </>
        )}

        <SectionCard
          title="Sprint Guide"
          subtitle={!guideExpanded ? "Tips, FAQs, and what to expect" : undefined}
          icon={<BookOpen size={20} />}
          color="light"
          collapsible
          expanded={guideExpanded}
          onToggle={() => setGuideExpanded((prev) => !prev)}
        >
          <TimeCommitment />
          <WhatToExpect />
          <TroubleshootingFAQ />
          <TipsForSuccess />
        </SectionCard>
      </main>

      <SubmitWorkDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        embedUrl={template?.submit_work_embed_url ?? null}
        directUrl={template?.submit_work_url ?? null}
      />
    </div>
  );
}
