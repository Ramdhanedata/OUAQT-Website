import "server-only";

import { cookies } from "next/headers";
import { adminCopy, adminLanguages, adminLocale, type AdminCopy, type AdminLanguage } from "./copy";

/*
 * Which language this browser reads the admin area in.
 *
 * A preference, not a permission: it is kept in a cookie for a year and it
 * works on the sign-in screen too, before anybody has signed in. French when
 * nothing has been chosen, because French is the reference.
 */

export const ADMIN_LANGUAGE_COOKIE = "ouaqt_admin_lang";

export async function adminLanguage(): Promise<AdminLanguage> {
  const chosen = (await cookies()).get(ADMIN_LANGUAGE_COOKIE)?.value;
  return (adminLanguages as readonly string[]).includes(chosen ?? "") ? (chosen as AdminLanguage) : "fr";
}

/** The language, its words, and the locale for its dates and numbers. */
export async function adminWords(): Promise<{ lang: AdminLanguage; t: AdminCopy; locale: string }> {
  const lang = await adminLanguage();
  return { lang, t: adminCopy[lang], locale: adminLocale[lang] };
}
