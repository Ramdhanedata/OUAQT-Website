import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appLanguages,
  configurationSchema,
  defaultConfiguration,
} from "@/app-ui/config";
import { packs } from "@/app-ui/packs";
import { isTester, TESTER_COOKIE } from "@/builder/admin/tester";
import { audit } from "@/builder/db/audit";
import { adminClient, sessionClient } from "@/builder/db/server";
import { getPublicSettings } from "@/builder/db/settings";
import { applyAnswers } from "@/builder/packs/bank";
import { interviewFor } from "@/builder/packs";
import { encryptSerial, serialSecretIsSet } from "@/builder/serial/cipher";
import { hashSerial, makeUniqueSerial } from "@/builder/serial/serial";

/*
 * The end of the interview: a business, a configuration, and the number he
 * will type into the shop computer.
 *
 * Who writes what, and why the split matters:
 *
 *   as the owner   his business, his products, his staff. These are his, row
 *                  level security checks every one, and he can edit them.
 *
 *   as the server  the configuration and the serial. Those tables are select
 *                  only for owners on purpose. The configuration is what the
 *                  desktop app runs on and the serial is what unlocks it, so
 *                  neither may be written by a browser holding a public key.
 *                  They are written here, after validation, or not at all.
 *
 * Calling it twice does not make a second business. A retry after a failure
 * returns what the first attempt built.
 */

const product = z.object({
  row: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  price: z.number().nonnegative(),
  quantity: z.number(),
  barcode: z.string().max(60).optional(),
  expiry: z.string().max(10).optional(),
  batch: z.string().max(60).optional(),
  unit: z.string().max(40).optional(),
  location: z.string().max(60).optional(),
  soldBy: z.string().max(40).optional(),
});

const body = z.object({
  pack: z.enum(packs),
  language: z.enum(appLanguages),
  business: z.object({
    nameLatin: z.string().trim().min(1).max(60),
    nameArabic: z.string().trim().max(60).optional(),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(120).optional(),
  }),
  answers: z.record(z.string(), z.unknown()).default({}),
  patched: z
    .object({ common: z.unknown().optional(), features: z.unknown().optional() })
    .optional(),
  staff: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        role: z.enum(["manager", "cashier"]),
      })
    )
    .max(50)
    .default([]),
  products: z.array(product).max(10_000).default([]),
});

export async function POST(request: Request) {
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = sessionClient();
  if (!supabase) {
    return NextResponse.json({ error: "no_database" }, { status: 501 });
  }

  const { data: auth } = await supabase.auth.getUser();
  const owner = auth.user;
  if (!owner) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  if (!serialSecretIsSet()) {
    // Without it the serial could be shown once and never again, which is a
    // worse promise than refusing now.
    return NextResponse.json({ error: "no_serial_secret" }, { status: 501 });
  }

  const data = input.data;

  /* The configuration, rebuilt from his answers and checked before it is kept. */
  const base = {
    ...defaultConfiguration(data.pack, data.language),
    business: {
      nameLatin: data.business.nameLatin,
      nameArabic: data.business.nameArabic,
      phone: data.business.phone,
      address: data.business.address,
    },
  };
  const answered = applyAnswers(
    base,
    interviewFor(data.pack),
    data.answers as Record<string, never>
  );
  const configuration = configurationSchema.safeParse({
    ...answered,
    common: (data.patched?.common ?? answered.common) as typeof answered.common,
    features: (data.patched?.features ??
      answered.features) as typeof answered.features,
  });

  if (!configuration.success) {
    return NextResponse.json({ error: "invalid_configuration" }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "no_database" }, { status: 501 });
  }

  /*
   * An owner who taps Create twice, or comes back after a failure, gets the
   * business he already has rather than a second one beside it.
   */
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", owner.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: already } = await admin
      .from("serials")
      .select("serial_cipher")
      .eq("business_id", existing.id)
      .maybeSingle();

    if (already?.serial_cipher) {
      const { decryptSerial } = await import("@/builder/serial/cipher");
      const serial = await decryptSerial(already.serial_cipher);
      if (serial) return NextResponse.json({ businessId: existing.id, serial });
    }
  }

  /*
   * Which side of the launch offer he falls on is decided once, here, and
   * kept. Counting again later would move his price under him as other people
   * sign up, and the offer promises the opposite.
   *
   * Two owners finishing in the same second could both see the same count and
   * both be counted in. At a hundred clients that is a rounding error in our
   * favour, not a hole worth a lock.
   */
  const settings = await getPublicSettings();
  const { count } = await admin
    .from("businesses")
    .select("id", { count: "exact", head: true });

  const limit = settings?.launch_clients_limit ?? 0;
  const launchClient = (count ?? limit) < limit;
  const freezeYears = settings?.launch_price_freeze_years ?? null;
  const frozenUntil =
    launchClient && freezeYears
      ? new Date(
          Date.UTC(
            new Date().getUTCFullYear() + freezeYears,
            new Date().getUTCMonth(),
            new Date().getUTCDate()
          )
        ).toISOString()
      : null;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      owner_id: owner.id,
      launch_client: launchClient,
      price_frozen_until: frozenUntil,
      name_latin: data.business.nameLatin,
      name_arabic: data.business.nameArabic ?? null,
      pack: data.pack,
      app_language: configuration.data.language.app,
      receipt_phone: data.business.phone ?? null,
      receipt_address: data.business.address ?? null,
    })
    .select("id")
    .single();

  if (businessError || !business) {
    // The owner sees one sentence; the log has to say what actually broke,
    // or the next person debugging this is guessing.
    console.error("builder/finish: business not saved", businessError);
    return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  const { error: configError } = await admin.from("configurations").insert({
    business_id: business.id,
    version: 1,
    schema_version: String(configuration.data.version),
    config: configuration.data,
  });
  if (configError) {
    console.error("builder/finish: configuration not saved", configError);
    await admin.from("businesses").delete().eq("id", business.id);
    return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  /*
   * Asking whether a serial is taken is a question about another owner's row,
   * so it is asked with the service role and never from the browser.
   */
  const serial = await makeUniqueSerial(async (candidate) => {
    const hash = await hashSerial(candidate);
    const { data: clash } = await admin
      .from("serials")
      .select("business_id")
      .eq("serial_hash", hash)
      .maybeSingle();
    return Boolean(clash);
  });

  const { error: serialError } = await admin.from("serials").insert({
    business_id: business.id,
    serial_hash: await hashSerial(serial),
    serial_cipher: await encryptSerial(serial),
  });

  if (serialError) {
    console.error("builder/finish: serial not saved", serialError);
    // Without a serial the business is of no use to anyone, and leaving it
    // behind would make his next attempt find an empty shell and stop.
    await admin.from("businesses").delete().eq("id", business.id);
    return NextResponse.json({ error: "no_serial" }, { status: 502 });
  }

  /*
   * A trial licence with no dates on it. It starts when a desktop device
   * activates for the first time, not when the account is made: an owner who
   * builds his software on Friday and installs it on Monday should not lose
   * the weekend.
   */
  await admin.from("licences").insert({
    business_id: business.id,
    plan: "trial",
    status: "trial",
    starts_at: null,
    ends_at: null,
    renewal_secret: crypto.randomUUID(),
  });

  /*
   * A shop built in test mode is staff trying the software on their own
   * computer, and that computer has had a trial already: the one-trial-per-
   * machine rule would refuse the second build, doing its job against the
   * wrong person. Such a shop gets its trial by the same override staff give
   * by hand in Essais, with the reason written and the grant in the audit
   * trail. The test-mode cookie is signed by the server and set only from
   * the admin area, so no owner can give himself one.
   */
  if (isTester(cookies().get(TESTER_COOKIE)?.value)) {
    await admin.from("trial_overrides").insert({
      business_id: business.id,
      reason: "Créé en mode test depuis l'administration",
    });
    await audit({
      actorId: null,
      subject: "licence",
      subjectId: business.id,
      action: "trial_granted_test_mode",
      detail: {},
    });
  }

  if (data.products.length > 0) {
    await supabase.from("products_initial").insert(
      data.products.map((one) => ({
        business_id: business.id,
        row_number: one.row,
        data: one,
      }))
    );
  }

  if (data.staff.length > 0) {
    await supabase.from("staff_initial").insert(
      data.staff.map((person) => ({
        business_id: business.id,
        name: person.name,
        role: person.role,
      }))
    );
  }

  return NextResponse.json({ businessId: business.id, serial });
}
