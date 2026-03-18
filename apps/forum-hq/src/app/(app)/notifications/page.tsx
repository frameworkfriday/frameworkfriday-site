import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getNotifications } from "@/lib/notifications/fetch";
import { markNotificationRead, markAllNotificationsRead } from "./actions";
import NotificationsList from "./NotificationsList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const notifications = await getNotifications(user.id, 50);

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-syne)", color: "#0F0F0F", margin: 0 }}>
            Notifications
          </h1>
          <p style={{ fontSize: "13px", color: "#6E6E6E", margin: "4px 0 0" }}>
            Stay up to date with activity in your Forum community.
          </p>
        </div>
      </div>

      <NotificationsList
        notifications={notifications}
        markReadAction={markNotificationRead}
        markAllReadAction={markAllNotificationsRead}
      />
    </div>
  );
}
