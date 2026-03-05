import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { TemplatesList } from "@/components/admin/templates/templates-list";

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("sprint_templates")
    .select("id, name, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Templates"
        description="Manage reusable sprint templates with shared resources and schedule configuration."
      />

      <TemplatesList templates={templates ?? []} />
    </>
  );
}
