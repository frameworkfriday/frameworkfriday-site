"use server";

import { createClient } from "@/lib/supabase/server";
import { markAsRead, markAllAsRead } from "@/lib/notifications/fetch";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;
  if (!id) return;

  await markAsRead(id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await markAllAsRead(user.id);
  revalidatePath("/notifications");
}
