import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("redirectTo") || searchParams.get("next") || "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this user's email is in the pending_admins list
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const admin = createAdminClient();
        const { data: pending } = await admin
          .from("pending_admins")
          .select("id")
          .eq("email", user.email.toLowerCase())
          .single();

        if (pending) {
          // Grant admin role and remove from pending
          await admin.from("user_roles").insert({
            user_id: user.id,
            role: "admin",
          });
          await admin.from("pending_admins").delete().eq("id", pending.id);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
    // Debug: show error
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl.toString());
  }

  // No code present
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "no_code");
  return NextResponse.redirect(loginUrl.toString());
}
