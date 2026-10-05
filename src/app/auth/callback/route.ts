import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** The links in the confirmation and password-reset emails land here, then continue. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to go afterwards (for example the password-reset page). Only paths inside this app.
  const asked = searchParams.get("next") ?? "/";
  const next = asked.startsWith("/") && !asked.startsWith("//") ? asked : "/";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?confirm=failed`);
}
