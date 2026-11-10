import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  languageCookie,
  languageCookieSeconds,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import { localisedHref, localisedRoutes, routeIdForSlug } from "@/lib/i18n/routes";
import { REF_COOKIE, REF_COOKIE_DAYS, repCodeOf } from "@/builder/referral";
import {
  passCookieOf,
  PASS_SECONDS,
  TESTER_MARK_COOKIE,
  TESTER_PASS_COOKIE,
  TESTER_PASS_PARAM,
  wellFormedPass,
} from "@/builder/licence/tester-pass-shared";

/*
 * Every page lives under a locale prefix (/en, /fr, /ar), except the front
 * door. "/" shows the home page in the visitor's language and keeps the
 * address as it was typed, so the bar reads ouaqt.com and not ouaqt.com/fr.
 * Any other path missing a prefix ("/projects") is redirected to one.
 *
 * The language is the one the visitor last read the site in, remembered in a
 * cookie, so the logo brings an Arabic reader back to the Arabic home page.
 * Failing that, the browser's stated preference, and failing that, French.
 */
function pickLocale(request: NextRequest): string {
  const remembered = request.cookies.get(languageCookie)?.value;
  if (remembered && isLocale(remembered)) return remembered;

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
  if (request.nextUrl.pathname === "/app/index.html") return phoneAppPass(request);
  return testerMark(request, referral(request, route(request)));
}

/*
 * One of OUAQT's test iPhones opening the phone app (0040, and
 * builder/licence/tester-pass-shared.ts for why the pass travels in the
 * address). With ?tp= in the address, this is a home-screen icon opening for
 * the first time: its own store keeps the pass from now on. Without it, in a
 * browser that holds the pass, the page is opened again with it, so the icon
 * added from here keeps it in its address. Only for the page being opened,
 * never for the service worker fetching its copy, which must not be sent
 * elsewhere.
 */
function phoneAppPass(request: NextRequest) {
  const carried = request.nextUrl.searchParams.get(TESTER_PASS_PARAM);
  const kept = passCookieOf(request);

  if (wellFormedPass(carried)) {
    const response = NextResponse.next();
    if (kept !== carried) {
      response.cookies.set(TESTER_PASS_COOKIE, carried, {
        path: "/",
        maxAge: PASS_SECONDS,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }
    return response;
  }

  const opening = request.method === "GET" && request.headers.get("sec-fetch-mode") === "navigate";
  if (kept && opening) {
    const url = request.nextUrl.clone();
    url.searchParams.set(TESTER_PASS_PARAM, kept);
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

/*
 * A browser holding a test pass is told so in a cookie its pages can read,
 * so the account page knows to put the pass in the phone app's link. The
 * pass itself stays out of the page's reach.
 */
function testerMark(request: NextRequest, response: NextResponse) {
  if (passCookieOf(request) && !request.cookies.get(TESTER_MARK_COOKIE)) {
    response.cookies.set(TESTER_MARK_COOKIE, "1", {
      path: "/",
      maxAge: PASS_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

function route(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const current = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (current) return remember(request, localisedSlugs(request), current);

  const locale = pickLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return pathname === "/" ? NextResponse.rewrite(url) : NextResponse.redirect(url);
}

/*
 * A representative's QR code: ?ref=CODE on any page. The code is kept for
 * 30 days, and only the first one, so the person who made the introduction
 * keeps it (builder/referral.ts). Whether it names a real representative is
 * checked when it is used, not here.
 */
function referral(request: NextRequest, response: NextResponse) {
  const code = repCodeOf(request.nextUrl.searchParams.get("ref"));
  if (code && !repCodeOf(request.cookies.get(REF_COOKIE)?.value)) {
    response.cookies.set(REF_COOKIE, code, {
      path: "/",
      maxAge: REF_COOKIE_DAYS * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

/* The language of the page being read becomes the one "/" opens in next time. */
function remember(request: NextRequest, response: NextResponse, locale: Locale) {
  if (request.cookies.get(languageCookie)?.value !== locale) {
    response.cookies.set(languageCookie, locale, {
      path: "/",
      maxAge: languageCookieSeconds,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // Skip Next internals, the API, the admin area (which has no language
  // prefix), and anything with a file extension (favicon, images, and so on).
  // The phone app's page too, for a test iPhone's pass (phoneAppPass).
  matcher: ["/((?!_next|api|admin|.*\\.).*)", "/app/index.html"],
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
