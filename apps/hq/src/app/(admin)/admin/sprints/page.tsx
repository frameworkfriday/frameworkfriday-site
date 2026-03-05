import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { SprintsList } from "@/components/admin/sprints/sprints-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function SprintsPage() {
  const supabase = await createClient();

  const { data: sprints } = await supabase
    .from("sprints")
    .select(
      "id, title, slug, start_date, timezone, session_time, status, template_id, created_at"
    )
    .order("start_date", { ascending: false });

  const { data: templates } = await supabase
    .from("sprint_templates")
    .select("id, name")
    .eq("is_active", true);

  // Build template name lookup
  const templateNames: Record<string, string> = {};
  templates?.forEach((t) => {
    templateNames[t.id] = t.name;
  });

  return (
    <>
      <PageHeader
        title="Sprints"
        description="Manage your Decision Sprint cohorts."
        action={
          <Link href="/admin/sprints/new">
            <Button size="sm">
              <Plus size={16} />
              New Sprint
            </Button>
          </Link>
        }
      />

      <SprintsList
        sprints={sprints ?? []}
        templateNames={templateNames}
      />
    </>
  );
}
