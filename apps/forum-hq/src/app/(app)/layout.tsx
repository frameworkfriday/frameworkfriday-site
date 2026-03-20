import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFacilitatorGroups } from "@/lib/auth/facilitator";
import { getUnreadCount, getNotifications } from "@/lib/notifications/fetch";
import { markNotificationRead, markAllNotificationsRead } from "./notifications/actions";
import Sidebar from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client for data queries (bypasses RLS — avoids session cookie edge cases)
  const admin = createAdminClient();

  // Fetch profile
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, email, avatar_url")
    .eq("id", user.id)
    .single();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  const isAdmin = !!roleRow;

  // Check facilitator groups
  const facilitatorGroups = await getFacilitatorGroups(user.id);
  const isFacilitator = facilitatorGroups.length > 0;

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.email
    : user.email;

  // Fetch group name for personalized nav label
  const { data: membership } = await admin
    .from("forum_group_members")
    .select("forum_groups(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  const groupName = (membership?.forum_groups as unknown as { name: string } | null)?.name ?? null;

  // Fetch notifications for bell icon
  const [notificationCount, recentNotifications] = await Promise.all([
    getUnreadCount(user.id),
    getNotifications(user.id, 10),
  ]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F7F6" }}>
      <Sidebar
        userEmail={user.email}
        userName={userName ?? undefined}
        avatarUrl={profile?.avatar_url ?? undefined}
        isAdmin={isAdmin}
        isFacilitator={isFacilitator}
        facilitatorGroups={facilitatorGroups}
        groupName={groupName ?? undefined}
        notificationCount={notificationCount}
        notifications={recentNotifications}
        markReadAction={markNotificationRead}
        markAllReadAction={markAllNotificationsRead}
      />
      {/* Frosted top bar for mobile — sits behind hamburger */}
      <div className="mobile-top-bar" />
      <main
        className="app-main"
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          padding: "32px 40px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
