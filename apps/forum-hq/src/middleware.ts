import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Update this to the production domain when DNS is configured
const CANONICAL_HOST = "hq.frameworkfriday.ai";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Redirect non-canonical hosts to branded domain in production
  if (
    host !== CANONICAL_HOST &&
    host !== "localhost:3001" &&
    !host.startsWith("localhost:")
  ) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // Public routes — no auth required
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    // Sprint HQ proxied routes (served via rewrites to sprint-hq.vercel.app)
    /^\/[a-z]+-\d+-\d{4}$/.test(pathname) ||
    pathname === "/submit" ||
    pathname.startsWith("/sprint-resources") ||
    pathname.startsWith("/sprint/")
  ) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // All other routes require auth
  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Onboarding redirect — skip for /onboarding, admin, and facilitator routes
  if (!pathname.startsWith("/onboarding") && !pathname.startsWith("/admin") && !pathname.startsWith("/facilitator")) {
    const profileRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=onboarding_completed_at`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      }
    );
    const profileData = await profileRes.json();
    const profile = Array.isArray(profileData) ? profileData[0] : null;
    if (profile && profile.onboarding_completed_at === null) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Admin routes — require admin role
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
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Facilitator routes — require facilitator role in at least one group, or admin
  if (pathname.startsWith("/facilitator")) {
    const adminRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${user.id}&role=eq.admin&select=role`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      }
    );
    const adminRoles = await adminRes.json();
    const isAdmin = Array.isArray(adminRoles) && adminRoles.length > 0;

    if (!isAdmin) {
      const facRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/forum_group_members?user_id=eq.${user.id}&role=eq.facilitator&select=forum_group_id&limit=1`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
        }
      );
      const facGroups = await facRes.json();
      if (!Array.isArray(facGroups) || facGroups.length === 0) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
