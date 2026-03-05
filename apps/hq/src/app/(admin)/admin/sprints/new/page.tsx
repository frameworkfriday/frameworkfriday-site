import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { SprintForm } from "@/components/admin/sprints/sprint-form";
import Link from "next/link";

export default async function NewSprintPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("sprint_templates")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <>
      <PageHeader
        title="New Sprint"
        description="Create a new Decision Sprint cohort."
        action={
          <Link
            href="/admin/sprints"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            &larr; Back to sprints
          </Link>
        }
      />

      <SprintForm templates={templates ?? []} />
    </>
  );
}
