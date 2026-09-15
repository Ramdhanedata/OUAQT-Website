/*
 * One field on the contact form takes either an email address or a phone
 * number, since many clients would rather be reached on WhatsApp. The form and
 * the API route both parse it here, so they always agree on what is accepted.
 */

export type ContactChannel =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string; whatsappUrl?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with the usual separators people type: +222 26 40-65 (68)
const PHONE_CHARS_RE = /^[+\d\s().\-/]+$/;

export function parseContact(raw: string): ContactChannel | null {
  const value = raw.trim();
  if (!value) return null;

  if (value.includes("@")) {
    return EMAIL_RE.test(value) ? { kind: "email", value } : null;
  }

  if (!PHONE_CHARS_RE.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return null;

  /*
   * A wa.me link needs the country code. Numbers written with + or 00 already
   * carry one. A bare 8-digit number is taken as Mauritanian (+222), which is
   * how local numbers are written; anything else gets no link rather than a
   * wrong one.
   */
  let whatsappUrl: string | undefined;
  if (value.startsWith("+")) whatsappUrl = `https://wa.me/${digits}`;
  else if (digits.startsWith("00")) whatsappUrl = `https://wa.me/${digits.slice(2)}`;
  else if (digits.length === 8) whatsappUrl = `https://wa.me/222${digits}`;

  return { kind: "phone", value, whatsappUrl };
}
