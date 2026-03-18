import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("redirectTo") || searchParams.get("next") || "/admin";

  // Detect if this callback came through Forum HQ's proxy (redirectTo starts with /sprint)
  const isProxied = next.startsWith("/sprint");
  const proxyOrigin = "https://hq.frameworkfriday.ai";

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

      // When proxied, redirect back to Forum HQ domain so the /sprint rewrite serves the page
      const redirectOrigin = isProxied ? proxyOrigin : origin;
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
    // Debug: show error
    const errorOrigin = isProxied ? proxyOrigin : origin;
    const loginPath = isProxied ? "/sprint/login" : "/login";
    const loginUrl = new URL(loginPath, errorOrigin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl.toString());
  }

  // No code present
  const errorOrigin = isProxied ? proxyOrigin : origin;
  const loginPath = isProxied ? "/sprint/login" : "/login";
  const loginUrl = new URL(loginPath, errorOrigin);
  loginUrl.searchParams.set("error", "no_code");
  return NextResponse.redirect(loginUrl.toString());
}
