/*
 * The number the owner reads down the phone, writes on a scrap of paper, and
 * types into the app on the shop counter.
 *
 * That single sentence explains every choice here. The alphabet has no 0, O,
 * 1, I or L, because those are the characters people get wrong when reading
 * handwriting aloud. Eight characters in two groups of four, because that is
 * how a person reads a number back without losing their place.
 *
 * not-a-rule-file: the numbers below are an alphabet and a length, not
 * anything anybody administers.
 */

/** No 0, O, 1, I or L: the pairs that get misread on paper and over the phone. */
export const SERIAL_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const GROUP = 4;
const GROUPS = 2;
const LENGTH = GROUP * GROUPS;

/*
 * Rejection sampling rather than a modulo.
 *
 * 256 is not a multiple of 31, so taking a random byte modulo 31 makes the
 * first few letters of the alphabet likelier than the rest. Bytes that fall
 * in the uneven tail are thrown away instead.
 */
const LIMIT = Math.floor(256 / SERIAL_ALPHABET.length) * SERIAL_ALPHABET.length;

function randomBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** A fresh serial, formatted as the owner will see it: XXXX-XXXX. */
export function makeSerial(): string {
  let out = "";
  while (out.length < LENGTH) {
    const bytes = randomBytes(LENGTH);
    for (let i = 0; i < bytes.length; i += 1) {
      if (bytes[i] >= LIMIT) continue;
      out += SERIAL_ALPHABET[bytes[i] % SERIAL_ALPHABET.length];
      if (out.length === LENGTH) break;
    }
  }
  return `${out.slice(0, GROUP)}-${out.slice(GROUP)}`;
}

/**
 * A serial as it was typed, turned into the one true form, or null if it
 * cannot be one. Lower case, missing dash, stray spaces: all fine. A letter
 * that is not in the alphabet is not.
 */
export function normaliseSerial(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "");
  if (cleaned.length !== LENGTH) return null;
  for (const character of cleaned) {
    if (!SERIAL_ALPHABET.includes(character)) return null;
  }
  return `${cleaned.slice(0, GROUP)}-${cleaned.slice(GROUP)}`;
}

export function isSerial(input: string): boolean {
  return normaliseSerial(input) !== null;
}

/**
 * A serial that nothing else is using.
 *
 * Eight characters from an alphabet of 31 is about 850 billion possibilities,
 * which is plenty for one shop at a time but not so much that a hundred
 * thousand of them can never collide. The database has a unique constraint;
 * this asks it first and tries again rather than handing the owner an error.
 */
export async function makeUniqueSerial(
  taken: (serial: string) => Promise<boolean>,
  attempts = 5
): Promise<string> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = makeSerial();
    if (!(await taken(candidate))) return candidate;
  }
  throw new Error("could not find an unused serial");
}

/** What the database stores for lookup. The serial itself is never stored in the clear. */
export async function hashSerial(serial: string): Promise<string> {
  const normalised = normaliseSerial(serial);
  if (!normalised) throw new Error("not a serial");

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalised)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
