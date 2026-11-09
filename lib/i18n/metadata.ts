import { defaultLocale, locales, type Locale } from "./config";
import { localisedHref, type LocalisedRouteId } from "./routes";

/**
 * The public origin. Falls back to the Vercel deployment URL so canonical and
 * og:url are correct wherever the site runs.
 *
 * The site is served at www.ouaqt.com, and ouaqt.com redirects there, so
 * NEXT_PUBLIC_SITE_URL=https://www.ouaqt.com in Vercel (Production) is what
 * puts the domain in canonical addresses and share previews.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Per-page canonical and hreflang.
 *
 * This has to be set on every page. Declaring it once in the root layout meant
 * every child inherited the layout's canonical, so /en/projects, /en/about and
 * all six case studies each told Google they were duplicates of /en, which
 * would have dropped them from the index entirely.
 *
 * `path` is the route without the locale prefix: "/", "/projects",
 * "/projects/gmm-mining".
 */
export function alternatesFor(lang: Locale, path = "/") {
  const clean = path === "/" ? "" : path;
  return alternatesOf(lang, (l) => `/${l}${clean}`);
}

/** The same for a page whose address is a different word in each language (the builder, the trade pages). */
export function localisedAlternatesFor(lang: Locale, id: LocalisedRouteId) {
  return alternatesOf(lang, (l) => localisedHref(l, id));
}

/*
 * One page in three languages: its own address as the canonical, the three
 * translations, and x-default for a reader whose language is none of them.
 *
 * x-default is the French page, the main market's, on every page. It used to
 * be the bare address on the home page only, but "/" declares /fr (or the
 * reader's language) as its canonical, and an alternate that is not itself
 * canonical is one Google may drop with the whole set. The other pages had
 * none.
 */
function alternatesOf(lang: Locale, href: (l: Locale) => string) {
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, href(l)])
  );
  languages["x-default"] = href(defaultLocale);
  return { canonical: href(lang), languages };
}
