import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { localisedHref, localisedRoutes, routeIdForSlug } from "@/lib/i18n/routes";

/*
 * Every page lives under a locale prefix (/en, /fr, /ar). This redirects any
 * path that is missing one, so "/" and "/projects" still work and land on the
 * visitor's best-guess language.
 */
function pickLocale(request: NextRequest): string {
  const header = request.headers.get("accept-language");
  if (!header) return defaultLocale;

  // "fr-FR,fr;q=0.9,en;q=0.8" -> ["fr-fr", "fr", "en"], best first
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    const base = tag.split("-")[0];
    const match = locales.find((locale) => locale === base);
    if (match) return match;
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (hasLocale) return localisedSlugs(request);

  const locale = pickLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, the API, the admin area (which has no language
  // prefix), and anything with a file extension (favicon, images, and so on).
  matcher: ["/((?!_next|api|admin|.*\\.).*)"],
};

/*
 * The builder and the account area have a slug per language, while the pages
 * themselves live in one folder named after the route id. This maps between
 * the two:
 *
 *   /fr/creer-mon-logiciel  ->  renders app/[lang]/builder  (address unchanged)
 *   /fr/builder             ->  redirects to /fr/creer-mon-logiciel
 */
function localisedSlugs(request: NextRequest) {
  const [locale, slug, ...rest] = request.nextUrl.pathname
    .split("/")
    .filter(Boolean) as [Locale, string?, ...string[]];
  if (!slug) return NextResponse.next();

  if (slug in localisedRoutes) {
    const id = slug as keyof typeof localisedRoutes;
    const publicSlug = localisedRoutes[id][locale];
    if (publicSlug !== slug) {
      const tail = rest.length ? `/${rest.join("/")}` : "";
      return NextResponse.redirect(
        new URL(localisedHref(locale, id, tail), request.url)
      );
    }
    return NextResponse.next();
  }

  const id = routeIdForSlug(slug);
  if (!id) return NextResponse.next();

  // A slug from another language points at the same page; keep the address.
  const url = request.nextUrl.clone();
  url.pathname = `/${[locale, id, ...rest].join("/")}`;
  return NextResponse.rewrite(url);
}
