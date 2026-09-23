/*
 * The code de configuration: a short pointer to a configuration kept on the
 * server, so an owner who answered the questions on his phone can pick them
 * up on a computer without answering again.
 *
 * It is not the numéro de série. That one activates the installed software and
 * is XXXX-XXXX; this one resumes a configuration on the website and always
 * starts with OUAQT-. Owners who finished on the phone often type their
 * numéro de série into the website's box instead, so the box takes that
 * too and opens the same download (see the resume route).
 *
 * The code carries no answers. Every question added later would lengthen it,
 * and nobody can dictate a long string over the phone.
 *
 * not-a-rule-file: an alphabet, a length and a prefix, not prices or limits.
 */

export const CODE_PREFIX = "OUAQT";

/*
 * Nothing that is confused when read aloud or over a bad line: no O or 0, no
 * I, 1 or L, and no U, which is heard as V. Uppercase only.
 */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

const GROUP = 4;
const GROUPS = 2;
const BODY = GROUP * GROUPS;

/** A fresh code, from the platform's cryptographic random source. */
export function makeConfigurationCode(): string {
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let body = "";
  while (body.length < BODY) {
    const bytes = new Uint8Array(BODY * 2);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      body += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      if (body.length === BODY) break;
    }
  }
  return `${CODE_PREFIX}-${body.slice(0, GROUP)}-${body.slice(GROUP)}`;
}

function decode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

/*
 * Whatever the owner typed or pasted, as the one form codes are stored in.
 *
 * "ouaqt-abcd-efgh", "OUAQTABCDEFGH", "  abcd efgh ", "ABCD-EFGH" and a link
 * with the code somewhere in it all come out as "OUAQT-ABCD-EFGH". Nothing
 * is refused here: an entry that does not look like a code is still looked
 * up, and the lookup is what says it was not found. A typo is the usual
 * cause, and a formatting error message would only hide it.
 */
export function normaliseConfigurationCode(input: string): string {
  const text = decode(input).toUpperCase();

  /* Anywhere in a pasted sentence or link: the prefix, then eight characters. */
  const found = text.match(/OUAQT[\s\-_.:]*([A-Z0-9]{4})[\s\-_.:]*([A-Z0-9]{4})/);
  if (found) return `${CODE_PREFIX}-${found[1]}-${found[2]}`;

  const bare = text.replace(/[^A-Z0-9]/g, "");
  const body = bare.startsWith(CODE_PREFIX) ? bare.slice(CODE_PREFIX.length) : bare;
  if (body.length === BODY) return `${CODE_PREFIX}-${body.slice(0, GROUP)}-${body.slice(GROUP)}`;
  return bare;
}

/*
 * The field's value as the owner types: uppercase, a hyphen between groups
 * of four. Nothing is added: a numéro de série typed here stays exactly what
 * he typed, and the lookup, not the box, tells a code from a serial. A long
 * paste is read whole, so a link dropped in the box becomes its code.
 */
export function formatAsTyped(input: string): string {
  const upper = decode(input).toUpperCase();
  if (upper.length > CODE_PREFIX.length + BODY + GROUPS + 2 || /[/?=&]/.test(upper)) {
    const whole = normaliseConfigurationCode(upper);
    if (whole.startsWith(`${CODE_PREFIX}-`)) return whole;
  }

  const bare = upper.replace(/[^A-Z0-9]/g, "");
  if (bare.length === 0) return "";
  /* Still typing the prefix itself: leave it as it is. */
  if (CODE_PREFIX.startsWith(bare)) return bare;

  const prefixed = bare.startsWith(CODE_PREFIX);
  const body = (prefixed ? bare.slice(CODE_PREFIX.length) : bare).slice(0, BODY);
  const grouped = body.length > GROUP ? `${body.slice(0, GROUP)}-${body.slice(GROUP)}` : body;
  return prefixed ? `${CODE_PREFIX}-${grouped}` : grouped;
}

/** Whether the value has as many characters as a code: enough to look it up. */
export function looksComplete(value: string): boolean {
  return /^OUAQT-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normaliseConfigurationCode(value));
}

/* ── Lifetime and wrong entries ─────────────────────────────────────────── */

export const LIFETIME_DAYS = 30; // not-a-rule: the brief's own lifetime, from last access
const DAY_MS = 86_400_000;

/** Expired when not opened for thirty days. Opening it again pushes the date. */
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
 * questions with the one typed to get the code again. The last eight digits
 * are what a Mauritanian number is; the country code and spaces vary.
 */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.slice(-8);
}
