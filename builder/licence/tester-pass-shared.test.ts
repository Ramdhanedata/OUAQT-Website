import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { passOf, TESTER_MARK_COOKIE, TESTER_PASS_COOKIE } from "./tester-pass-shared";

/*
 * A test iPhone's pass (0040) carried in the phone app's address, since an
 * icon added to the home screen did not get Safari's cookie on Adel's iPhone.
 */

const PASS = "p".repeat(43);
const SITE = "https://www.ouaqt.com";

function call(path: string, headers: Record<string, string> = {}) {
  return new Request(`${SITE}${path}`, { headers });
}

describe("the pass a request carries", () => {
  it("is its cookie first", () => {
    expect(passOf(call("/api/licence/activate", { cookie: `${TESTER_PASS_COOKIE}=${PASS}`, referer: `${SITE}/app/index.html?tp=${"q".repeat(43)}` }))).toBe(PASS);
  });

  it("is read from the phone app page it came from, when there is no cookie", () => {
    expect(passOf(call("/api/licence/activate", { referer: `${SITE}/app/index.html?tp=${PASS}` }))).toBe(PASS);
  });

  it("is never taken from another site, another page or a malformed value", () => {
    expect(passOf(call("/api/licence/activate", { referer: `https://evil.example/app/index.html?tp=${PASS}` }))).toBeNull();
    expect(passOf(call("/api/licence/activate", { referer: `${SITE}/fr/compte?tp=${PASS}` }))).toBeNull();
    expect(passOf(call("/api/licence/activate", { referer: `${SITE}/app/index.html?tp=short` }))).toBeNull();
    expect(passOf(call("/api/licence/activate", { cookie: `${TESTER_PASS_COOKIE}=%E0%A4%A` }))).toBeNull();
    expect(passOf(call("/api/licence/activate"))).toBeNull();
  });
});

describe("the phone app page on a test iPhone", () => {
  const open = (path: string, headers: Record<string, string>) => middleware(new NextRequest(`${SITE}${path}`, { headers }));

  it("keeps the pass of an icon opening for the first time in the icon's own store", () => {
    const response = open(`/app/index.html?tp=${PASS}`, { "sec-fetch-mode": "navigate" });
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    const cookie = response.cookies.get(TESTER_PASS_COOKIE);
    expect(cookie?.value).toBe(PASS);
    expect(cookie?.httpOnly).toBe(true);
  });

  it("opens the page again with the pass, in a browser that holds it, keeping the rest of the address", () => {
    const response = open("/app/index.html", { "sec-fetch-mode": "navigate", cookie: `${TESTER_PASS_COOKIE}=${PASS}` });
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").search).toBe(`?tp=${PASS}`);
  });

  it("never redirects the service worker fetching its copy of the page", () => {
    const response = open("/app/index.html", { "sec-fetch-mode": "cors", cookie: `${TESTER_PASS_COOKIE}=${PASS}` });
    expect(response.headers.get("location")).toBeNull();
  });

  it("leaves everyone else's phone app alone", () => {
    const response = open("/app/index.html", { "sec-fetch-mode": "navigate" });
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(TESTER_PASS_COOKIE)).toBeUndefined();
  });

  it("tells the site's pages that this browser holds a pass, and nobody else's", () => {
    const tester = middleware(new NextRequest(`${SITE}/fr`, { headers: { cookie: `${TESTER_PASS_COOKIE}=${PASS}` } }));
    expect(tester.cookies.get(TESTER_MARK_COOKIE)?.value).toBe("1");
    expect(tester.cookies.get(TESTER_MARK_COOKIE)?.httpOnly).toBeFalsy();
    const owner = middleware(new NextRequest(`${SITE}/fr`));
    expect(owner.cookies.get(TESTER_MARK_COOKIE)).toBeUndefined();
  });
});

describe("the door to the phone app, /app", () => {
  const door = (path: string, cookie?: string) =>
    middleware(new NextRequest(`${SITE}${path}`, { headers: { "sec-fetch-mode": "navigate", ...(cookie ? { cookie } : {}) } }));

  it("sends everyone to the app's page, as the old redirect did", () => {
    for (const path of ["/app", "/app/"]) {
      const response = door(path);
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/app/index.html");
      expect(new URL(response.headers.get("location") ?? "").search).toBe("");
    }
  });

  it("hands a test iPhone's Safari its pass on the way, even when Safari keeps the page itself", () => {
    const response = door("/app", `${TESTER_PASS_COOKIE}=${PASS}`);
    const to = new URL(response.headers.get("location") ?? "");
    expect(to.pathname).toBe("/app/index.html");
    expect(to.searchParams.get("tp")).toBe(PASS);
  });

  it("keeps a pass the link already carries, and the rest of the address", () => {
    const response = door(`/app?tp=${PASS}&lang=ar`, `${TESTER_PASS_COOKIE}=${"q".repeat(43)}`);
    const to = new URL(response.headers.get("location") ?? "");
    expect(to.searchParams.getAll("tp")).toEqual([PASS]);
    expect(to.searchParams.get("lang")).toBe("ar");
  });
});
