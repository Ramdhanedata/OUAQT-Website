import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appLanguages,
  configurationSchema,
  defaultConfiguration,
} from "@/app-ui/config";
import { packs } from "@/app-ui/packs";
import { adminClient, sessionClient } from "@/builder/db/server";
import { applyAnswers } from "@/builder/packs/bank";
import { interviewFor } from "@/builder/packs";
import { encryptSerial, serialSecretIsSet } from "@/builder/serial/cipher";
import { hashSerial, makeUniqueSerial } from "@/builder/serial/serial";

/*
 * The end of the interview: a business, a configuration, and the number he
 * will type into the shop computer.
 *
 * It runs as the owner, not as staff, so row level security is doing the work
 * rather than trust. The one thing it borrows the service role for is asking
 * whether a serial is already taken, which is a question about somebody
 * else's row and which no owner may ask directly.
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

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      owner_id: owner.id,
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
    return NextResponse.json({ error: "not_saved" }, { status: 502 });
  }

  await supabase.from("configurations").insert({
    business_id: business.id,
    version: 1,
    schema_version: String(configuration.data.version),
    config: configuration.data,
  });

  /*
   * Asking whether a serial is taken is a question about another owner's row,
   * so it is asked with the service role and never from the browser.
   */
  const admin = adminClient();
  const serial = await makeUniqueSerial(async (candidate) => {
    if (!admin) return false;
    const hash = await hashSerial(candidate);
    const { data: clash } = await admin
      .from("serials")
      .select("business_id")
      .eq("serial_hash", hash)
      .maybeSingle();
    return Boolean(clash);
  });

  const { error: serialError } = await supabase.from("serials").insert({
    business_id: business.id,
    serial_hash: await hashSerial(serial),
    serial_cipher: await encryptSerial(serial),
  });

  if (serialError) {
    return NextResponse.json({ error: "no_serial" }, { status: 502 });
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
