import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load existing profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, business_name, role_title, linkedin_url, website_url")
    .eq("id", user.id)
    .single();

  // Get group from membership table
  const { data: membership } = await supabase
    .from("forum_group_members")
    .select("forum_group_id, forum_groups(id, name)")
    .eq("user_id", user.id)
    .single();

  const groupInfo = membership?.forum_groups as unknown as { id: string; name: string } | null;
  const groupName = groupInfo?.name ?? null;
  const groupId = membership?.forum_group_id ?? null;

  // Member count for welcome step social proof
  const { count: memberCount } = groupId
    ? await supabase
        .from("forum_group_members")
        .select("user_id", { count: "exact", head: true })
        .eq("forum_group_id", groupId)
    : { count: null };

  // Next upcoming session for the all-set step
  const { data: nextSession } = groupId
    ? await supabase
        .from("sessions")
        .select("title, starts_at, session_type")
        .eq("forum_group_id", groupId)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(1)
        .single()
    : { data: null };

  return (
    <OnboardingClient
      userId={user.id}
      email={user.email ?? ""}
      initialProfile={{
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        businessName: profile?.business_name ?? "",
        roleTitle: profile?.role_title ?? "",
        linkedinUrl: profile?.linkedin_url ?? "",
        websiteUrl: profile?.website_url ?? "",
      }}
      groupName={groupName}
      memberCount={memberCount ?? null}
      nextSession={nextSession ?? null}
    />
  );
}
