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
import { SubmitWorkDialog } from "./submit-work-dialog";

interface Props {
  sprint: Sprint;
  template: SprintTemplatePublic | null;
  recaps: SprintDailyRecap[];
  dateRange: string;
}

export function SprintPageClient({ sprint, template, recaps, dateRange }: Props) {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
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
    if (visited) {
      setIsFirstVisit(false);
    } else {
      localStorage.setItem("sprint-hq-visited", "true");
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

  // Always show recaps first when they exist
  const showRecapsFirst = hasRecaps;

  const scrollToSetup = () => {
    setupRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <SprintHeader dateRange={dateRange} />
      <SprintNav
        template={template}
        sprint={sprint}
        phaseInfo={phaseInfo}
        onSetupClick={scrollToSetup}
        onSubmitWork={() => setSubmitDialogOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        {/* Section ordering based on phase */}
        {showRecapsFirst ? (
          <>
            <div ref={recapsRef}>
              <DailyRecaps
                recaps={publishedRecaps}
                scheduleWithDates={scheduleWithDates}
                phaseInfo={phaseInfo}
                template={template}
              />
            </div>
            <div ref={scheduleRef}>
              <ScheduleSection
                sprint={sprint}
                template={template}
                scheduleWithDates={scheduleWithDates}
                phaseInfo={phaseInfo}
                onSubmitWork={() => setSubmitDialogOpen(true)}
              />
            </div>
            <div ref={setupRef}>
              <GettingSetUp
                template={template}
                collapsed={!isFirstVisit}
              />
            </div>
          </>
        ) : (
          <>
            {/* Pre-sprint: setup first, then schedule */}
            <div ref={setupRef}>
              <GettingSetUp
                template={template}
                collapsed={false}
              />
            </div>
            <div ref={scheduleRef}>
              <ScheduleSection
                sprint={sprint}
                template={template}
                scheduleWithDates={scheduleWithDates}
                phaseInfo={phaseInfo}
                onSubmitWork={() => setSubmitDialogOpen(true)}
              />
            </div>
            {hasRecaps && (
              <div ref={recapsRef}>
                <DailyRecaps
                  recaps={publishedRecaps}
                  scheduleWithDates={scheduleWithDates}
                  phaseInfo={phaseInfo}
                  template={template}
                />
              </div>
            )}
          </>
        )}

        <TimeCommitment />
        <WhatToExpect />
        <TroubleshootingFAQ />
        <TipsForSuccess />
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
