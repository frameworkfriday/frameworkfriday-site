import { createAdminClient } from "@/lib/supabase/admin";
import CommunicationsHub from "./CommunicationsHub";

export default async function AdminCommunicationsPage() {
  const admin = createAdminClient();

  // All posts (for announcements tab + sent history)
  const { data: posts } = await admin
    .from("posts")
    .select(
      "id, title, body, post_type, is_pinned, is_global, created_at, author_id, profiles(first_name, last_name, email), post_audiences(forum_group_id)"
    )
    .order("created_at", { ascending: false });

  // All groups (for compose form audience picker)
  const { data: groups } = await admin
    .from("forum_groups")
    .select("id, name")
    .order("name");

  // Member count per group (for sent history recipient display)
  const { data: memberCounts } = await admin
    .from("forum_group_members")
    .select("forum_group_id");

  // Total member count
  const { data: allProfiles } = await admin
    .from("profiles")
    .select("id")
    .is("archived_at", null);

  // Normalize profiles from array (Supabase join) to single object
  const normalized = (posts ?? []).map((p) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles,
  }));

  // Separate email blasts from regular announcements
  const emailBlasts = normalized.filter((p) =>
    p.title?.startsWith("[Email]")
  );
  const announcements = normalized.filter(
    (p) => !p.title?.startsWith("[Email]")
  );

  // Build group map and member count map
  const groupMap = Object.fromEntries(
    (groups ?? []).map((g) => [g.id, g.name])
  );
  const groupMemberCounts: Record<string, number> = {};
  for (const m of memberCounts ?? []) {
    groupMemberCounts[m.forum_group_id] =
      (groupMemberCounts[m.forum_group_id] || 0) + 1;
  }
  const totalMembers = (allProfiles ?? []).length;

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#FF4F1A",
            marginBottom: "6px",
          }}
        >
          Admin
        </div>
        <h1
          style={{
            fontWeight: 800,
            fontSize: "28px",
            color: "#0F0F0F",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Communications
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6E6E6E",
            margin: "6px 0 0",
          }}
        >
          Email blasts, announcements, and communication history.
        </p>
      </div>
      <CommunicationsHub
        emailBlasts={emailBlasts}
        announcements={announcements}
        groups={groups ?? []}
        groupMap={groupMap}
        groupMemberCounts={groupMemberCounts}
        totalMembers={totalMembers}
      />
    </div>
  );
}
