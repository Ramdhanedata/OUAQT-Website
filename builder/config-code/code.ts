/*
 * The one number an owner carries: his numéro de série.
 *
 * Given on the phone the moment the questions end, typed on the shop
 * computer's website to download the software, and typed into the software
 * to activate it. One number, because two (a code for the website and a
 * serial for the software) was one more than anyone could keep apart at a
 * shop counter.
 *
 * Its alphabet and shape are the serial's own (builder/serial/serial.ts).
 * This file reads it out of whatever the owner typed or pasted, and holds the
 * rules around it: how long an unused one lasts, and how wrong entries slow
 * down.
 *
 * not-a-rule-file: a length and a pattern, not prices or limits.
 */

import { normaliseSerial } from "@/builder/serial/serial";

const GROUP = 4;
const LENGTH = GROUP * 2;
/* The serial's alphabet: no 0, O, 1, I or L. */
const CHARACTER = "[2-9A-HJKMNP-Z]";
/* As serials were written before 2026-10-03, with a hyphen: unmistakable in a message. */
const OLD_IN_TEXT = new RegExp(`(?<![A-Z0-9])(${CHARACTER}{4})-(${CHARACTER}{4})(?![A-Z0-9])`);
/* As they are written now: eight in a run, standing alone. */
const IN_TEXT = new RegExp(`(?<![A-Z0-9])${CHARACTER}{${LENGTH}}(?![A-Z0-9])`, "g");

function decode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

/*
 * The number, from whatever he typed or pasted: lowercase, spaces, an old
 * hyphen, a whole WhatsApp message, a link with the number in it. Null when
 * there is no number in it; the lookup then says it was not found, since a
 * typo is the usual cause and a message about format would only hide it.
 *
 * In a message, a word can be eight letters of the alphabet too (PHARMACY
 * is). An old number with its hyphen is taken first; otherwise one with a
 * digit in it; otherwise the one written straight after a colon, an = or a
 * # ("série : …", "?n=…"); otherwise the last, since a message gives the
 * number after saying what it is.
 */
export function readNumber(input: string): string | null {
  const text = decode(input).toUpperCase();
  const bare = text.replace(/[^A-Z0-9]/g, "");
  if (bare.length === LENGTH) return normaliseSerial(bare);
  const old = text.match(OLD_IN_TEXT);
  if (old) return `${old[1]}${old[2]}`;
  const runs = [...text.matchAll(IN_TEXT)].map((found) => ({
    run: found[0],
    named: /[:=#]\s*$/.test(text.slice(0, found.index)),
  }));
  const chosen = runs.find((one) => /[0-9]/.test(one.run)) ?? runs.find((one) => one.named) ?? runs.at(-1);
  return chosen?.run ?? null;
}

/*
 * The field's value as he types: uppercase, eight characters in a run,
 * nothing added. A long paste is read whole, so a message or a link dropped
 * in the box becomes its number.
 */
export function formatAsTyped(input: string): string {
  const text = decode(input).toUpperCase();
  const bare = text.replace(/[^A-Z0-9]/g, "");
  if (bare.length > LENGTH) {
    const found = readNumber(text);
    if (found) return found;
  }
  return bare.slice(0, LENGTH);
}

/* ── Lifetime and wrong entries ─────────────────────────────────────────── */

export const LIFETIME_DAYS = 30; // not-a-rule: the brief's own lifetime, from last access
const DAY_MS = 86_400_000;

/*
 * A number not yet used to make a shop expires when not opened for thirty
 * days; opening it again pushes the date. Once its shop exists it never
 * expires: it is then what the software runs on.
 */
export function isExpired(lastAccessedAt: string | null, createdAt: string, now = new Date()): boolean {
  const last = new Date(lastAccessedAt ?? createdAt).getTime();
  return now.getTime() - last > LIFETIME_DAYS * DAY_MS;
}

export const FREE_TRIES = 5; // not-a-rule: the brief's own count before the input slows down
const FIRST_WAIT_SECONDS = 5;
const LONGEST_WAIT_SECONDS = 300;

/*
 * How long to wait after this many wrong entries: nothing for the first
 * five, then five seconds, doubling, never more than five minutes. Slow for
 * someone guessing, barely noticeable for someone fixing a typo.
 */
export function waitAfter(failures: number): number {
  if (failures < FREE_TRIES) return 0;
  return Math.min(LONGEST_WAIT_SECONDS, FIRST_WAIT_SECONDS * 2 ** (failures - FREE_TRIES));
}

/*
 * A phone number as digits, for matching the one given at the start of the
 * questions with the one typed to get the number again. The last eight digits
 * are what a Mauritanian number is; the country code and spaces vary.
 */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.slice(-8);
}
