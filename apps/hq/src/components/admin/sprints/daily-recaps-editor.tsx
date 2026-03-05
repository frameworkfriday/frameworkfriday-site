"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SprintDailyRecap, RecapResource } from "@/lib/types/sprint";
import { Save, Radio, Upload, Trash2, Plus, ExternalLink } from "lucide-react";

interface DailyRecapsEditorProps {
  sprintId: string;
  recaps: SprintDailyRecap[];
}

const DAYS = [1, 2, 3, 4];

export function DailyRecapsEditor({
  sprintId,
  recaps,
}: DailyRecapsEditorProps) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(1);

  // Initialize state for each day
  const [dayStates, setDayStates] = useState(() => {
    const states: Record<
      number,
      {
        id: string | null;
        isPublished: boolean;
        recordingUrl: string;
        recapSummary: string;
        keyTakeaways: string;
        resources: RecapResource[];
        saving: boolean;
      }
    > = {};

    DAYS.forEach((day) => {
      const recap = recaps.find((r) => r.day_number === day);
      states[day] = {
        id: recap?.id ?? null,
        isPublished: recap?.is_published ?? false,
        recordingUrl: recap?.recording_url ?? "",
        recapSummary: recap?.recap_summary ?? "",
        keyTakeaways: recap?.key_takeaways ?? "",
        resources: recap?.resources ?? [],
        saving: false,
      };
    });

    return states;
  });

  const updateDay = (
    day: number,
    updates: Partial<(typeof dayStates)[number]>
  ) => {
    setDayStates((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const addResource = (day: number) => {
    const current = dayStates[day];
    updateDay(day, {
      resources: [
        ...current.resources,
        {
          id: crypto.randomUUID(),
          name: "",
          url: "",
          type: "link" as const,
        },
      ],
    });
  };

  const updateResource = (
    day: number,
    resourceId: string,
    field: keyof RecapResource,
    value: string
  ) => {
    const current = dayStates[day];
    updateDay(day, {
      resources: current.resources.map((r) =>
        r.id === resourceId ? { ...r, [field]: value } : r
      ),
    });
  };

  const removeResource = (day: number, resourceId: string) => {
    const current = dayStates[day];
    updateDay(day, {
      resources: current.resources.filter((r) => r.id !== resourceId),
    });
  };

  const handleFileUpload = async (day: number, file: File) => {
    const supabase = createClient();
    const filePath = `${sprintId}/day-${day}/${file.name}`;

    const { error } = await supabase.storage
      .from("recap-resources")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert(`Upload failed: ${error.message}`);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("recap-resources").getPublicUrl(filePath);

    const current = dayStates[day];
    updateDay(day, {
      resources: [
        ...current.resources,
        {
          id: crypto.randomUUID(),
          name: file.name,
          url: publicUrl,
          type: "file" as const,
        },
      ],
    });
  };

  const saveDay = async (day: number) => {
    updateDay(day, { saving: true });
    const state = dayStates[day];
    const supabase = createClient();

    const payload = {
      sprint_id: sprintId,
      day_number: day,
      is_published: state.isPublished,
      recording_url: state.recordingUrl || null,
      recap_summary: state.recapSummary || null,
      key_takeaways: state.keyTakeaways || null,
      resources: state.resources.length > 0 ? state.resources : null,
      published_at: state.isPublished ? new Date().toISOString() : null,
    };

    if (state.id) {
      await supabase
        .from("sprint_daily_recaps")
        .update(payload)
        .eq("id", state.id);
    } else {
      const { data } = await supabase
        .from("sprint_daily_recaps")
        .insert(payload)
        .select("id")
        .single();

      if (data) {
        updateDay(day, { id: data.id });
      }
    }

    updateDay(day, { saving: false });
    router.refresh();
  };

  const current = dayStates[activeDay];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Daily Recaps</h2>
        <p className="text-sm text-gray-500 mt-1">
          Publish session recaps for each day.
        </p>
      </div>

      {/* Day tabs */}
      <div className="flex border-b border-gray-200">
        {DAYS.map((day) => {
          const dayState = dayStates[day];
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeDay === day
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Day {day}
              {dayState.isPublished && (
                <Radio size={12} className="text-success" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day content */}
      <div className="p-6 space-y-5">
        {/* Published toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={current.isPublished}
              onChange={(e) =>
                updateDay(activeDay, { isPublished: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50"
            />
            <span className="text-sm font-medium text-gray-700">
              Published
            </span>
          </label>
          {current.isPublished && (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <Radio size={10} />
              Live
            </span>
          )}
        </div>

        {/* Recording URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Recording URL
          </label>
          <Input
            type="url"
            value={current.recordingUrl}
            onChange={(e) =>
              updateDay(activeDay, { recordingUrl: e.target.value })
            }
            placeholder="https://zoom.us/rec/..."
          />
        </div>

        {/* Recap Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Session Highlights
          </label>
          <Textarea
            value={current.recapSummary}
            onChange={(e) =>
              updateDay(activeDay, { recapSummary: e.target.value })
            }
            placeholder="Markdown supported. Summarize what was covered..."
            rows={5}
          />
        </div>

        {/* Key Takeaways */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Key Takeaways
          </label>
          <Textarea
            value={current.keyTakeaways}
            onChange={(e) =>
              updateDay(activeDay, { keyTakeaways: e.target.value })
            }
            placeholder="Markdown supported. Key insights from the session..."
            rows={4}
          />
        </div>

        {/* Resources */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Additional Resources
          </label>

          {current.resources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center gap-2 mb-2"
            >
              <Input
                value={resource.name}
                onChange={(e) =>
                  updateResource(
                    activeDay,
                    resource.id,
                    "name",
                    e.target.value
                  )
                }
                placeholder="Resource name"
                className="flex-1"
              />
              <Input
                value={resource.url}
                onChange={(e) =>
                  updateResource(
                    activeDay,
                    resource.id,
                    "url",
                    e.target.value
                  )
                }
                placeholder="URL"
                className="flex-1"
              />
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={() => removeResource(activeDay, resource.id)}
                className="p-2 text-gray-400 hover:text-danger transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addResource(activeDay)}
            >
              <Plus size={14} />
              Add Link
            </Button>
            <label className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById(`file-upload-${activeDay}`)?.click()
                }
              >
                <Upload size={14} />
                Upload File
              </Button>
              <input
                id={`file-upload-${activeDay}`}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(activeDay, file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="pt-4 border-t border-gray-100">
          <Button
            type="button"
            onClick={() => saveDay(activeDay)}
            disabled={current.saving}
          >
            <Save size={16} />
            {current.saving ? "Saving..." : `Save Day ${activeDay}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
