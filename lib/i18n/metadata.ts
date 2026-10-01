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
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, `/${l}${clean}`])
  );
  // The bare address picks a language for each visitor, which is what
  // x-default tells search engines it does.
  if (path === "/") languages["x-default"] = "/";
  return { canonical: `/${lang}${clean}`, languages };
}

/**
 * Canonical and hreflang for a page whose slug differs per language (the
 * builder, the trade pages). x-default is the French page: French is the
 * language a visitor with no stated preference gets, see config.ts.
 */
export function localisedAlternatesFor(lang: Locale, id: LocalisedRouteId) {
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, localisedHref(l, id)])
  );
  languages["x-default"] = localisedHref(defaultLocale, id);
  return { canonical: localisedHref(lang, id), languages };
}
