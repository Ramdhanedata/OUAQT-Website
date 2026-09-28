import { locales, type Locale } from "./config";

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
  return {
    canonical: `/${lang}${clean}`,
    languages: Object.fromEntries(
      locales.map((l) => [l, `/${l}${clean}`])
    ) as Record<Locale, string>,
  };
}
