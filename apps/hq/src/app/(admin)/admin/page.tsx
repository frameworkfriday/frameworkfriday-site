import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { StatsCards } from "@/components/admin/dashboard/stats-cards";
import { SprintCalendar } from "@/components/admin/dashboard/sprint-calendar";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch stats in parallel
  const [sprintsRes, templatesRes, publishedRes, upcomingRes] =
    await Promise.all([
      supabase
        .from("sprints")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("sprint_templates")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("sprints")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("sprints")
        .select("id", { count: "exact", head: true })
        .gte("start_date", new Date().toISOString().split("T")[0]),
    ]);

  const stats = {
    totalSprints: sprintsRes.count ?? 0,
    activeSprints: publishedRes.count ?? 0,
    upcomingSprints: upcomingRes.count ?? 0,
    templates: templatesRes.count ?? 0,
  };

  // Fetch sprints for calendar view (last 3 months + next 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAhead = new Date();
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  const { data: calendarSprints } = await supabase
    .from("sprints")
    .select("id, title, slug, start_date, status")
    .gte("start_date", threeMonthsAgo.toISOString().split("T")[0])
    .lte("start_date", threeMonthsAhead.toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your Decision Sprint program."
        action={
          <Link
            href="/admin/sprints"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Manage sprints &rarr;
          </Link>
        }
      />

      <StatsCards stats={stats} />
      <SprintCalendar sprints={calendarSprints ?? []} />
    </>
  );
}
