import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type {
  Sprint,
  SprintTemplatePublic,
  SprintDailyRecap,
} from "@/lib/types/sprint";
import { formatSprintDateRange } from "@/lib/sprint-utils";
import { SprintPageClient } from "@/components/sprint/sprint-page-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Decision Sprint HQ — ${slug}`,
  };
}

export default async function SprintPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch sprint by slug
  const { data: sprint } = await supabase
    .from("sprints")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single<Sprint>();

  if (!sprint) {
    notFound();
  }

  // Fetch template (public mirror)
  let template: SprintTemplatePublic | null = null;
  if (sprint.template_id) {
    const { data } = await supabase
      .from("sprint_templates_public")
      .select("*")
      .eq("id", sprint.template_id)
      .single<SprintTemplatePublic>();
    template = data;
  }

  // Fetch published daily recaps
  const { data: recaps } = await supabase
    .from("sprint_daily_recaps")
    .select("*")
    .eq("sprint_id", sprint.id)
    .eq("is_published", true)
    .order("day_number", { ascending: true })
    .returns<SprintDailyRecap[]>();

  const dateRange = formatSprintDateRange(sprint.start_date);

  return (
    <SprintPageClient
      sprint={sprint}
      template={template}
      recaps={recaps || []}
      dateRange={dateRange}
    />
  );
}
