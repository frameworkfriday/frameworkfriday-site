import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth check
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/submit") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/api/webhooks") ||
    // Sprint pages are public (slug patterns like /mar-2-2026)
    /^\/[a-z]+-\d+-\d{4}$/.test(pathname)
  ) {
    // Still refresh session cookie if present
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Protected routes — require auth
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — require admin role
  // Uses service role key to bypass RLS (the user_roles RLS policy is circular with anon key)
  if (pathname.startsWith("/admin")) {
    const roleRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${user.id}&role=eq.admin&select=role`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      }
    );
    const roles = await roleRes.json();

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
