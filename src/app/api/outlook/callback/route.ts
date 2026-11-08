import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_CATEGORY_MAP } from "@/lib/events";
import { exchangeCode, graphGet, saveTokens } from "@/lib/outlook";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/einstellungen?outlook=error&grund=${encodeURIComponent(reason)}`);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(`${origin}/login`);

  const jar = await cookies();
  const expected = jar.get("ms_oauth_state")?.value;
  jar.delete({ name: "ms_oauth_state", path: "/api/outlook" });
  if (url.searchParams.get("error")) return fail(url.searchParams.get("error_description") ?? "Abgebrochen");
  const code = url.searchParams.get("code");
  if (!code || !expected || url.searchParams.get("state") !== expected) return fail("Ungültige Anfrage");

  try {
    const tokens = await exchangeCode(code, `${origin}/api/outlook/callback`);
    const me = await graphGet<{ mail?: string; userPrincipalName?: string }>(tokens.access_token, "/me?$select=mail,userPrincipalName");
    await saveTokens(supabase, tokens, me.mail ?? me.userPrincipalName ?? null);

    // Bereich "Privat" fuer Termine ohne passende Kategorie
    const { data: areas } = await supabase.from("areas").select("id, code");
    let all = areas ?? [];
    if (!all.some((a) => a.code === "PRIV")) {
      const { data: priv } = await supabase.from("areas").insert({ code: "PRIV", name: "Privat", sort: 70 }).select("id, code").single();
      if (priv) all = [...all, priv];
    }

    // Standard-Zuordnung der Kategorien, bestehende Eintraege bleiben unveraendert
    const { data: existing } = await supabase.from("calendar_categories").select("category");
    const have = new Set((existing ?? []).map((c) => c.category.toLowerCase()));
    const rows = DEFAULT_CATEGORY_MAP.filter((m) => !have.has(m.category.toLowerCase())).map((m) => ({
      category: m.category,
      area_id: all.find((a) => a.code === m.code)?.id ?? null,
      lead_days: m.lead,
    }));
    if (rows.length) await supabase.from("calendar_categories").insert(rows);
  } catch (e) {
    console.error("Outlook callback:", e);
    return fail(e instanceof Error ? e.message.slice(0, 120) : "Unbekannter Fehler");
  }
  return NextResponse.redirect(`${origin}/einstellungen?outlook=ok`);
}
