import { NextResponse } from "next/server";
import { adminClient } from "@/builder/db/server";
import { claimEnrolment, ENROL_MINUTES, PASS_SECONDS, TESTER_MARK_COOKIE, TESTER_PASS_COOKIE, TESTER_PASS_PARAM } from "@/builder/licence/tester-pass";
import { limitPerCaller } from "@/lib/rate-limit";

/*
 * Where the QR code shown in the admin area leads: an iPhone becoming one of
 * OUAQT's test devices (0040).
 *
 * Opened in Safari by scanning, with no sign-in: the one-time code in the
 * address is the authority, and it is spent here. Safari is given the pass
 * in a cookie only the server can read. Since an icon added to the home
 * screen does not always get Safari's cookies, the phone app's links carry
 * the pass in their address too (builder/licence/tester-pass-shared.ts),
 * starting with the button on this page.
 */

/* A code is 43 random characters; this only stops a loop wasting the database's time. */
const tooMany = limitPerCaller(10 * 60_000, 20); // not-a-rule: ten minutes, twenty tries

function page(title: string, lines: string[], status: number, button?: { href: string; label: string }): NextResponse {
  const escape = (text: string) => text.replace(/[&<>"]/g, (one) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[one] ?? one);
  const body = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>OUAQT</title></head>
<body style="margin:0;font:17px/1.5 system-ui,-apple-system,sans-serif;color:#0a0a0a;background:#faf9f6">
<main style="max-width:32rem;margin:auto;padding:32px 20px">
<p style="font-weight:600;margin:0 0 24px">OUAQT</p>
<h1 style="font-size:24px;line-height:1.25;margin:0 0 16px">${escape(title)}</h1>
${lines.map((line) => `<p style="margin:0 0 12px">${escape(line)}</p>`).join("\n")}
${button ? `<p style="margin:24px 0 0"><a href="${escape(button.href)}" style="display:inline-block;min-height:52px;line-height:52px;padding:0 24px;border-radius:10px;background:#0a0a0a;color:#fff;font-weight:600;text-decoration:none">${escape(button.label)}</a></p>` : ""}
</main></body></html>`;
  return new NextResponse(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}

export async function GET(request: Request) {
  if (tooMany(request)) return page("Patientez quelques minutes.", ["Trop d'essais depuis cette connexion."], 429);

  const supabase = adminClient();
  if (!supabase) return page("Service indisponible.", ["Réessayez dans un instant."], 503);

  const code = new URL(request.url).searchParams.get("code") ?? "";
  const claimed = await claimEnrolment(supabase, code);
  if (!claimed) {
    return page("Ce QR code ne marche plus.", [
      `Il a déjà servi, ou ses ${ENROL_MINUTES} minutes sont passées.`,
      "Créez-en un nouveau dans l'administration, page Appareils de test.",
    ], 410);
  }

  const response = page(
    `${claimed.label || "Cet iPhone"} est un appareil de test.`,
    [
      "Ses boutiques ont toujours leur essai et ne prennent aucune place d'appareil.",
      "Pour chaque boutique : dans Safari, ouvrez votre compte sur le site et touchez le bouton du logiciel sur téléphone, puis ajoutez-le à l'écran d'accueil. Ou touchez le bouton ci-dessous et tapez le numéro de série dans l'icône.",
      "Les icônes ajoutées avant ce scan ne sont pas concernées : supprimez-les et ajoutez-les de nouveau.",
      "This iPhone is now an OUAQT test device. Shops added to the home screen from now on are never refused a trial.",
    ],
    200,
    { href: `/app/index.html?${TESTER_PASS_PARAM}=${encodeURIComponent(claimed.pass)}`, label: "Ouvrir le logiciel sur ce téléphone" }
  );
  const secure = new URL(request.url).protocol === "https:";
  response.cookies.set(TESTER_PASS_COOKIE, claimed.pass, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: PASS_SECONDS });
  response.cookies.set(TESTER_MARK_COOKIE, "1", { secure, sameSite: "lax", path: "/", maxAge: PASS_SECONDS });
  return response;
}
