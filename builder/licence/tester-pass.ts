import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { wellFormedPass } from "./tester-pass-shared";

export { PASS_DAYS, PASS_SECONDS, passOf, passCookieOf, TESTER_MARK_COOKIE, TESTER_PASS_COOKIE, TESTER_PASS_PARAM } from "./tester-pass-shared";

/*
 * The pass an iPhone carries as one of OUAQT's test devices (0040).
 *
 * An iPhone's shop app has nothing lasting to be known by: each shop added
 * to its home screen is a new app with a new random number. So staff show a
 * QR code in the admin area, the iPhone scans it in Safari, and Safari keeps
 * a pass in a cookie. Every shop added to the home screen after that starts
 * with a copy of Safari's cookies (iOS 17.2 and later), so its activation
 * request carries the pass, and the pass is what is recognised.
 *
 * The QR code holds a one-time code, not the pass: the code is worth nothing
 * once used or after a few minutes. The pass then travels in the phone app's
 * own address as well (tester-pass-shared.ts), since an icon does not always
 * receive Safari's cookies. Only hashes of either are stored.
 */

export const ENROL_MINUTES = 15; // not-a-rule: how long a QR code shown in the admin area can be scanned

const MS_IN_A_MINUTE = 60_000;

export function hashOf(secret: string): string {
  return createHash("sha256").update(`ouaqt-tester-pass-v1:${secret}`).digest("hex");
}

/** A fresh secret, for a code or a pass: 32 random bytes, safe in an address. */
export function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

export type PassHolder = { id: string; label: string };

/** The test device a pass belongs to, if it is still one. */
export async function holderOf(supabase: SupabaseClient, pass: string | null): Promise<PassHolder | null> {
  if (!wellFormedPass(pass)) return null;
  const { data, error } = await supabase
    .from("tester_devices")
    .select("id, label")
    .eq("pass_hash", hashOf(pass))
    .is("removed_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id as string, label: (data.label as string) ?? "" };
}

/*
 * An install recognised through a pass, written down with its own marks, so
 * the rules that read a shop's stored devices (its trade, its device places)
 * know it as a test device too. Once per device id.
 */
export async function rememberInstall(
  supabase: SupabaseClient,
  holder: PassHolder,
  install: { deviceId: string; fingerprint: { board: string | null; disk: string | null; machine: string | null } | null }
): Promise<void> {
  const { data: known } = await supabase
    .from("tester_devices")
    .select("id")
    .eq("device_id", install.deviceId)
    .is("removed_at", null)
    .limit(1)
    .maybeSingle();
  if (known) return;
  await supabase.from("tester_devices").insert({
    label: holder.label,
    device_id: install.deviceId,
    fingerprint_board: install.fingerprint?.board ?? null,
    fingerprint_disk: install.fingerprint?.disk ?? null,
    fingerprint_machine: install.fingerprint?.machine ?? null,
    via: holder.id,
  });
}

/** A one-time code for a QR code, valid ENROL_MINUTES, for a device not yet known. */
export async function newEnrolment(
  supabase: SupabaseClient,
  label: string,
  staffId: string,
  now = new Date()
): Promise<{ code: string; until: Date } | null> {
  const code = newSecret();
  const until = new Date(now.getTime() + ENROL_MINUTES * MS_IN_A_MINUTE);
  const { error } = await supabase.from("tester_devices").insert({
    label,
    enrol_hash: hashOf(code),
    enrol_until: until.toISOString(),
    added_by: staffId,
  });
  return error ? null : { code, until };
}

/*
 * The code from a QR code, exchanged once for a pass. Null when it is
 * unknown, used already, out of time, or its device was removed meanwhile.
 */
export async function claimEnrolment(
  supabase: SupabaseClient,
  code: string,
  now = new Date()
): Promise<{ pass: string; label: string } | null> {
  if (!wellFormedPass(code)) return null;
  const { data: row } = await supabase
    .from("tester_devices")
    .select("id, label, enrol_until")
    .eq("enrol_hash", hashOf(code))
    .is("pass_hash", null)
    .is("removed_at", null)
    .maybeSingle();
  if (!row || !row.enrol_until || new Date(row.enrol_until as string).getTime() < now.getTime()) return null;

  const pass = newSecret();
  const { error } = await supabase
    .from("tester_devices")
    .update({ pass_hash: hashOf(pass), enrol_hash: null, enrol_until: null })
    .eq("id", row.id)
    .is("pass_hash", null);
  return error ? null : { pass, label: (row.label as string) ?? "" };
}
