"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ExternalLink,
  Play,
  Settings,
  Sparkles,
  FileText,
  ArrowRight,
  Download,
} from "lucide-react";
import type { SprintTemplatePublic } from "@/lib/types/sprint";
import { cn } from "@/lib/utils";

interface Props {
  template: SprintTemplatePublic | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  actionLabel?: string;
  actionUrl?: string;
  isBonus?: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "claude",
    label: "Claude Pro or Team account",
    description:
      "Highly recommended for conversation compaction and longer contextual conversations. ChatGPT Projects may also work but is untested.",
    actionLabel: "Sign up",
    actionUrl: "https://claude.ai/",
  },
  {
    id: "project-kit",
    label: "Download Project Kit",
  },
  {
    id: "companion",
    label: "Set up your Companion",
    actionLabel: "See video",
  },
  {
    id: "calendar",
    label: "Block your calendar",
    actionLabel: "Add to cal",
  },
  {
    id: "dictation",
    label: "AI Dictation Tools",
    description:
      "Optional but a game-changer for working with your Companion — and beyond (may require purchase)",
    actionLabel: "View",
    isBonus: true,
  },
];

export function GettingSetUp({ template }: Props) {
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Load checked state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sprint-hq-checklist");
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("sprint-hq-checklist", JSON.stringify([...next]));
      return next;
    });
  };

  const completedCount = checkedItems.size;
  const totalCount = CHECKLIST_ITEMS.filter((i) => !i.isBonus).length;

  return (
    <div>
      {/* Progress bar */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Before Day 1 Checklist</span>
              <span>
                {completedCount} of {totalCount} complete
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Project Kit Download — prominent CTA */}
          {template?.project_kit_url && (
            <div className="mt-6 max-w-2xl mx-auto">
              <a
                href="/resources/project-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-gray-900 text-white rounded-xl px-5 py-4 hover:bg-gray-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Download size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Download Project Kit</p>
                  <p className="text-xs text-gray-400">
                    Everything you need for Day 1 &mdash; frameworks, templates, and conversation starters
                  </p>
                </div>
                <ArrowRight size={18} className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Checklist */}
          <div className="mt-4 max-w-2xl mx-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
            {CHECKLIST_ITEMS.map((item) => {
              // Resolve action URLs from template
              let actionUrl = item.actionUrl || "#";
              let actionLabel = item.actionLabel;
              if (item.id === "companion" && template?.setup_companion_video_url) {
                actionUrl = "/resources/video-setup-companion";
              } else if (item.id === "calendar") {
                actionUrl = "#schedule";
                actionLabel = "View schedule";
              } else if (item.id === "project-kit") {
                // Handled by the prominent CTA above
                return null;
              }
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className="mt-0.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                  >
                    {checkedItems.has(item.id) ? (
                      <CheckCircle2 size={20} className="text-success" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.isBonus && (
                        <Settings size={14} className="text-gray-400" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          checkedItems.has(item.id)
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.isBonus && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500 uppercase">
                          Bonus Resource
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {actionLabel && (
                    <a
                      href={actionUrl}
                      target={actionUrl.startsWith("#") ? undefined : "_blank"}
                      rel={actionUrl.startsWith("#") ? undefined : "noopener noreferrer"}
                      className="text-xs text-primary font-medium hover:text-primary-hover flex items-center gap-1 whitespace-nowrap"
                    >
                      {actionLabel}
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Come Prepared expandable */}
          <div className="mt-6 max-w-2xl mx-auto">
            <button
              onClick={() => setPrepareOpen(!prepareOpen)}
              className="w-full bg-gray-900 text-white rounded-xl px-5 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-semibold">Come Prepared</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  Highly Recommended
                </span>
              </div>
              {prepareOpen ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {prepareOpen && (
              <div className="border border-gray-200 border-t-0 rounded-b-xl p-6">
                <p className="text-sm text-gray-600">
                  You were selected for this sprint because of{" "}
                  <strong>your expertise</strong>. The more you&apos;ve thought
                  through your workflows beforehand, the faster your workshops
                  will go.
                </p>

                {/* Workflow explainer */}
                <div className="mt-6 bg-gray-50 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-gray-900 text-center">
                    What&apos;s a Workflow?
                  </h4>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    A repeatable unit of work with a clear trigger and defined
                    outcome
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                      <Sparkles size={10} />
                      Trigger
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-1">
                      <FileText size={10} />
                      Steps
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Done
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-success" />
                        A workflow HAS
                      </p>
                      <ul className="mt-1 text-xs text-gray-600 space-y-0.5">
                        <li>· A clear trigger</li>
                        <li>· One or more steps</li>
                        <li>· A known end state</li>
                        <li>· Repeats regularly</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        ✕ NOT a workflow
                      </p>
                      <ul className="mt-1 text-xs text-gray-400 space-y-0.5">
                        <li>· A role (&quot;Sales follows up&quot;)</li>
                        <li>· A tool (&quot;We use HubSpot&quot;)</li>
                        <li>· A project (&quot;Improve onboarding&quot;)</li>
                        <li>· Vague activity (&quot;Review data&quot;)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Preparation cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <FileText size={14} />
                      Have Docs? Bring Them
                    </h5>
                    <ul className="mt-2 text-xs text-gray-600 space-y-1.5">
                      <li className="flex items-center gap-1.5">
                        <FileText size={10} className="text-gray-400" />
                        SOPs &amp; Checklists
                      </li>
                      <li className="flex items-center gap-1.5">
                        <FileText size={10} className="text-gray-400" />
                        Process diagrams
                      </li>
                      <li className="flex items-center gap-1.5">
                        <FileText size={10} className="text-gray-400" />
                        Ownership matrices
                      </li>
                      <li className="flex items-center gap-1.5">
                        <FileText size={10} className="text-gray-400" />
                        Runbooks
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      💡 No Docs? No Problem
                    </h5>
                    <ul className="mt-2 text-xs text-gray-600 space-y-1.5">
                      <li>✏️ Notepad jottings</li>
                      <li>📋 Mental list of recurring tasks</li>
                      <li>📸 Screenshots of your tools</li>
                      <li>🧠 Quick brain-dump of your week</li>
                    </ul>
                    <p className="mt-2 text-[10px] text-gray-400 italic">
                      Any preparation helps accelerate your progress
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Setup Videos */}
          {template && (
            <div className="mt-8 max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-900 text-center mb-4">
                Setup Videos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    title: "Setting Up Your Companion",
                    duration: "~10 min",
                    available: !!template.setup_companion_video_url,
                    href: "/resources/video-setup-companion",
                  },
                  {
                    title: "Utilizing Conversation Starters",
                    duration: "~5 min",
                    available: !!template.conversation_starters_video_url,
                    href: "/resources/video-conversation-starters",
                  },
                  {
                    title: "Completing Each Day's Workshop",
                    duration: "~5 min",
                    available: !!template.daily_workflow_video_url,
                    href: "/resources/video-daily-workflow",
                  },
                ].map((video) => (
                  <a
                    key={video.title}
                    href={video.available ? video.href : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block rounded-xl p-4 text-center transition-all card-hover",
                      video.available
                        ? "bg-gray-900 text-white hover:shadow-lg"
                        : "bg-gray-100 pointer-events-none opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3",
                      video.available ? "bg-primary/20" : "bg-gray-200"
                    )}>
                      <Play size={18} className={cn(
                        "ml-0.5",
                        video.available ? "text-primary" : "text-gray-400"
                      )} />
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      video.available ? "text-white" : "text-gray-900"
                    )}>
                      {video.title}
                    </p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      video.available ? "text-gray-400" : "text-gray-500"
                    )}>
                      {video.duration}
                    </p>
                    {!video.available && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Coming soon
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
