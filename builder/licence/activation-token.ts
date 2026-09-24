import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { hashToken } from "./devices";

/*
 * The one-time token that lets an owner who built on the shop PC activate
 * without typing.
 *
 * Made at step 4, spent once by activation. It is never logged, never put in
 * an error, never written to an audit row: it is created, handed to the page,
 * carried in a link to the app, and spent. What we keep is its hash.
 */

const MS_IN_AN_HOUR = 3_600_000;

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

/**
 * A fresh token for this business. Any unused one made before is expired, so
 * a link from yesterday's attempt cannot be the one that works tomorrow.
 */
export async function mintActivationToken(
  supabase: SupabaseClient,
  businessId: string,
  lifetimeHours: number,
  now = new Date()
): Promise<{ token: string; expiresAt: string } | null> {
  await supabase
    .from("activation_tokens")
    .update({ expires_at: now.toISOString() })
    .eq("business_id", businessId)
    .is("used_at", null)
    .gt("expires_at", now.toISOString());

  const token = newToken();
  const expiresAt = new Date(now.getTime() + lifetimeHours * MS_IN_AN_HOUR).toISOString();

  const { error } = await supabase.from("activation_tokens").insert({
    business_id: businessId,
    token_hash: await hashToken(token),
    expires_at: expiresAt,
  });

  return error ? null : { token, expiresAt };
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
