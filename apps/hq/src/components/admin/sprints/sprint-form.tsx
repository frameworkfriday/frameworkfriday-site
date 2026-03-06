"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Sprint } from "@/lib/types/sprint";
import { Save, Check, AlertCircle } from "lucide-react";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

interface SprintFormProps {
  sprint?: Sprint;
  templates: { id: string; name: string }[];
}

function generateSlug(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d
    .toLocaleDateString("en-US", { month: "short" })
    .toLowerCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
}

function generateTitle(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `Decision Sprint – ${d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function SprintForm({ sprint, templates }: SprintFormProps) {
  const router = useRouter();
  const isEditing = !!sprint;

  const [startDate, setStartDate] = useState(sprint?.start_date ?? "");
  const [timezone, setTimezone] = useState(
    sprint?.timezone ?? "America/New_York"
  );
  const [sessionTime, setSessionTime] = useState(
    sprint?.session_time ?? "13:00"
  );
  const [templateId, setTemplateId] = useState(sprint?.template_id ?? "");
  const [status, setStatus] = useState<string>(sprint?.status ?? "draft");
  const [title, setTitle] = useState(sprint?.title ?? "");
  const [slug, setSlug] = useState(sprint?.slug ?? "");

  // Sprint-specific links
  const [zoomDay1, setZoomDay1] = useState(sprint?.zoom_url_day1 ?? "");
  const [zoomDay2, setZoomDay2] = useState(sprint?.zoom_url_day2 ?? "");
  const [zoomDay3, setZoomDay3] = useState(sprint?.zoom_url_day3 ?? "");
  const [calendarUrl, setCalendarUrl] = useState(sprint?.calendar_url ?? "");
  const [communityUrl, setCommunityUrl] = useState(
    sprint?.community_url ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | null>(null);

  // Auto-generate title/slug when date changes (only for new sprints)
  const handleDateChange = (date: string) => {
    setStartDate(date);
    if (!isEditing && date) {
      setTitle(generateTitle(date));
      setSlug(generateSlug(date));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      title,
      slug,
      start_date: startDate,
      timezone,
      session_time: sessionTime,
      template_id: templateId || null,
      status,
      zoom_url_day1: zoomDay1 || null,
      zoom_url_day2: zoomDay2 || null,
      zoom_url_day3: zoomDay3 || null,
      calendar_url: calendarUrl || null,
      community_url: communityUrl || null,
    };

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("sprints")
        .update(payload)
        .eq("id", sprint.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("sprints")
        .insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    if (isEditing) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 3000);
      router.refresh();
    } else {
      router.push("/admin/sprints");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Sprint Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Sprint Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Decision Sprint – March 2, 2026"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Slug
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mar-2-2026"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start Date (Monday)
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Session Time
            </label>
            <Input
              type="time"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Timezone
            </label>
            <Select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Template
            </label>
            <Select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">No template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Sprint-Specific Links */}
      {isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Sprint-Specific Links
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Zoom Meeting URL — Day 1
              </label>
              <Input
                type="url"
                value={zoomDay1}
                onChange={(e) => setZoomDay1(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Zoom Meeting URL — Day 2
              </label>
              <Input
                type="url"
                value={zoomDay2}
                onChange={(e) => setZoomDay2(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Zoom Meeting URL — Day 3
              </label>
              <Input
                type="url"
                value={zoomDay3}
                onChange={(e) => setZoomDay3(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Calendar Link
              </label>
              <Input
                type="url"
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                placeholder="https://calendar.google.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sprint Group URL
              </label>
              <Input
                type="url"
                value={communityUrl}
                onChange={(e) => setCommunityUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          <Save size={16} />
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Sprint"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/sprints")}
        >
          Cancel
        </Button>
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-sm text-success font-medium">
            <Check size={16} />
            Saved
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-sm text-danger font-medium">
            <AlertCircle size={16} />
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
