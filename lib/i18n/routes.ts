import type { Locale } from "./config";

/*
 * Public paths that differ per language.
 *
 * Marketing pages use the same path in every language (/fr/projects,
 * /en/projects). The builder and the owner's account area read better in the
 * owner's own words, so each has a slug per language.
 *
 * The folder on disk is the route id (app/[lang]/builder/...). Middleware
 * rewrites the public slug onto it, so there is one page for three URLs.
 */
export const localisedRoutes = {
  builder: {
    fr: "creer-mon-logiciel",
    en: "build-my-software",
    // TODO(adel): Arabic keeps the Latin slug for now, so the address stays
    // readable when shared on WhatsApp, where Arabic characters arrive
    // percent-encoded. Say the word and it becomes انشئ-برنامجك.
    ar: "build-my-software",
  },
  account: { fr: "compte", en: "account", ar: "account" },
} as const;

export type LocalisedRouteId = keyof typeof localisedRoutes;

const routeIds = Object.keys(localisedRoutes) as LocalisedRouteId[];

/** The public path for a route in one language: ("fr", "builder") -> "/fr/creer-mon-logiciel" */
export function localisedHref(
  locale: Locale,
  id: LocalisedRouteId,
  rest = ""
): string {
  return `/${locale}/${localisedRoutes[id][locale]}${rest}`;
}

/** Which route a public slug belongs to, whatever the language it is written in. */
export function routeIdForSlug(slug: string): LocalisedRouteId | null {
  return (
    routeIds.find((id) =>
      Object.values(localisedRoutes[id]).some((value) => value === slug)
    ) ?? null
  );
}

/** The same page's slug in another language, or null when the slug is not localised. */
export function translateSlug(slug: string, target: Locale): string | null {
  const id = routeIdForSlug(slug);
  return id ? localisedRoutes[id][target] : null;
}
