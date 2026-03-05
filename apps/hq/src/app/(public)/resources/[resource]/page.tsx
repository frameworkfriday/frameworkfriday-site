import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

// Resource key → template column mapping
const RESOURCE_MAP: Record<string, string> = {
  "project-kit": "project_kit_url",
  "submit-work": "submit_work_url",
  "conversation-starter-day1": "conversation_starter_day1_url",
  "conversation-starter-day2": "conversation_starter_day2_url",
  "conversation-starter-day3": "conversation_starter_day3_url",
  "video-setup-companion": "setup_companion_video_url",
  "video-daily-workflow": "daily_workflow_video_url",
  "video-conversation-starters": "conversation_starters_video_url",
};

interface Props {
  params: Promise<{ resource: string }>;
}

export default async function ResourceRedirect({ params }: Props) {
  const { resource } = await params;
  const column = RESOURCE_MAP[resource];

  if (!column) {
    notFound();
  }

  const supabase = await createClient();

  // Get latest published sprint's template
  const { data: sprint } = await supabase
    .from("sprints")
    .select("template_id")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (sprint?.template_id) {
    const { data: template } = await supabase
      .from("sprint_templates_public")
      .select(column)
      .eq("id", sprint.template_id)
      .single();

    const url = template?.[column as keyof typeof template] as string | null;
    if (url) {
      redirect(url);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Resource not available.</p>
    </div>
  );
}
