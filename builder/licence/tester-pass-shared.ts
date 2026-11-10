/*
 * The parts of an iPhone's test pass (0040) that the middleware needs too,
 * so nothing here may import node or the database: see tester-pass.ts for
 * the rest and for why there is a pass at all.
 *
 * Why the pass also travels in an address. A cookie set in Safari is meant
 * to be copied into each app added to the home screen, but on Adel's iPhone
 * (2026-11-10) the new icon's activation carried none. An iPhone does keep
 * the address on screen for a new icon, which is how a shop's serial reaches
 * it after the #. So the phone app's link carries the pass too, as ?tp=, and
 * stays in the icon's address. The icon's first request sets the cookie in
 * its own store, and every call the app makes names that address as its
 * referrer, so the pass is read from there as well.
 */

export const TESTER_PASS_COOKIE = "ouaqt_tester_pass";
/* Readable by the page, unlike the pass: it only says "ask for the pass". */
export const TESTER_MARK_COOKIE = "ouaqt_tester";
export const TESTER_PASS_PARAM = "tp";
export const PASS_DAYS = 400; // not-a-rule: the longest a browser keeps a cookie
export const PASS_SECONDS = PASS_DAYS * 86_400;

/** A pass as newSecret makes them: 32 random bytes, base64url. */
export function wellFormedPass(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{40,60}$/.test(value);
}

function cookieOf(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** The pass in this request's own cookies, if well formed. */
export function passCookieOf(request: Request): string | null {
  const pass = cookieOf(request, TESTER_PASS_COOKIE);
  return wellFormedPass(pass) ? pass : null;
}

/*
 * The pass a request carries: its cookie, or failing that the ?tp= of the
 * phone app page it came from, on this same site.
 */
export function passOf(request: Request): string | null {
  const fromCookie = passCookieOf(request);
  if (fromCookie) return fromCookie;
  const referrer = request.headers.get("referer");
  if (!referrer) return null;
  try {
    const from = new URL(referrer);
    if (from.origin !== new URL(request.url).origin || !from.pathname.startsWith("/app/")) return null;
    const pass = from.searchParams.get(TESTER_PASS_PARAM);
    return wellFormedPass(pass) ? pass : null;
  } catch {
    return null;
  }
}
