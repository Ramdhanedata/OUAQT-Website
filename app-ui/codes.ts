/*
 * Short codes people read down the phone.
 *
 * Two of them, and both are shared with the desktop app, which is why they
 * live here and depend on nothing but WebCrypto:
 *
 *   device code    the app shows it, the owner reads it to us
 *   renewal code   we work it out, he types it in, and the app checks it
 *                  without any network at all
 *
 * The same alphabet as the serial, for the same reason: no 0, O, 1, I or L,
 * because those are what people get wrong reading handwriting aloud.
 *
 * not-a-rule-file: lengths and an alphabet, nothing anybody administers.
 */

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const BASE = CODE_ALPHABET.length;

/** Days are counted from here, so a date fits in three characters. */
const EPOCH = Date.UTC(2026, 0, 1);
const MS_IN_A_DAY = 86_400_000;

const DATE_CHARS = 3; // 31^3 days, about eighty years
const MAC_CHARS = 7; // 31^7, about thirty five bits
const GROUP = 5;

function toBase31(value: number, width: number): string {
  let left = Math.max(0, Math.floor(value));
  let out = "";
  for (let i = 0; i < width; i += 1) {
    out = CODE_ALPHABET[left % BASE] + out;
    left = Math.floor(left / BASE);
  }
  return out;
}

function fromBase31(text: string): number | null {
  let value = 0;
  for (const character of text) {
    const digit = CODE_ALPHABET.indexOf(character);
    if (digit < 0) return null;
    value = value * BASE + digit;
  }
  return value;
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return new Uint8Array(signature);
}

/** The first bytes of a digest, as characters of the alphabet. */
function squeeze(bytes: Uint8Array, characters: number): string {
  let value = 0;
  for (let i = 0; i < 6; i += 1) value = value * 256 + bytes[i];
  return toBase31(value % BASE ** characters, characters);
}

/**
 * The code the desktop app shows for this computer.
 *
 * It is a fingerprint of the device id, not the id itself: the owner reads it
 * out, so it should be short, and it should not be something that can be
 * typed back in to impersonate the machine.
 */
export async function deviceCodeFor(deviceId: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(deviceId))
  );
  const code = squeeze(digest, GROUP * 2);
  return `${code.slice(0, GROUP)}-${code.slice(GROUP)}`;
}

export function normaliseCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

function endsAtToDays(endsAt: Date): number {
  return Math.round((endsAt.getTime() - EPOCH) / MS_IN_A_DAY);
}

function daysToEndsAt(days: number): Date {
  return new Date(EPOCH + days * MS_IN_A_DAY);
}

/**
 * A renewal code: a new end date, and proof that we are the ones who said so.
 *
 * It is tied to one device code and to that licence's own secret, so a code
 * read out to the wrong shop does nothing at all.
 */
export async function makeRenewalCode(input: {
  deviceCode: string;
  endsAt: Date;
  secret: string;
}): Promise<string> {
  const days = endsAtToDays(input.endsAt);
  const datePart = toBase31(days, DATE_CHARS);
  const device = normaliseCode(input.deviceCode);
  const mac = squeeze(await hmac(input.secret, `${device}:${datePart}`), MAC_CHARS);

  const body = `${datePart}${mac}`;
  return `${body.slice(0, GROUP)}-${body.slice(GROUP)}`;
}

export type RenewalCheck =
  | { ok: true; endsAt: Date }
  | { ok: false; reason: "malformed" | "wrong_code" };

/**
 * Checks a code with no network, which is the whole point of it.
 *
 * Pure, and shared with the desktop app: the shop is behind a closed shutter
 * with no signal and the owner is reading ten characters off a WhatsApp
 * message.
 */
export async function verifyRenewalCode(input: {
  code: string;
  deviceCode: string;
  secret: string;
}): Promise<RenewalCheck> {
  const code = normaliseCode(input.code);
  if (code.length !== DATE_CHARS + MAC_CHARS) return { ok: false, reason: "malformed" };

  const datePart = code.slice(0, DATE_CHARS);
  const days = fromBase31(datePart);
  if (days === null) return { ok: false, reason: "malformed" };

  const device = normaliseCode(input.deviceCode);
  const expected = squeeze(await hmac(input.secret, `${device}:${datePart}`), MAC_CHARS);

  /* Compared in full, without stopping at the first wrong character. */
  const given = code.slice(DATE_CHARS);
  let same = given.length === expected.length;
  for (let i = 0; i < expected.length; i += 1) {
    if (given[i] !== expected[i]) same = false;
  }
  if (!same) return { ok: false, reason: "wrong_code" };

  return { ok: true, endsAt: daysToEndsAt(days) };
}
