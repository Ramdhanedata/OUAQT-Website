import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isTester, TESTER_COOKIE } from "@/builder/admin/tester";
import { normaliseConfigurationCode } from "@/builder/config-code/code";
import { attemptKeys, openByCode, recordFailure, waitingFor } from "@/builder/config-code/server";
import { adminClient, requestClient } from "@/builder/db/server";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { configurationFrom, createShop, product, shopInput } from "@/builder/licence/create-shop";
import { mintActivationToken } from "@/builder/licence/activation-token";
import { serialSecretIsSet } from "@/builder/serial/cipher";

/*
 * Télécharger, on the computer, from a code de configuration.
 *
 * The first time, this makes the shop: business, configuration, numéro de
 * série and trial licence, exactly as the account step does, for the phone's
 * session that answered the questions. Every later time, the same shop is
 * found and a fresh one-click link is handed back, so the same code serves a
 * reinstall after a broken PC. Answers changed on the phone since become a
 * new version of the configuration, never an edit of the one a running shop
 * uses.
 *
 * No account is asked for here. An owner who pays later claims the shop with
 * one; until then the code and the serial are what lead back to it.
 */

const body = z
  .object({
    code: z.string().max(40),
    products: z.array(product).max(10_000).default([]),
  })
  .strict();

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "no_database" }, { status: 503 });
  if (!serialSecretIsSet()) return NextResponse.json({ error: "no_serial_secret" }, { status: 501 });

  /* The same slow-down as opening a code: a wrong one here is a guess too. */
  const session = await requestClient(request)?.auth.getUser();
  const keys = await attemptKeys(request, session?.data.user?.id ?? null, "resume");
  const wait = await waitingFor(admin, keys);
  if (wait > 0) return NextResponse.json({ error: "slow_down", wait }, { status: 429 });

  const found = await openByCode(admin, normaliseConfigurationCode(input.data.code));
  if (found.kind === "unknown") await recordFailure(admin, keys);
  if (found.kind !== "found") return NextResponse.json({ error: found.kind }, { status: found.kind === "expired" ? 410 : 404 });
  const draft = found.draft;
  const answers = draft.answers as Record<string, unknown> & {
    pack?: string;
    appLanguage?: string;
    builderLanguage?: string;
    nameLatin?: string;
    nameArabic?: string;
    phone?: string;
    address?: string;
    interview?: Record<string, unknown>;
    patched?: { common?: unknown; features?: unknown };
    staff?: { name: string; role: "manager" | "cashier" }[];
  };

  const shaped = shopInput.safeParse({
    pack: answers.pack,
    language: answers.appLanguage ?? answers.builderLanguage ?? draft.locale,
    business: {
      nameLatin: answers.nameLatin ?? "",
      nameArabic: answers.nameArabic || undefined,
      phone: answers.phone || undefined,
      address: answers.address || undefined,
    },
    answers: answers.interview ?? {},
    patched: answers.patched,
    staff: answers.staff ?? [],
    products: input.data.products,
  });
  if (!shaped.success) return NextResponse.json({ error: "incomplete" }, { status: 400 });

  const made = await createShop(admin, draft.session_owner, shaped.data, {
    /* In test mode on the phone that answered, or on this computer. */
    tester: draft.made_in_test_mode || isTester(cookies().get(TESTER_COOKIE)?.value),
    logo: draft.logo_path && draft.logo_mono_path ? { colourPath: draft.logo_path, monoPath: draft.logo_mono_path } : null,
  });
  if (!made.ok) return NextResponse.json({ error: made.error }, { status: made.status });

  if (made.created) {
    await admin.from("builder_drafts").update({ business_id: made.businessId }).eq("id", draft.id);
  } else {
    /* A change made since: a new version, so the app picks it up at its next check. */
    const configuration = configurationFrom(shaped.data);
    const { data: latest } = await admin
      .from("configurations")
      .select("version, config")
      .eq("business_id", made.businessId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (configuration.success && latest && JSON.stringify(latest.config) !== JSON.stringify(configuration.data)) {
      await admin.from("configurations").insert({
        business_id: made.businessId,
        version: latest.version + 1,
        schema_version: String(configuration.data.version),
        config: configuration.data,
        created_by: "configuration_code",
      });
    }
  }

  const secrets = await getPrivateSettings();
  const minted = secrets ? await mintActivationToken(admin, made.businessId, secrets.activation_token_hours) : null;

  return NextResponse.json(
    {
      serial: made.serial,
      pack: shaped.data.pack,
      link: minted ? `ouaqt://activate?token=${encodeURIComponent(minted.token)}` : null,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
