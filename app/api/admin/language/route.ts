import { NextResponse } from "next/server";
import { adminLanguages } from "@/builder/admin/copy";
import { ADMIN_LANGUAGE_COOKIE } from "@/builder/admin/language";

/*
 * Switch the admin area's language, then go back to the page it was chosen on.
 *
 *   GET /api/admin/language?lang=ar&back=/admin/essais
 *
 * Only a path inside the admin area is followed back, so this cannot be used
 * to send somebody off to another site.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") ?? "";
  const back = url.searchParams.get("back") ?? "/admin";
  const target = back.startsWith("/admin") && !back.startsWith("//") ? back : "/admin";

  const response = NextResponse.redirect(new URL(target, request.url));
  if ((adminLanguages as readonly string[]).includes(lang)) {
    response.cookies.set(ADMIN_LANGUAGE_COOKIE, lang, {
      path: "/",
      sameSite: "lax",
      maxAge: 365 * 86_400, // not-a-rule: how long a language choice is remembered
    });
  }
  return response;
}
