/*
 * How typed text is compared with what a shop holds. Kept apart from the
 * queries so it can be tested without a database.
 */

export type MatchKind = "name" | "phone" | "serial" | "device" | "address" | "id";

/* Accents, case and Arabic diacritics set aside, so "epicerie" finds "Épicerie". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchText(value: string | null | undefined, typed: string): boolean {
  if (!value) return false;
  const wanted = fold(typed);
  return wanted.length > 0 && fold(value).includes(wanted);
}

/*
 * The digits of a phone number worth searching by, or null when what was
 * typed is not a phone. The country code is dropped, since one receipt has
 * it and another does not; four digits is the least that narrows anything.
 */
export function phoneDigits(typed: string): string | null {
  const clean = typed.trim();
  if (!/^[\d\s+().-]+$/.test(clean)) return null;
  let digits = clean.replace(/\D/g, "");
  /* "+222" or "00222" is always the country; a bare 222 only when the number is too long without it. */
  if (clean.startsWith("+222")) digits = digits.slice(3);
  else if (digits.startsWith("00222")) digits = digits.slice(5);
  else if (digits.startsWith("222") && digits.length > 8) digits = digits.slice(3);
  return digits.length >= 4 ? digits : null;
}
