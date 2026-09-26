import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { hashToken } from "./devices";
import { addressFrom, placeHash } from "./place";

/*
 * The one-time token that lets an owner's computer activate without typing.
 *
 * Made at step 4 when he presses the download, spent once by activation:
 * either by the software asking, on its first start, whether it was
 * downloaded from its own connection (see place.ts and 0024), or through the
 * ouaqt:// link. It is never logged, never put in
 * an error, never written to an audit row: it is created, handed to the page,
 * carried in a link to the app, and spent. What we keep is its hash.
 */

const MS_IN_AN_HOUR = 3_600_000;

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

export type Platform = "windows" | "mac";

/* Where the request that makes a token came from, as its mark. Null without a secret or an address. */
export async function placeOfRequest(request: Request): Promise<string | null> {
  return placeHash(addressFrom(request.headers), (process.env.LICENCE_SIGNING_KEY ?? "").trim());
}

/**
 * A fresh token for this business. Any unused one made before for the same
 * system is expired, so a link from yesterday's attempt cannot be the one
 * that works tomorrow, while a download for the Mac does not cancel the one
 * for the Windows PC beside it.
 */
export async function mintActivationToken(
  supabase: SupabaseClient,
  businessId: string,
  lifetimeHours: number,
  now = new Date(),
  place: { hash: string | null; platform: Platform | null } = { hash: null, platform: null }
): Promise<{ token: string; expiresAt: string } | null> {
  const older = supabase
    .from("activation_tokens")
    .update({ expires_at: now.toISOString(), place_hash: null })
    .eq("business_id", businessId)
    .is("used_at", null)
    .gt("expires_at", now.toISOString());
  await (place.platform ? older.or(`platform.eq.${place.platform},platform.is.null`) : older);

  const token = newToken();
  const expiresAt = new Date(now.getTime() + lifetimeHours * MS_IN_AN_HOUR).toISOString();

  const { error } = await supabase.from("activation_tokens").insert({
    business_id: businessId,
    token_hash: await hashToken(token),
    expires_at: expiresAt,
    ...(place.hash ? { place_hash: place.hash } : {}),
    ...(place.platform ? { platform: place.platform } : {}),
  });

  return error ? null : { token, expiresAt };
}

export type NearbyClaim =
  | { ok: true; id: string; businessId: string }
  | { ok: false; reason: "none" | "ambiguous" };

/*
 * The software, started for the first time, asking whether it was downloaded
 * from where it stands. Only a token made from the same connection, for the
 * same system, in the last few hours, and only when those tokens all belong
 * to one shop: two shops downloaded from one connection, a café's Wi-Fi for
 * one, and neither is guessed at. The software then asks for the serial.
 */
export async function claimNearbyToken(
  supabase: SupabaseClient,
  place: string,
  platform: Platform,
  deviceId: string,
  withinHours: number,
  now = new Date()
): Promise<NearbyClaim> {
  const since = new Date(now.getTime() - withinHours * MS_IN_AN_HOUR).toISOString();
  const { data } = await supabase
    .from("activation_tokens")
    .select("id, business_id, created_at")
    .eq("place_hash", place)
    .is("used_at", null)
    .gt("expires_at", now.toISOString())
    .gt("created_at", since)
    .or(`platform.eq.${platform},platform.is.null`)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as { id: string; business_id: string }[];
  const shops = new Set(rows.map((row) => row.business_id));
  if (shops.size === 0) return { ok: false, reason: "none" };
  if (shops.size > 1) return { ok: false, reason: "ambiguous" };

  const { data: taken } = await supabase
    .from("activation_tokens")
    .update({ used_at: now.toISOString(), used_device: deviceId })
    .eq("id", rows[0].id)
    .is("used_at", null)
    .select("id, business_id")
    .maybeSingle();

  return taken
    ? { ok: true, id: taken.id as string, businessId: taken.business_id as string }
    : { ok: false, reason: "none" };
}

/* Once spent for good, the mark of where it came from has done its work. */
export async function forgetPlace(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("activation_tokens").update({ place_hash: null }).eq("id", id);
}

export type TokenClaim =
  | { ok: true; id: string; businessId: string }
  | { ok: false };

/*
 * Take the token for one activation. Atomic: two computers racing with the
 * same link cannot both win, because the row is only updated while it is
 * still unused and unexpired, and only one update can see it that way.
 */
export async function claimActivationToken(
  supabase: SupabaseClient,
  token: string,
  deviceId: string,
  now = new Date()
): Promise<TokenClaim> {
  const { data } = await supabase
    .from("activation_tokens")
    .update({ used_at: now.toISOString(), used_device: deviceId })
    .eq("token_hash", await hashToken(token))
    .is("used_at", null)
    .gt("expires_at", now.toISOString())
    .select("id, business_id")
    .maybeSingle();

  return data ? { ok: true, id: data.id as string, businessId: data.business_id as string } : { ok: false };
}

/* Give the token back when the activation it was taken for did not happen. */
export async function releaseActivationToken(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  await supabase
    .from("activation_tokens")
    .update({ used_at: null, used_device: null })
    .eq("id", id);
}
