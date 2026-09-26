/*
 * A pharmacy that does not exist, for activating the desktop app against.
 *
 *   npm run test-shop -- create [--ar]     a shop, its serial, invented stock
 *   npm run test-shop -- link <businessId> a one-click link for that shop
 *   npm run test-shop -- expire <businessId> its free trial, already over
 *   npm run test-shop -- remove <businessId>
 *
 * Everything in it is invented: the name, the products, the prices, the
 * cashier. It lives in the test project only, and the licence client's
 * cleanup does not touch it, so it stays until it is removed on purpose.
 */

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });
const [command, ...rest] = process.argv.slice(2);
const sha = (value) => createHash("sha256").update(value).digest("hex");

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function makeSerial() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

async function create(arabic) {
  const stamp = Date.now();
  const { data: made, error } = await admin.auth.admin.createUser({
    email: `9${String(stamp).slice(-10)}@${process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN ?? "ouaqtcom.vercel.app"}`,
    password: `test-shop-${stamp}`,
    email_confirm: true,
  });
  if (error) throw error;

  const { data: business } = await admin
    .from("businesses")
    .insert({
      owner_id: made.user.id,
      name_latin: "Pharmacie Essai",
      name_arabic: "صيدلية تجريبية",
      pack: "pharmacy",
      app_language: arabic ? "ar" : "fr",
      receipt_phone: "22200000000",
      receipt_address: "Nouakchott",
    })
    .select("id")
    .single();

  await admin.from("configurations").insert({
    business_id: business.id,
    version: 1,
    schema_version: "1",
    config: {
      version: 1,
      pack: "pharmacy",
      business: {
        nameLatin: "Pharmacie Essai",
        nameArabic: "صيدلية تجريبية",
        phone: "22200000000",
        address: "Nouakchott",
      },
      language: { builder: arabic ? "ar" : "fr", app: arabic ? "ar" : "fr" },
      receipt: { showLogo: false, showPhone: true, showAddress: true },
      common: {
        devices: 1,
        cashiers: "owner",
        cashClose: "daily",
        credit: { enabled: true, limitPerCustomer: false },
        printedReceipt: true,
        lowStockAlert: true,
        discounts: false,
      },
      features: {
        pharmacy: {
          unitSale: true,
          trackExpiry: true,
          expiryAlertMonths: 3,
          batchNumbers: true,
          trackSuppliers: true,
          search: ["name"],
        },
      },
    },
  });

  /*
   * Invented products, priced in the smallest unit. Nothing that needs a
   * prescription: how those are sold and recorded is a question for Adel,
   * and test data should not answer it by accident.
   */
  const products = [
    { name: "Paracétamol 500 mg, boîte", price: 4500, quantity: 60, batch: "L-2401", expiry: "2027-03-31" },
    { name: "Vitamine C 500 mg, tube", price: 18000, quantity: 25, batch: "L-2388", expiry: "2026-12-31" },
    { name: "Sérum physiologique, 30 doses", price: 9000, quantity: 40 },
    { name: "Pansements, boîte", price: 25000, quantity: 12 },
    { name: "Gants, boîte", price: 40000, quantity: 8 },
    { name: "Thermomètre", price: 90000, quantity: 5 },
  ];
  await admin.from("products_initial").insert(
    products.map((data, index) => ({ business_id: business.id, row_number: index + 1, data }))
  );
  await admin.from("staff_initial").insert([
    { business_id: business.id, name: "Caissier du matin", role: "cashier" },
  ]);

  await admin.from("licences").insert({
    business_id: business.id,
    plan: "trial",
    status: "trial",
    renewal_secret: crypto.randomUUID(),
  });

  const serial = makeSerial();
  await admin.from("serials").insert({
    business_id: business.id,
    serial_hash: sha(serial),
    serial_cipher: "test-shop-does-not-decrypt",
  });

  console.log(`\nA test pharmacy, invented from end to end.\n`);
  console.log(`  business  ${business.id}`);
  console.log(`  serial    ${serial}`);
  console.log(`  language  ${arabic ? "ar" : "fr"}\n`);
}

async function link(businessId) {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  await admin.from("activation_tokens").insert({
    business_id: businessId,
    token_hash: sha(token),
    expires_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
  });
  /* Printed because this is a test shop on the test project, and nowhere else. */
  console.log(`ouaqt://activate?token=${token}`);
}

/*
 * A trial that started a month ago and ended yesterday, to see what the
 * software shows when the trial is over and to pay for it. Activating it
 * starts no new trial, so the one-trial-per-computer rule does not get in
 * the way on a machine that has had one.
 */
async function expire(businessId) {
  const day = 86_400_000;
  const { data, error } = await admin
    .from("licences")
    .update({
      starts_at: new Date(Date.now() - 31 * day).toISOString(),
      ends_at: new Date(Date.now() - day).toISOString(),
    })
    .eq("business_id", businessId)
    .eq("plan", "trial")
    .select("id");
  if (error || !data?.length) {
    console.error("No trial licence found for that shop.");
    process.exit(1);
  }
  console.log("the trial ended yesterday");
}

async function remove(businessId) {
  const { data: business } = await admin.from("businesses").select("owner_id").eq("id", businessId).maybeSingle();
  await admin.from("businesses").delete().eq("id", businessId);
  if (business?.owner_id) await admin.auth.admin.deleteUser(business.owner_id);
  console.log("removed");
}

if (command === "create") await create(rest.includes("--ar"));
else if (command === "link" && rest[0]) await link(rest[0]);
else if (command === "expire" && rest[0]) await expire(rest[0]);
else if (command === "remove" && rest[0]) await remove(rest[0]);
else {
  console.log("create [--ar] | link <businessId> | expire <businessId> | remove <businessId>");
  process.exit(1);
}
