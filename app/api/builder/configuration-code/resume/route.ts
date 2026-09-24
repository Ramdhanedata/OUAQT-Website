import { NextResponse } from "next/server";
import { z } from "zod";
import { attemptKeys, clearFailures, describe, openByNumber, recordFailure, waitingFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";

/*
 * The numéro de série typed on the computer's website.
 *
 * Everything was answered on the phone, so the computer goes straight to the
 * download and is told only what that screen shows: the trade, the name and
 * the language. The answers themselves stay on the server, where the shop is
 * made from them.
 *
 * Unknown and expired are told apart, because what the owner does next is
 * different: a typo is fixed, an expired number needs a fresh start or a
 * call. After five wrong entries from the same session or address, each try
 * waits a little longer. There is no captcha. A number is never used up.
 */

const body = z.object({ number: z.string().max(400) }).strict();

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

  const found = await openByNumber(admin, input.data.number);

  if (found.kind === "unknown") {
    const next = await recordFailure(admin, keys);
    return NextResponse.json({ error: "unknown", wait: next }, { status: 404 });
  }

  await clearFailures(admin, keys);

  if (found.kind === "expired") {
    const settings = await getPublicSettings();
    return NextResponse.json({ error: "expired", supportWhatsapp: settings?.support_whatsapp ?? null }, { status: 410 });
  }

  return NextResponse.json(describe(found), { headers: { "cache-control": "no-store" } });
}
