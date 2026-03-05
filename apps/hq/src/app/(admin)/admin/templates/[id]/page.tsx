import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { TemplateForm } from "@/components/admin/templates/template-form";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("sprint_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!template) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={`Edit: ${template.name}`}
        description="Update template configuration, shared links, videos, and conversation starters."
        action={
          <Link
            href="/admin/templates"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            &larr; Back to templates
          </Link>
        }
      />

      <TemplateForm template={template} />
    </>
  );
}
