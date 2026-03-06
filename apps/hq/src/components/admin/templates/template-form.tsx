"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SprintTemplate } from "@/lib/types/sprint";
import { Save, Upload, Check, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { formatRelativeTime, formatFullTimestamp } from "@/lib/format-time";

interface TemplateFormProps {
  template: SprintTemplate;
}

export function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter();

  const [name, setName] = useState(template.name);
  const [isActive, setIsActive] = useState(template.is_active);
  const [scheduleConfig, setScheduleConfig] = useState(
    JSON.stringify(template.schedule_config, null, 2)
  );

  // Shared Links
  const [projectKitUrl, setProjectKitUrl] = useState(
    template.project_kit_url ?? ""
  );
  const [submitWorkUrl, setSubmitWorkUrl] = useState(
    template.submit_work_url ?? ""
  );
  const [submitWorkEmbedUrl, setSubmitWorkEmbedUrl] = useState(
    template.submit_work_embed_url ?? ""
  );
  const [bookingUrlDay4, setBookingUrlDay4] = useState(
    template.booking_url_day4 ?? ""
  );
  const [claudeSignupUrl, setClaudeSignupUrl] = useState(
    template.claude_signup_url ?? ""
  );

  // Videos
  const [setupCompanionVideo, setSetupCompanionVideo] = useState(
    template.setup_companion_video_url ?? ""
  );
  const [dailyWorkflowVideo, setDailyWorkflowVideo] = useState(
    template.daily_workflow_video_url ?? ""
  );
  const [conversationStartersVideo, setConversationStartersVideo] = useState(
    template.conversation_starters_video_url ?? ""
  );

  // Conversation Starters
  const [starterDay1, setStarterDay1] = useState(
    template.conversation_starter_day1_url ?? ""
  );
  const [starterDay2, setStarterDay2] = useState(
    template.conversation_starter_day2_url ?? ""
  );
  const [starterDay3, setStarterDay3] = useState(
    template.conversation_starter_day3_url ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    template.updated_at ?? null
  );

  const handleFileUpload = async (
    bucket: string,
    filePath: string,
    file: File,
    onSuccess: (url: string) => void
  ) => {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) {
      setError(`Upload failed: ${error.message}`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    onSuccess(publicUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setJsonError(null);

    // Validate JSON
    let parsedSchedule;
    try {
      parsedSchedule = JSON.parse(scheduleConfig);
    } catch {
      setJsonError("Invalid JSON in schedule configuration.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("sprint_templates")
      .update({
        name,
        is_active: isActive,
        schedule_config: parsedSchedule,
        project_kit_url: projectKitUrl || null,
        submit_work_url: submitWorkUrl || null,
        submit_work_embed_url: submitWorkEmbedUrl || null,
        booking_url_day4: bookingUrlDay4 || null,
        claude_signup_url: claudeSignupUrl || null,
        setup_companion_video_url: setupCompanionVideo || null,
        daily_workflow_video_url: dailyWorkflowVideo || null,
        conversation_starters_video_url: conversationStartersVideo || null,
        conversation_starter_day1_url: starterDay1 || null,
        conversation_starter_day2_url: starterDay2 || null,
        conversation_starter_day3_url: starterDay3 || null,
      })
      .eq("id", template.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const savedTime = new Date().toISOString();
    setSaving(false);
    setSaveStatus("saved");
    setLastSavedAt(savedTime);
    setTimeout(() => setSaveStatus(null), 3000);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Template Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Template Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50"
            />
            <span className="text-sm font-medium text-gray-700">
              Active (available for new sprints)
            </span>
          </label>
        </div>
      </div>

      {/* Schedule Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Schedule Configuration
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          JSON array defining the daily schedule structure.
        </p>

        <Textarea
          value={scheduleConfig}
          onChange={(e) => {
            setScheduleConfig(e.target.value);
            setJsonError(null);
          }}
          rows={12}
          className="font-mono text-sm"
        />
        {jsonError && (
          <p className="text-sm text-danger mt-2">{jsonError}</p>
        )}
      </div>

      {/* Shared Links */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Shared Links
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Kit URL
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="url"
                value={projectKitUrl}
                onChange={(e) => setProjectKitUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <label className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("project-kit-upload")?.click()
                  }
                >
                  <Upload size={14} />
                </Button>
                <input
                  id="project-kit-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(
                        "project-kits",
                        `${template.id}/${file.name}`,
                        file,
                        setProjectKitUrl
                      );
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Submit Work URL
            </label>
            <Input
              type="url"
              value={submitWorkUrl}
              onChange={(e) => setSubmitWorkUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Submit Work Embed URL
            </label>
            <Input
              type="url"
              value={submitWorkEmbedUrl}
              onChange={(e) => setSubmitWorkEmbedUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Day 4 Booking URL
            </label>
            <Input
              type="url"
              value={bookingUrlDay4}
              onChange={(e) => setBookingUrlDay4(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Claude Signup URL
            </label>
            <Input
              type="url"
              value={claudeSignupUrl}
              onChange={(e) => setClaudeSignupUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Videos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Setup Videos
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Setting Up Your Companion (Embed URL/Code)
            </label>
            <Textarea
              value={setupCompanionVideo}
              onChange={(e) => setSetupCompanionVideo(e.target.value)}
              placeholder="YouTube/Loom embed URL or iframe code"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Daily Workflow (Embed URL/Code)
            </label>
            <Textarea
              value={dailyWorkflowVideo}
              onChange={(e) => setDailyWorkflowVideo(e.target.value)}
              placeholder="YouTube/Loom embed URL or iframe code"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Conversation Starters (Embed URL/Code)
            </label>
            <Textarea
              value={conversationStartersVideo}
              onChange={(e) => setConversationStartersVideo(e.target.value)}
              placeholder="YouTube/Loom embed URL or iframe code"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Conversation Starters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Conversation Starters
        </h2>

        <div className="space-y-4">
          {[
            { label: "Day 1", value: starterDay1, setter: setStarterDay1 },
            { label: "Day 2", value: starterDay2, setter: setStarterDay2 },
            { label: "Day 3", value: starterDay3, setter: setStarterDay3 },
          ].map((starter) => (
            <div key={starter.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {starter.label} Conversation Starter
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  value={starter.value}
                  onChange={(e) => starter.setter(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document
                        .getElementById(
                          `starter-upload-${starter.label.replace(" ", "")}`
                        )
                        ?.click()
                    }
                  >
                    <Upload size={14} />
                  </Button>
                  <input
                    id={`starter-upload-${starter.label.replace(" ", "")}`}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(
                          "conversation-starters",
                          `${template.id}/${starter.label.toLowerCase().replace(" ", "-")}/${file.name}`,
                          file,
                          starter.setter
                        );
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Template"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/templates")}
          >
            Cancel
          </Button>
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-sm text-success font-medium animate-fade-in">
              <ShieldCheck size={16} />
              Saved successfully
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-sm text-danger font-medium">
              <AlertCircle size={16} />
              {error}
            </span>
          )}
        </div>
        {lastSavedAt && (
          <span
            className="flex items-center gap-1 text-xs text-gray-400"
            title={formatFullTimestamp(lastSavedAt)}
          >
            <Clock size={11} />
            Last updated {formatRelativeTime(lastSavedAt)}
          </span>
        )}
      </div>
    </form>
  );
}
