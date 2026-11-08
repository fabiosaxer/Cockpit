import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeUrl, outlookConfigured } from "@/lib/outlook";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!outlookConfigured()) return NextResponse.redirect(`${origin}/einstellungen?outlook=config`);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(`${origin}/login`);

  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authorizeUrl(`${origin}/api/outlook/callback`, state));
  res.cookies.set("ms_oauth_state", state, {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    path: "/api/outlook",
    maxAge: 600,
  });
  return res;
}
