import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// /submit → redirects to the submission form URL from the latest published sprint's template
export default async function SubmitRedirect() {
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
      .select("submit_work_url")
      .eq("id", sprint.template_id)
      .single();

    if (template?.submit_work_url) {
      redirect(template.submit_work_url);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Submission form not available.</p>
    </div>
  );
}
