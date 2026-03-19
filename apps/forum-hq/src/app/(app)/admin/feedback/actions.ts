"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleRow) return null;
  return { user, admin };
}

export async function getAllFeedback(statusFilter?: string) {
  const ctx = await requireAdmin();
  if (!ctx) return [];

  const { admin } = ctx;

  let query = admin
    .from("member_feedback")
    .select(`
      *,
      profiles!member_feedback_user_id_fkey(id, first_name, last_name, email, avatar_url),
      forum_groups!member_feedback_forum_group_id_fkey(id, name),
      assigned_profile:profiles!member_feedback_assigned_to_fkey(id, first_name, last_name)
    `)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;
  return data ?? [];
}

export async function updateFeedbackStatus(id: string, status: string) {
  const ctx = await requireAdmin();
  if (!ctx) return;

  const { admin } = ctx;

  const updates: Record<string, unknown> = { status };
  if (status === "acknowledged") updates.acknowledged_at = new Date().toISOString();
  if (status === "resolved") updates.resolved_at = new Date().toISOString();

  await admin.from("member_feedback").update(updates).eq("id", id);
  revalidatePath("/admin/feedback");
}

export async function assignFeedback(id: string, assignedTo: string) {
  const ctx = await requireAdmin();
  if (!ctx) return;

  const { admin } = ctx;
  await admin.from("member_feedback").update({
    assigned_to: assignedTo || null,
  }).eq("id", id);

  revalidatePath("/admin/feedback");
}

export async function addFacilitatorNote(id: string, note: string) {
  const ctx = await requireAdmin();
  if (!ctx) return;

  const { admin } = ctx;
  await admin.from("member_feedback").update({
    facilitator_note: note.trim() || null,
  }).eq("id", id);

  revalidatePath("/admin/feedback");
}

export async function addResolutionNote(id: string, note: string) {
  const ctx = await requireAdmin();
  if (!ctx) return;

  const { admin } = ctx;
  await admin.from("member_feedback").update({
    resolution_note: note.trim() || null,
  }).eq("id", id);

  revalidatePath("/admin/feedback");
}
