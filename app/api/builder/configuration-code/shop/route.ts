import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isTester, TESTER_COOKIE } from "@/builder/admin/tester";
import { attemptKeys, openByNumber, recordFailure, shopFor, waitingFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { product } from "@/builder/licence/create-shop";
import { mintActivationToken, placeOfRequest } from "@/builder/licence/activation-token";
import { serialSecretIsSet } from "@/builder/serial/cipher";

/*
 * The download, on the computer, from the owner's numéro de série.
 *
 * The first time, this makes the shop: business, configuration and trial
 * licence, exactly as the account step does, for the phone's session that
 * answered the questions, with the number the phone was given. Every later
 * time the same shop is found and a fresh one-click link is handed back, so
 * the same number serves a reinstall after a broken PC.
 *
 * No account is asked for here. An owner who pays later claims the shop with
 * one; until then the number is what leads back to it.
 */

const body = z
  .object({
    number: z.string().max(400),
    products: z.array(product).max(10_000).default([]),
  })
  .strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "no_database" }, { status: 503 });
  if (!serialSecretIsSet()) return NextResponse.json({ error: "no_serial_secret" }, { status: 501 });

  /* The same slow-down as opening a number: a wrong one here is a guess too. */
  const session = await requestClient(request)?.auth.getUser();
  const keys = await attemptKeys(request, session?.data.user?.id ?? null, "resume");
  const wait = await waitingFor(admin, keys);
  if (wait > 0) return NextResponse.json({ error: "slow_down", wait }, { status: 429 });

  const found = await openByNumber(admin, input.data.number);
  if (found.kind === "unknown") await recordFailure(admin, keys);
  if (found.kind === "unknown" || found.kind === "expired") {
    return NextResponse.json({ error: found.kind }, { status: found.kind === "expired" ? 410 : 404 });
  }

  const shop = await shopFor(admin, found, {
    tester: isTester(cookies().get(TESTER_COOKIE)?.value),
    products: input.data.products,
  });
  if (!shop.ok) return NextResponse.json({ error: shop.error }, { status: shop.status });

  const secrets = await getPrivateSettings();
  /* Opened on the computer that downloads: its connection is where the software will start. */
  const minted = secrets
    ? await mintActivationToken(admin, shop.businessId, secrets.activation_token_hours, new Date(), {
        hash: await placeOfRequest(request),
        platform: null,
      })
    : null;

  return NextResponse.json(
    {
      serial: shop.serial,
      pack: shop.pack,
      link: minted ? `ouaqt://activate?token=${encodeURIComponent(minted.token)}` : null,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
