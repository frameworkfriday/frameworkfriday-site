import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/notifications/fetch";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const count = await getUnreadCount(user.id);
  return NextResponse.json({ count });
}
