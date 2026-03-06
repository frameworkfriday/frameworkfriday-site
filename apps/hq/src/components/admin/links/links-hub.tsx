"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Clock } from "lucide-react";
import { formatRelativeTime, formatFullTimestamp } from "@/lib/format-time";

interface TemplateLinks {
  id: string;
  name: string;
  updated_at: string;
  project_kit_url: string | null;
  submit_work_url: string | null;
  submit_work_embed_url: string | null;
  booking_url_day4: string | null;
  claude_signup_url: string | null;
  setup_companion_video_url: string | null;
  daily_workflow_video_url: string | null;
  conversation_starters_video_url: string | null;
  conversation_starter_day1_url: string | null;
  conversation_starter_day2_url: string | null;
  conversation_starter_day3_url: string | null;
}

interface SprintLinks {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
  zoom_url_day1: string | null;
  zoom_url_day2: string | null;
  zoom_url_day3: string | null;
  calendar_url: string | null;
  community_url: string | null;
  status: string;
}

interface LinksHubProps {
  templates: TemplateLinks[];
  sprints: SprintLinks[];
}

type Tab = "template" | "sprint";

function LinkRow({
  label,
  url,
  brandedUrl,
}: {
  label: string;
  url: string | null;
  brandedUrl?: string;
}) {
  const [copied, setCopied] = useState<"direct" | "branded" | null>(null);

  if (!url) return null;

  const copyToClipboard = async (text: string, type: "direct" | "branded") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{url}</p>
      </div>
      <div className="flex items-center gap-1.5 ml-4">
        {brandedUrl && (
          <button
            onClick={() => copyToClipboard(brandedUrl, "branded")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            title="Copy branded URL"
          >
            {copied === "branded" ? <Check size={12} /> : <Copy size={12} />}
            Branded
          </button>
        )}
        <button
          onClick={() => copyToClipboard(url, "direct")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
          title="Copy direct URL"
        >
          {copied === "direct" ? <Check size={12} /> : <Copy size={12} />}
          Direct
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

export function LinksHub({ templates, sprints }: LinksHubProps) {
  const [tab, setTab] = useState<Tab>("template");
  const [selectedSprint, setSelectedSprint] = useState(sprints[0]?.id ?? "");

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const selectedSprintData = sprints.find((s) => s.id === selectedSprint);
  const activeTemplate = templates[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("template")}
          className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
            tab === "template"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Template Links
        </button>
        <button
          onClick={() => setTab("sprint")}
          className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
            tab === "sprint"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sprint Links
        </button>
      </div>

      <div className="p-6">
        {tab === "template" && activeTemplate && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Shared links from template:{" "}
                <span className="font-medium text-gray-700">
                  {activeTemplate.name}
                </span>
              </p>
              <span
                className="flex items-center gap-1 text-xs text-gray-400"
                title={formatFullTimestamp(activeTemplate.updated_at)}
              >
                <Clock size={11} />
                Updated {formatRelativeTime(activeTemplate.updated_at)}
              </span>
            </div>

            <div>
              <LinkRow
                label="Project Kit"
                url={activeTemplate.project_kit_url}
                brandedUrl={`${origin}/resources/project-kit`}
              />
              <LinkRow
                label="Submit Work"
                url={activeTemplate.submit_work_url}
                brandedUrl={`${origin}/submit`}
              />
              <LinkRow
                label="Submit Work (Embed)"
                url={activeTemplate.submit_work_embed_url}
                brandedUrl={`${origin}/resources/submit-work`}
              />
              <LinkRow
                label="Day 4 Booking"
                url={activeTemplate.booking_url_day4}
              />
              <LinkRow
                label="Claude Signup"
                url={activeTemplate.claude_signup_url}
              />
              <LinkRow
                label="Video: Setting Up Companion"
                url={activeTemplate.setup_companion_video_url}
                brandedUrl={`${origin}/resources/video-setup-companion`}
              />
              <LinkRow
                label="Video: Daily Workflow"
                url={activeTemplate.daily_workflow_video_url}
                brandedUrl={`${origin}/resources/video-daily-workflow`}
              />
              <LinkRow
                label="Video: Conversation Starters"
                url={activeTemplate.conversation_starters_video_url}
                brandedUrl={`${origin}/resources/video-conversation-starters`}
              />
              <LinkRow
                label="Conversation Starter — Day 1"
                url={activeTemplate.conversation_starter_day1_url}
                brandedUrl={`${origin}/resources/conversation-starter-day1`}
              />
              <LinkRow
                label="Conversation Starter — Day 2"
                url={activeTemplate.conversation_starter_day2_url}
                brandedUrl={`${origin}/resources/conversation-starter-day2`}
              />
              <LinkRow
                label="Conversation Starter — Day 3"
                url={activeTemplate.conversation_starter_day3_url}
                brandedUrl={`${origin}/resources/conversation-starter-day3`}
              />
            </div>
          </div>
        )}

        {tab === "template" && !activeTemplate && (
          <p className="text-sm text-gray-400 text-center py-8">
            No active templates.
          </p>
        )}

        {tab === "sprint" && (
          <div>
            {sprints.length > 0 ? (
              <>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Sprint
                  </label>
                  <select
                    value={selectedSprint}
                    onChange={(e) => setSelectedSprint(e.target.value)}
                    className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {sprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSprintData && (
                  <div>
                    <div className="flex justify-end mb-3">
                      <span
                        className="flex items-center gap-1 text-xs text-gray-400"
                        title={formatFullTimestamp(selectedSprintData.updated_at)}
                      >
                        <Clock size={11} />
                        Updated {formatRelativeTime(selectedSprintData.updated_at)}
                      </span>
                    </div>
                    <LinkRow
                      label="Sprint Page"
                      url={`${origin}/${selectedSprintData.slug}`}
                    />
                    <LinkRow
                      label="Zoom — Day 1"
                      url={selectedSprintData.zoom_url_day1}
                    />
                    <LinkRow
                      label="Zoom — Day 2"
                      url={selectedSprintData.zoom_url_day2}
                    />
                    <LinkRow
                      label="Zoom — Day 3"
                      url={selectedSprintData.zoom_url_day3}
                    />
                    <LinkRow
                      label="Calendar Link"
                      url={selectedSprintData.calendar_url}
                    />
                    <LinkRow
                      label="Sprint Group"
                      url={selectedSprintData.community_url}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No sprints available.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
