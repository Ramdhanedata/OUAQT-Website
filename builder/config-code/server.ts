import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isExpired, waitAfter } from "./code";

/*
 * The server's side of the code de configuration: finding the draft a code
 * points to, keeping it alive, counting wrong entries, and putting the logo
 * where the shop will find it.
 *
 * Everything here runs with the service role, because the draft belongs to
 * the phone's session and the computer asking is a different one. What makes
 * that safe is the code itself: eight characters from thirty is about six
 * hundred billion possibilities, and wrong entries slow down after five.
 */

export type Draft = {
  id: string;
  session_owner: string;
  business_id: string | null;
  pack: string | null;
  locale: string;
  step: number;
  answers: Record<string, unknown>;
  code: string;
  phone: string | null;
  created_at: string;
  last_accessed_at: string | null;
  status: "active" | "expired";
  logo_path: string | null;
  logo_mono_path: string | null;
};

const COLUMNS =
  "id, session_owner, business_id, pack, locale, step, answers, code, phone, created_at, last_accessed_at, status, logo_path, logo_mono_path";

export type Found = { kind: "found"; draft: Draft } | { kind: "unknown" } | { kind: "expired"; draft: Draft };

/*
 * The draft behind a code, kept alive by being opened. Thirty days without
 * being opened and it is marked expired; the row stays, so staff can revive
 * it for someone who calls.
 */
export async function openByCode(admin: SupabaseClient, code: string, now = new Date()): Promise<Found> {
  const { data } = await admin.from("builder_drafts").select(COLUMNS).eq("code", code).maybeSingle();
  if (!data) return { kind: "unknown" };
  const draft = data as Draft;
  if (draft.status === "expired" || isExpired(draft.last_accessed_at, draft.created_at, now)) {
    if (draft.status !== "expired") await admin.from("builder_drafts").update({ status: "expired" }).eq("id", draft.id);
    return { kind: "expired", draft: { ...draft, status: "expired" } };
  }
  const touched = now.toISOString();
  await admin.from("builder_drafts").update({ last_accessed_at: touched }).eq("id", draft.id);
  return { kind: "found", draft: { ...draft, last_accessed_at: touched } };
}

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/*
 * Who is trying, as hashes: the browser's session and the address the
 * request came from. Either one reaching five wrong entries slows both down,
 * so opening a new private window does not reset the count.
 */
export async function attemptKeys(request: Request, sessionId: string | null, purpose: string): Promise<string[]> {
  const address = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  const keys: string[] = [];
  if (sessionId) keys.push(await sha256(`${purpose}:session:${sessionId}`));
  if (address) keys.push(await sha256(`${purpose}:address:${address}`));
  return keys;
}

/** Seconds still to wait before another try, or 0. */
export async function waitingFor(admin: SupabaseClient, keys: string[], now = new Date()): Promise<number> {
  if (keys.length === 0) return 0;
  const { data } = await admin.from("configuration_code_attempts").select("locked_until").in("key", keys);
  const latest = Math.max(0, ...(data ?? []).map((row) => (row.locked_until ? new Date(row.locked_until).getTime() : 0)));
  return Math.max(0, Math.ceil((latest - now.getTime()) / 1000));
}

export async function recordFailure(admin: SupabaseClient, keys: string[], now = new Date()): Promise<number> {
  let longest = 0;
  for (const key of keys) {
    const { data } = await admin.from("configuration_code_attempts").select("failures").eq("key", key).maybeSingle();
    const failures = (data?.failures ?? 0) + 1;
    const wait = waitAfter(failures);
    longest = Math.max(longest, wait);
    await admin.from("configuration_code_attempts").upsert({
      key,
      failures,
      last_failure_at: now.toISOString(),
      locked_until: wait > 0 ? new Date(now.getTime() + wait * 1000).toISOString() : null,
    });
  }
  return longest;
}

export async function clearFailures(admin: SupabaseClient, keys: string[]): Promise<void> {
  if (keys.length > 0) await admin.from("configuration_code_attempts").delete().in("key", keys);
}

const DATA_URL = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/;
const LOGO_BYTES = 1_000_000; // not-a-rule: the logos bucket's own ceiling, see 0005

/*
 * The logo, moved from the phone to the logos bucket once, when the code is
 * issued: the computer that opens the code needs to show it, and the shop
 * made from it needs it on its receipt. Kept in the phone session's own
 * folder, which is the folder the shop's owner reads from.
 */
export async function keepLogo(
  admin: SupabaseClient,
  owner: string,
  draftId: string,
  colour: string | undefined,
  mono: string | undefined
): Promise<{ colourPath: string; monoPath: string } | null> {
  const parse = (value: string | undefined) => {
    const match = value?.match(DATA_URL);
    if (!match) return null;
    const bytes = Buffer.from(match[2], "base64");
    return bytes.length > 0 && bytes.length <= LOGO_BYTES ? { type: match[1], bytes } : null;
  };
  const one = parse(colour);
  const two = parse(mono);
  if (!one || !two) return null;
  const extension = (type: string) => (type === "image/png" ? "png" : "jpg");
  const colourPath = `${owner}/draft-${draftId}-colour.${extension(one.type)}`;
  const monoPath = `${owner}/draft-${draftId}-mono.${extension(two.type)}`;
  const up1 = await admin.storage.from("logos").upload(colourPath, one.bytes, { contentType: one.type, upsert: true });
  const up2 = await admin.storage.from("logos").upload(monoPath, two.bytes, { contentType: two.type, upsert: true });
  if (up1.error || up2.error) return null;
  return { colourPath, monoPath };
}

/** Short-lived addresses for the logo, for the summary on the computer. */
export async function logoLinks(admin: SupabaseClient, draft: Draft): Promise<{ colour: string; mono: string } | null> {
  if (!draft.logo_path || !draft.logo_mono_path) return null;
  const SECONDS = 600; // not-a-rule: long enough to read the summary
  const [colour, mono] = await Promise.all([
    admin.storage.from("logos").createSignedUrl(draft.logo_path, SECONDS),
    admin.storage.from("logos").createSignedUrl(draft.logo_mono_path, SECONDS),
  ]);
  if (!colour.data || !mono.data) return null;
  return { colour: colour.data.signedUrl, mono: mono.data.signedUrl };
}
