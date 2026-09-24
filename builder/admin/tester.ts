import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * Test access to trades that are not open to owners yet.
 *
 * A trade stays "test" in builder/packs/opening.ts until its screens are
 * finished and Adel has approved it. Until then nobody reaching the builder
 * can choose it, including Adel, unless he has come through the admin area,
 * which sets this cookie. With it, the builder also opens the "test" trades.
 *
 * The cookie is a signed expiry and nothing else: it says "somebody on the
 * staff opened test mode on this browser, until then". Signed with a key
 * derived from SERIAL_SECRET, so it cannot be made by hand and does not reuse
 * the serial key itself.
 */

export const TESTER_COOKIE = "ouaqt_tester";
const DAYS = 30; // not-a-rule: how long one opening of test mode lasts on a browser
const MS_IN_A_DAY = 86_400_000;

function key(): Buffer | null {
  const secret = (process.env.SERIAL_SECRET ?? "").trim();
  if (secret.length < 32) return null;
  return createHmac("sha256", secret).update("tester-cookie-v1").digest();
}

function sign(expires: number): string | null {
  const k = key();
  if (!k) return null;
  return createHmac("sha256", k).update(String(expires)).digest("base64url");
}

/** A fresh cookie value and how long it lasts, or null without a secret. */
export function makeTesterCookie(now = Date.now()): { value: string; maxAge: number } | null {
  const expires = now + DAYS * MS_IN_A_DAY;
  const signature = sign(expires);
  if (!signature) return null;
  return { value: `${expires}.${signature}`, maxAge: DAYS * 86_400 };
}

export function isTester(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [raw, signature] = value.split(".");
  const expires = Number(raw);
  if (!Number.isFinite(expires) || expires < now || !signature) return false;

  const expected = sign(expires);
  if (!expected) return false;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
