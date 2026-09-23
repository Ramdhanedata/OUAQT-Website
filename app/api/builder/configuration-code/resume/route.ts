import { NextResponse } from "next/server";
import { z } from "zod";
import { normaliseConfigurationCode } from "@/builder/config-code/code";
import { attemptKeys, clearFailures, openByCode, openBySerial, recordFailure, waitingFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";

/*
 * Opening a code de configuration on another device.
 *
 * Unknown and expired are told apart, because what the owner does next is
 * different: a typo is fixed, an expired code needs a fresh start or a call.
 * After five wrong entries from the same session or address, each try waits
 * a little longer. There is no captcha.
 *
 * A code is never used up. An owner reinstalling after a broken PC types the
 * same one and gets the same configuration.
 *
 * Everything was answered on the phone, so the computer goes straight to the
 * download and is told only what that screen shows: the trade, the name and
 * the language. The answers themselves stay on the server, where the shop is
 * made from them.
 */

const body = z.object({ code: z.string().max(400) }).strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const supabase = requestClient(request);
  const admin = adminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "no_database" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();

  const keys = await attemptKeys(request, auth.user?.id ?? null, "resume");
  const wait = await waitingFor(admin, keys);
  if (wait > 0) return NextResponse.json({ error: "slow_down", wait }, { status: 429 });

  const code = normaliseConfigurationCode(input.data.code);
  const found = await openByCode(admin, code);

  if (found.kind === "unknown") {
    /* Not a code: perhaps the numéro de série of a shop finished on the phone. */
    const shop = await openBySerial(admin, input.data.code);
    if (shop) {
      await clearFailures(admin, keys);
      return NextResponse.json(
        { serial: shop.serial, locale: null, pack: shop.pack, nameLatin: shop.nameLatin, nameArabic: shop.nameArabic },
        { headers: { "cache-control": "no-store" } }
      );
    }
    const next = await recordFailure(admin, keys);
    return NextResponse.json({ error: "unknown", wait: next }, { status: 404 });
  }

  await clearFailures(admin, keys);

  if (found.kind === "expired") {
    const settings = await getPublicSettings();
    return NextResponse.json({ error: "expired", supportWhatsapp: settings?.support_whatsapp ?? null }, { status: 410 });
  }

  const draft = found.draft;
  const answers = draft.answers as { pack?: string; nameLatin?: string; nameArabic?: string };
  return NextResponse.json(
    {
      code: draft.code,
      locale: draft.locale,
      pack: answers.pack ?? null,
      nameLatin: answers.nameLatin ?? "",
      nameArabic: answers.nameArabic ?? "",
    },
    { headers: { "cache-control": "no-store" } }
  );
}
