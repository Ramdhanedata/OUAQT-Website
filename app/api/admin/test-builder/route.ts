import { NextResponse } from "next/server";
import { adminGate } from "@/builder/admin/guard";
import { audit } from "@/builder/db/audit";
import { makeTesterCookie, TESTER_COOKIE } from "@/builder/admin/tester";
import { localisedHref } from "@/lib/i18n/routes";

/*
 * Open the builder in test mode, with the trades that are not open to owners
 * yet. Staff only, and written down each time, because it is how a trade gets
 * used before anyone has approved it.
 *
 *   GET /api/admin/test-builder          test mode on, then the builder
 *   GET /api/admin/test-builder?off=1    test mode off
 */
export async function GET(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.redirect(new URL("/admin", request.url));

  const off = new URL(request.url).searchParams.has("off");
  const response = NextResponse.redirect(
    new URL(off ? "/admin/reglages" : localisedHref("fr", "builder"), request.url)
  );

  if (off) {
    response.cookies.delete(TESTER_COOKIE);
    return response;
  }

  const cookie = makeTesterCookie();
  if (!cookie) return NextResponse.redirect(new URL("/admin/reglages", request.url));

  response.cookies.set(TESTER_COOKIE, cookie.value, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
  });

  await audit({
    actorId: gate.staff.id,
    subject: "settings",
    subjectId: "test_mode",
    action: "test_mode_opened",
    detail: {},
  });

  return response;
}
