import "server-only";
import { decrypt, encrypt } from "./crypto";

const SCOPES = "offline_access User.Read Calendars.Read";
const GRAPH = "https://graph.microsoft.com/v1.0";

type Supabase = Awaited<ReturnType<typeof import("./supabase/server").createClient>>;

export class OutlookAuthError extends Error {}

export function outlookConfigured(): boolean {
  return !!(
    process.env.MS_TENANT_ID &&
    process.env.MS_CLIENT_ID &&
    process.env.MS_CLIENT_SECRET &&
    process.env.TOKEN_ENCRYPTION_KEY
  );
}

const authority = () => `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0`;

export function authorizeUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: SCOPES,
    state,
    prompt: "select_account",
  });
  return `${authority()}/authorize?${p}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${authority()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID!,
      client_secret: process.env.MS_CLIENT_SECRET!,
      scope: SCOPES,
      ...params,
    }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = `${json.error ?? res.status}: ${json.error_description ?? ""}`.slice(0, 300);
    if (json.error === "invalid_grant" || json.error === "interaction_required") throw new OutlookAuthError(msg);
    throw new Error(msg);
  }
  return json as TokenResponse;
}

export function exchangeCode(code: string, redirectUri: string) {
  return tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
}

export async function saveTokens(supabase: Supabase, t: TokenResponse, account?: string | null) {
  const row: Record<string, unknown> = {
    access_token: encrypt(t.access_token),
    expires_at: new Date(Date.now() + (t.expires_in - 120) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (t.refresh_token) row.refresh_token = encrypt(t.refresh_token);
  if (account !== undefined) row.account = account;
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("oauth_tokens").upsert({ user_id: auth.user?.id, ...row });
  if (error) throw new Error(error.message);
}

/** Gueltiges Access-Token, bei Bedarf per Refresh-Token erneuert. null = nicht verbunden. */
export async function getAccessToken(supabase: Supabase): Promise<string | null> {
  const { data: row, error } = await supabase.from("oauth_tokens").select("*").maybeSingle();
  if (error || !row) return null;
  if (row.access_token && row.expires_at && new Date(row.expires_at).getTime() > Date.now()) {
    return decrypt(row.access_token);
  }
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: decrypt(row.refresh_token) });
  await saveTokens(supabase, t);
  return t.access_token;
}

export async function graphGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(path.startsWith("http") ? path : `${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="Europe/Zurich"' },
    cache: "no-store",
  });
  if (res.status === 401) throw new OutlookAuthError("Graph 401");
  if (!res.ok) throw new Error(`Graph ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

export type OutlookEvent = {
  id: string;
  subject: string;
  isAllDay: boolean;
  isCancelled: boolean;
  categories: string[];
  webLink: string | null;
  start: { dateTime: string };
  end: { dateTime: string };
};

/** Termine im Zeitraum [from, to] (YYYY-MM-DD), Serien bereits aufgeloest. */
export async function fetchEvents(token: string, from: string, to: string): Promise<OutlookEvent[]> {
  const select = "id,subject,isAllDay,isCancelled,categories,webLink,start,end";
  let url: string | null =
    `${GRAPH}/me/calendarView?startDateTime=${from}T00:00:00&endDateTime=${to}T23:59:59` +
    `&$select=${select}&$orderby=start/dateTime&$top=250`;
  const events: OutlookEvent[] = [];
  for (let page = 0; url && page < 6; page++) {
    const data: { value: OutlookEvent[]; "@odata.nextLink"?: string } = await graphGet(token, url);
    events.push(...data.value);
    url = data["@odata.nextLink"] ?? null;
  }
  return events.filter((e) => !e.isCancelled);
}
