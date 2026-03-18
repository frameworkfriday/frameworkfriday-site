import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Verify caller is admin */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return role ? user : null;
}

/**
 * POST — Create a test user
 *
 * Body: { email?, password?, firstName?, lastName?, groupId?, onboardingProgress?: number }
 * - email defaults to test-{timestamp}@forum-hq.test
 * - password defaults to "TestUser123!"
 * - onboardingProgress: number of items to mark complete (0 = none)
 *
 * Returns: { userId, email, password }
 */
export async function POST(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const email = body.email || `test-${Date.now()}@forum-hq.test`;
  const password = body.password || "TestUser123!";
  const firstName = body.firstName || "Test";
  const lastName = body.lastName || "User";
  const groupId = body.groupId || null;
  const onboardingProgress = body.onboardingProgress ?? 0;

  const admin = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 400 });
  }

  const userId = authData.user.id;

  // Create profile
  await admin.from("profiles").upsert({
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    community_visible: true,
  });

  // Assign to group if specified
  if (groupId) {
    await admin.from("forum_group_members").insert({
      user_id: userId,
      forum_group_id: groupId,
      role: "member",
    });
  }

  // Seed partial onboarding progress
  if (onboardingProgress > 0) {
    const { data: items } = await admin
      .from("onboarding_items")
      .select("id")
      .order("position")
      .limit(onboardingProgress);

    if (items && items.length > 0) {
      const rows = items.map((item) => ({
        user_id: userId,
        item_id: item.id,
        completed_at: new Date().toISOString(),
        completed_by: userId,
      }));
      await admin.from("onboarding_progress").insert(rows);
    }
  }

  return NextResponse.json({ userId, email, password });
}

/**
 * PATCH — Reset test user state
 *
 * Body: { userId, resetOnboarding?: boolean, onboardingProgress?: number }
 * - resetOnboarding: clears all onboarding progress and onboarding_completed_at
 * - onboardingProgress: after reset, mark this many items complete
 */
export async function PATCH(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { userId, resetOnboarding, onboardingProgress } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (resetOnboarding) {
    // Clear onboarding progress
    await admin.from("onboarding_progress").delete().eq("user_id", userId);

    // Clear onboarding_completed_at
    await admin.from("profiles").update({ onboarding_completed_at: null }).eq("id", userId);
  }

  // Optionally seed partial progress
  if (typeof onboardingProgress === "number" && onboardingProgress > 0) {
    const { data: items } = await admin
      .from("onboarding_items")
      .select("id")
      .order("position")
      .limit(onboardingProgress);

    if (items && items.length > 0) {
      const rows = items.map((item) => ({
        user_id: userId,
        item_id: item.id,
        completed_at: new Date().toISOString(),
        completed_by: userId,
      }));
      await admin.from("onboarding_progress").upsert(rows, { onConflict: "user_id,item_id" });
    }
  }

  return NextResponse.json({ success: true, userId });
}

/**
 * DELETE — Remove a test user and all related data
 *
 * Body: { userId }
 */
export async function DELETE(request: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Delete related data (cascade-safe order)
  await admin.from("onboarding_progress").delete().eq("user_id", userId);
  await admin.from("notification_preferences").delete().eq("user_id", userId);
  await admin.from("notifications").delete().eq("recipient_id", userId);
  await admin.from("comments").delete().eq("author_id", userId);
  await admin.from("posts").delete().eq("author_id", userId);
  await admin.from("forum_group_members").delete().eq("user_id", userId);
  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);

  // Delete auth user
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId });
}
