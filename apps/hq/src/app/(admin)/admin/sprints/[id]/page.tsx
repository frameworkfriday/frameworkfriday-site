import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { SprintForm } from "@/components/admin/sprints/sprint-form";
import { DailyRecapsEditor } from "@/components/admin/sprints/daily-recaps-editor";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSprintPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [sprintRes, templatesRes, recapsRes] = await Promise.all([
    supabase.from("sprints").select("*").eq("id", id).single(),
    supabase
      .from("sprint_templates")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("sprint_daily_recaps")
      .select("*")
      .eq("sprint_id", id)
      .order("day_number"),
  ]);

  if (!sprintRes.data) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`Edit: ${sprintRes.data.title}`}
        description="Update sprint details, links, and daily recaps."
        action={
          <div className="flex items-center gap-3">
            <a
              href={`/${sprintRes.data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              View page &rarr;
            </a>
            <Link
              href="/admin/sprints"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              &larr; Back
            </Link>
          </div>
        }
      />

      <div className="space-y-8">
        <SprintForm
          sprint={sprintRes.data}
          templates={templatesRes.data ?? []}
        />

        <DailyRecapsEditor
          sprintId={id}
          recaps={recapsRes.data ?? []}
        />
      </div>
    </>
  );
}
