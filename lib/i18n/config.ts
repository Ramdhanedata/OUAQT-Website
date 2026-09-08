export const locales = ["en", "fr", "ar"] as const;

export type Locale = (typeof locales)[number];

// French is the default: OUAQT sells in Mauritania, where business runs in
// French and Arabic. A visitor whose browser states no preference should not
// land on English.
export const defaultLocale: Locale = "fr";

/** Short code shown inside the navbar switcher. */
export const localeShortNames: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  ar: "AR",
};

/** Full name, written in that language, for the switcher menu. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Builds an internal link for a locale: ("fr", "/projects") -> "/fr/projects" */
export function localeHref(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Swaps the locale segment of a path, so the switcher can link to the current
 * page in another language. "/fr/projects/gmm-mining" -> "/ar/projects/gmm-mining"
 */
export function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = locale;
  } else {
    segments.unshift(locale);
  }
  return `/${segments.join("/")}`;
}
