"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Verify the current user is an admin (server-side, bypasses RLS)
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!data) throw new Error("Not authorized");
  return user.id;
}

// ─── Admin User Management ───

export interface AdminUser {
  role_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string; // when the role was granted
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  await requireAdmin();
  const admin = createAdminClient();

  // Get all admin roles
  const { data: roles, error } = await admin
    .from("user_roles")
    .select("id, user_id, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!roles || roles.length === 0) return [];

  // Look up user details from auth.users via the admin API
  const users: AdminUser[] = [];
  for (const role of roles) {
    const { data } = await admin.auth.admin.getUserById(role.user_id);
    users.push({
      role_id: role.id,
      user_id: role.user_id,
      email: data.user?.email ?? null,
      full_name: (data.user?.user_metadata?.full_name as string) ?? null,
      avatar_url: (data.user?.user_metadata?.avatar_url as string) ?? null,
      created_at: role.created_at,
    });
  }

  return users;
}

export async function addAdminByEmail(email: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  // Find user by email using the admin API
  // listUsers with a filter — Supabase admin API doesn't support email filter directly,
  // so we list and find. For small user bases this is fine.
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) return { error: listError.message };

  const targetUser = listData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!targetUser) {
    return { error: "No account found with that email. They need to sign in with Google first." };
  }

  // Check if already an admin
  const { data: existing } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", targetUser.id)
    .eq("role", "admin")
    .single();

  if (existing) {
    return { error: "This user is already an admin." };
  }

  // Insert the role
  const { error: insertError } = await admin.from("user_roles").insert({
    user_id: targetUser.id,
    role: "admin",
  });

  if (insertError) return { error: insertError.message };
  return { success: true };
}

export async function removeAdmin(roleId: string): Promise<{ success: true } | { error: string }> {
  const currentUserId = await requireAdmin();
  const admin = createAdminClient();

  // Prevent removing yourself
  const { data: role } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("id", roleId)
    .single();

  if (role?.user_id === currentUserId) {
    return { error: "You cannot remove your own admin access." };
  }

  const { error } = await admin.from("user_roles").delete().eq("id", roleId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function saveRecap(payload: {
  id: string | null;
  sprint_id: string;
  day_number: number;
  is_published: boolean;
  recording_url: string | null;
  recap_summary: string | null;
  key_takeaways: string | null;
  resources: unknown[] | null;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const row = {
    sprint_id: payload.sprint_id,
    day_number: payload.day_number,
    is_published: payload.is_published,
    recording_url: payload.recording_url,
    recap_summary: payload.recap_summary,
    key_takeaways: payload.key_takeaways,
    resources: payload.resources,
    published_at: payload.is_published ? new Date().toISOString() : null,
  };

  if (payload.id) {
    const { error } = await admin
      .from("sprint_daily_recaps")
      .update(row)
      .eq("id", payload.id);

    if (error) throw new Error(error.message);
    return { id: payload.id };
  } else {
    const { data, error } = await admin
      .from("sprint_daily_recaps")
      .insert(row)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: data.id };
  }
}
