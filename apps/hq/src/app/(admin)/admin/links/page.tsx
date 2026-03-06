import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { LinksHub } from "@/components/admin/links/links-hub";

export default async function LinksPage() {
  const supabase = await createClient();

  const [templatesRes, sprintsRes] = await Promise.all([
    supabase
      .from("sprint_templates")
      .select(
        "id, name, updated_at, project_kit_url, submit_work_url, submit_work_embed_url, booking_url_day4, claude_signup_url, setup_companion_video_url, daily_workflow_video_url, conversation_starters_video_url, conversation_starter_day1_url, conversation_starter_day2_url, conversation_starter_day3_url"
      )
      .eq("is_active", true),
    supabase
      .from("sprints")
      .select(
        "id, title, slug, updated_at, zoom_url_day1, zoom_url_day2, zoom_url_day3, calendar_url, community_url, status"
      )
      .in("status", ["published", "draft"])
      .order("start_date", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Links"
        description="Quick-copy hub for all template and sprint links."
      />

      <LinksHub
        templates={templatesRes.data ?? []}
        sprints={sprintsRes.data ?? []}
      />
    </>
  );
}
