import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import DirectoryClient from "./DirectoryClient";

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all community-visible profiles (includes self)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, business_name, role_title, email, avatar_url, linkedin_url, website_url")
    .eq("community_visible", true)
    .order("last_name");

  return <DirectoryClient profiles={profiles ?? []} currentUserId={user.id} />;
}
