import { getAllFeedback } from "./actions";
import AdminFeedbackClient from "./AdminFeedbackClient";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleRow) redirect("/");

  // Fetch all profiles for assignment dropdown
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, email")
    .order("last_name");

  const feedbackItems = await getAllFeedback();

  return (
    <AdminFeedbackClient
      initialFeedback={feedbackItems}
      profiles={profiles ?? []}
    />
  );
}
