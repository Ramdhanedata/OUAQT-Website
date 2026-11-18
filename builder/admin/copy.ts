/*
 * Every word the admin area says, in French, English and Arabic.
 *
 * French is the reference: the other two follow its shape, which the types
 * below enforce, so a key missing in one language fails the build rather than
 * showing a blank to staff.
 *
 * Placeholders in braces are filled with fill() from lib/utils. Nothing here
 * is a function, because the client components receive their part of it as
 * props, and only plain text crosses from the server to the browser.
 *
 * The settings' own descriptions come from the database and are not
 * translated here: they are notes staff wrote about each key, not interface.
 */

import { ar } from "./copy-ar";
import { en } from "./copy-en";
import { fr, type AdminCopy } from "./copy-fr";

export type { AdminCopy };

export const adminLanguages = ["fr", "en", "ar"] as const;
export type AdminLanguage = (typeof adminLanguages)[number];

/* Each language is always named in itself, whichever one is showing. */
export const languageNames: Record<AdminLanguage, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

export const adminCopy: Record<AdminLanguage, AdminCopy> = { fr, en, ar };

/*
 * The locale for dates and numbers on staff screens.
 *
 * Arabic uses plain day/month/year digits rather than the Arabic locale's own
 * format. That one puts invisible right-to-left marks between the numbers,
 * and beside a shop name written in Latin letters they tore the date apart:
 * "22 · Pharmacie Essai 2026/9/". Digits stay Western, as everywhere else.
 */
export const adminLocale: Record<AdminLanguage, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ar: "en-GB",
};

/** A stored value in the reader's words, or the value itself when it has none. */
export function wordFor(words: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "";
  return words[value] ?? value;
}
