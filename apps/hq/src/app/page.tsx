import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Root page: redirect to the latest published sprint
export default async function Home() {
  const supabase = await createClient();

  const { data: sprint } = await supabase
    .from("sprints")
    .select("slug")
    .eq("status", "published")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (sprint) {
    redirect(`/${sprint.slug}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Decision Sprint HQ</h1>
        <p className="mt-2 text-gray-500">No active sprints at this time.</p>
      </div>
    </div>
  );
}
