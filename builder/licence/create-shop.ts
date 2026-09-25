import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { appLanguages, configurationSchema, defaultConfiguration } from "@/app-ui/config";
import { packs } from "@/app-ui/packs";
import { audit } from "@/builder/db/audit";
import { getPublicSettings } from "@/builder/db/settings";
import { applyAnswers } from "@/builder/packs/bank";
import { interviewFor } from "@/builder/packs";
import { decryptSerial, encryptSerial } from "@/builder/serial/cipher";
import { hashSerial, makeUniqueSerial } from "@/builder/serial/serial";

/*
 * A shop, from finished answers: the business, its configuration, its
 * numéro de série, its trial licence, and the starting products, staff and
 * logo. One function, reached two ways:
 *
 *   step 4 on the website   the owner creates his account, then this runs
 *                           for that account.
 *   his numéro de série     typed on the computer's website, or into the
 *                           software, before step 4; this runs for the
 *                           session the phone answered the questions under,
 *                           which is who the configuration belongs to until
 *                           an account claims it.
 *
 * The numéro de série is given on the phone when the questions end, before
 * any shop exists, so it arrives here reserved and is used as it is.
 *
 * Calling it twice does not make a second business. A retry returns what the
 * first attempt built. Every write is made with the service role, so the
 * caller is the one that checks who is asking.
 */

export const product = z.object({
  row: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  price: z.number().nonnegative(),
  quantity: z.number(),
  barcode: z.string().max(60).optional(),
  expiry: z.string().max(10).optional(),
  batch: z.string().max(60).optional(),
  unit: z.string().max(40).optional(),
  /* The word written beside a quantity, "boîtes", "sachets": the unit when no unit column says it. */
  quantityUnit: z.string().max(40).optional(),
  location: z.string().max(60).optional(),
  soldBy: z.string().max(40).optional(),
});

export const shopInput = z.object({
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

export type ShopInput = z.infer<typeof shopInput>;
export type ImportedRow = z.infer<typeof product>;

export type CreatedShop =
  | { ok: true; businessId: string; serial: string; created: boolean }
  | { ok: false; error: "invalid_configuration" | "not_saved" | "no_serial"; status: number };

/** The configuration his answers describe, checked against the schema. */
export function configurationFrom(data: ShopInput) {
  const base = {
    ...defaultConfiguration(data.pack, data.language),
    business: {
      nameLatin: data.business.nameLatin,
      nameArabic: data.business.nameArabic,
      phone: data.business.phone,
      address: data.business.address,
    },
  };
  const answered = applyAnswers(base, interviewFor(data.pack), data.answers as Record<string, never>);
  return configurationSchema.safeParse({
    ...answered,
    common: (data.patched?.common ?? answered.common) as typeof answered.common,
    features: (data.patched?.features ?? answered.features) as typeof answered.features,
  });
}

/*
 * The same value written the same way whatever order its keys come in: the
 * database stores a configuration with its keys reordered, so comparing the
 * raw text would see a change every time.
 */
function sameValue(a: unknown, b: unknown): boolean {
  const stable = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(stable)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.keys(value as object).sort().map((key) => [key, stable((value as Record<string, unknown>)[key])]))
        : value;
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

/*
 * A shop that exists already, brought up to the answers just given. The owner
 * who finishes the questions again, with another trade or another name, gets
 * the software he just described, not the one he described last week. The
 * change is a new version of the configuration, never an edit of the one a
 * running shop uses; the app picks it up the next time it asks.
 */
export type LogoPaths = { colourPath: string; monoPath: string };

/*
 * A running shop following what its owner changed on the website: his
 * answers, his name, his logo and his staff. Anything that differs becomes
 * a new version of the configuration, which is the number the app asks
 * about, so the next refresh brings it to every computer in the shop.
 */
export async function followAnswers(
  admin: SupabaseClient,
  businessId: string,
  data: ShopInput,
  /* The logo the shop should have: null for none, left out to leave it as it is. */
  logo?: LogoPaths | null
): Promise<void> {
  const configuration = configurationFrom(data);
  if (!configuration.success) return;

  /* A new logo is a new file (its name carries its content), so a new path is a new logo. */
  let logoChanged = false;
  if (logo === null) {
    const { data: current } = await admin.from("logos").select("business_id").eq("business_id", businessId).maybeSingle();
    if (current) {
      await admin.from("logos").delete().eq("business_id", businessId);
      logoChanged = true;
    }
  } else if (logo) {
    const { data: current } = await admin.from("logos").select("colour_path, mono_path").eq("business_id", businessId).maybeSingle();
    if (!current || current.colour_path !== logo.colourPath || current.mono_path !== logo.monoPath) {
      await admin.from("logos").upsert({ business_id: businessId, colour_path: logo.colourPath, mono_path: logo.monoPath });
      logoChanged = true;
    }
  }

  /* The staff list as he last wrote it; the app adds the names it does not have yet. */
  let staffChanged = false;
  const { data: staffNow } = await admin.from("staff_initial").select("name, role").eq("business_id", businessId);
  const shape = (list: { name: string; role: string }[]) =>
    JSON.stringify(list.map((person) => `${person.name.trim()}|${person.role}`).sort());
  if (shape(staffNow ?? []) !== shape(data.staff)) {
    await admin.from("staff_initial").delete().eq("business_id", businessId);
    if (data.staff.length > 0) {
      await admin.from("staff_initial").insert(data.staff.map((person) => ({ business_id: businessId, name: person.name, role: person.role })));
    }
    staffChanged = true;
  }

  await admin
    .from("businesses")
    .update({
      name_latin: data.business.nameLatin,
      name_arabic: data.business.nameArabic ?? null,
      pack: data.pack,
      app_language: configuration.data.language.app,
      receipt_phone: data.business.phone ?? null,
      receipt_address: data.business.address ?? null,
    })
    .eq("id", businessId);

  const { data: latest } = await admin
    .from("configurations")
    .select("version, config")
    .eq("business_id", businessId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const answersChanged = !latest || !sameValue(latest.config, configuration.data);
  if (!answersChanged && !logoChanged && !staffChanged) return;

  await admin.from("configurations").insert({
    business_id: businessId,
    version: (latest?.version ?? 0) + 1,
    schema_version: String(configuration.data.version),
    config: configuration.data,
    created_by: answersChanged ? "answers_changed" : logoChanged ? "logo_changed" : "staff_changed",
  });
}

export async function createShop(
  admin: SupabaseClient,
  ownerId: string,
  data: ShopInput,
  options: { tester: boolean; logo?: { colourPath: string; monoPath: string } | null; serial?: string | null }
): Promise<CreatedShop> {
  const configuration = configurationFrom(data);
  if (!configuration.success) return { ok: false, error: "invalid_configuration", status: 400 };

  /*
   * An owner who taps Create twice, or comes back after a failure, gets the
   * business he already has rather than a second one beside it.
   */
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", ownerId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: already } = await admin
      .from("serials")
      .select("serial_cipher")
      .eq("business_id", existing.id)
      .maybeSingle();
    if (already?.serial_cipher) {
      const serial = await decryptSerial(already.serial_cipher);
      if (serial) {
        await followAnswers(admin, existing.id, data, options.logo);
        return { ok: true, businessId: existing.id, serial, created: false };
      }
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
  const { count } = await admin.from("businesses").select("id", { count: "exact", head: true });

  const limit = settings?.launch_clients_limit ?? 0;
  const launchClient = (count ?? limit) < limit;
  const freezeYears = settings?.launch_price_freeze_years ?? null;
  const now = new Date();
  const frozenUntil =
    launchClient && freezeYears
      ? new Date(Date.UTC(now.getUTCFullYear() + freezeYears, now.getUTCMonth(), now.getUTCDate())).toISOString()
      : null;

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      owner_id: ownerId,
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
    console.error("create-shop: business not saved", businessError);
    return { ok: false, error: "not_saved", status: 502 };
  }

  const { error: configError } = await admin.from("configurations").insert({
    business_id: business.id,
    version: 1,
    schema_version: String(configuration.data.version),
    config: configuration.data,
  });
  if (configError) {
    console.error("create-shop: configuration not saved", configError);
    await admin.from("businesses").delete().eq("id", business.id);
    return { ok: false, error: "not_saved", status: 502 };
  }

  /*
   * Asking whether a serial is taken is a question about another owner's row,
   * so it is asked with the service role and never from the browser.
   */
  const serial =
    options.serial ??
    (await makeUniqueSerial(async (candidate) => {
      const hash = await hashSerial(candidate);
      const { data: clash } = await admin.from("serials").select("business_id").eq("serial_hash", hash).maybeSingle();
      return Boolean(clash);
    }));

  const { error: serialError } = await admin.from("serials").insert({
    business_id: business.id,
    serial_hash: await hashSerial(serial),
    serial_cipher: await encryptSerial(serial),
  });
  if (serialError) {
    console.error("create-shop: serial not saved", serialError);
    // Without a serial the business is of no use to anyone, and leaving it
    // behind would make his next attempt find an empty shell and stop.
    await admin.from("businesses").delete().eq("id", business.id);
    return { ok: false, error: "no_serial", status: 502 };
  }

  /*
   * A trial licence with no dates on it. It starts when a desktop device
   * activates for the first time, not when the shop is made: an owner who
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
  if (options.tester) {
    await admin.from("trial_overrides").insert({
      business_id: business.id,
      reason: "Créé en mode test depuis l'administration",
    });
    await audit({ actorId: null, subject: "licence", subjectId: business.id, action: "trial_granted_test_mode", detail: {} });
  }

  if (data.products.length > 0) {
    await admin.from("products_initial").insert(
      data.products.map((one) => ({ business_id: business.id, row_number: one.row, data: one }))
    );
  }

  if (data.staff.length > 0) {
    await admin.from("staff_initial").insert(
      data.staff.map((person) => ({ business_id: business.id, name: person.name, role: person.role }))
    );
  }

  /* The logo he uploaded with his configuration, so his receipt carries it. */
  if (options.logo) {
    await admin.from("logos").insert({
      business_id: business.id,
      colour_path: options.logo.colourPath,
      mono_path: options.logo.monoPath,
    });
  }

  return { ok: true, businessId: business.id, serial, created: true };
}
