/*
 * The desktop app, played by a script.
 *
 * It does what a shop computer does and checks what a shop computer would
 * check: activate, verify the signature with the public key, refuse a third
 * machine, free one, refresh, and renew from a code read over the phone. It
 * also tries the things a shop computer must never manage to do.
 *
 *   npm run licence:client [http://localhost:3000]
 *
 * It creates its own throwaway business and removes it at the end, so it can
 * be run against the test project as often as you like.
 */

import { createClient } from "@supabase/supabase-js";

const base = process.argv[2] ?? "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.LICENCE_PUBLIC_KEY;

if (!url || !service || !publicKey) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and LICENCE_PUBLIC_KEY.");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });

let failures = 0;
function check(what, passed, detail = "") {
  if (!passed) failures += 1;
  console.log(`  ${passed ? "pass" : "FAIL"}  ${what}${detail ? `  ${detail}` : ""}`);
}

async function post(path, body, headers = {}) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

/* ── What the desktop app will do with a licence file ───────────────────── */

function fromBase64Url(text) {
  return new Uint8Array(Buffer.from(text, "base64url"));
}

async function verifyLicence(signed) {
  const [body, signature] = signed.split(".");
  const key = await crypto.subtle.importKey(
    "spki",
    fromBase64Url(publicKey),
    { name: "Ed25519" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify(
    { name: "Ed25519" },
    key,
    fromBase64Url(signature),
    new TextEncoder().encode(body)
  );
  return ok ? JSON.parse(Buffer.from(body, "base64url").toString("utf8")) : null;
}

/* ── A shop to test with ────────────────────────────────────────────────── */

const stamp = Date.now();
const email = `licence-client-${stamp}@${process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN ?? "ouaqtcom.vercel.app"}`;
const password = `licence-client-${stamp}`;

console.log(`\nAgainst ${base}\n`);

const { data: made } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
const owner = made.user;

const { data: business } = await admin
  .from("businesses")
  .insert({
    owner_id: owner.id,
    name_latin: "Test Licence Client",
    pack: "pharmacy",
    app_language: "fr",
  })
  .select("id")
  .single();

const { data: licenceRow } = await admin
  .from("licences")
  .insert({
    business_id: business.id,
    plan: "trial",
    status: "trial",
    renewal_secret: crypto.randomUUID(),
  })
  .select("id, renewal_secret")
  .single();

/* The serial, made the way the finish route makes one. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function makeSerial() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}
async function hashSerial(serial) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serial));
  return Buffer.from(digest).toString("hex");
}

const serial = makeSerial();
await admin.from("serials").insert({
  business_id: business.id,
  serial_hash: await hashSerial(serial),
  serial_cipher: "test-client-does-not-decrypt",
});

/*
 * What the builder would have written for this shop: the configuration the
 * app rearranges itself around, a couple of products and one cashier. Prices
 * are in the smallest unit, the way the whole system holds money.
 */
await admin.from("configurations").insert({
  business_id: business.id,
  version: 1,
  schema_version: "1",
  config: { pack: "pharmacy", language: { app: "fr" } },
});
await admin.from("products_initial").insert([
  { business_id: business.id, row_number: 1, data: { name: "Paracétamol 500mg", price: 12050, quantity: 24 } },
  { business_id: business.id, row_number: 2, data: { name: "Gants, boîte", price: 40000, quantity: 6 } },
]);
await admin.from("staff_initial").insert({
  business_id: business.id,
  name: "Caissier",
  role: "cashier",
});

/* ── Activation ─────────────────────────────────────────────────────────── */

console.log("Activation\n");

const first = await post("/api/licence/activate", {
  serial,
  deviceId: `device-one-${stamp}`,
  deviceName: "Caisse",
  platform: "windows",
});
check("the first computer activates", first.status === 200, `status ${first.status}`);

const licence = first.body?.licence ? await verifyLicence(first.body.licence) : null;
check("the licence is signed by us", licence !== null);
check("it carries the grace days the app needs offline", licence?.renewalGraceDays > 0,
  `renewalGraceDays ${licence?.renewalGraceDays}, clockGraceDays ${licence?.clockGraceDays}`);
check("the trial started at activation, not before", Boolean(licence?.startsAt));
check("it knows when to show the owner what his trial did", licence?.trialSummaryDays > 0,
  `trialSummaryDays ${licence?.trialSummaryDays}`);
check("this computer is the main one", licence?.devices?.[0]?.role === "main");

/*
 * One call has to be enough. A shop on a borrowed hotspot activates, and is
 * then on its own with everything it needs.
 */
check("the configuration arrives with the licence", first.body?.configuration?.pack === "pharmacy");
check("so does the product list", first.body?.products?.length === 2,
  `${first.body?.products?.length ?? 0} products`);
check("prices arrive in the smallest unit", first.body?.products?.[0]?.price === 12050,
  String(first.body?.products?.[0]?.price));
check("so does the staff list", first.body?.staff?.[0]?.role === "cashier");
check("the configuration names its version", first.body?.configurationVersion === 1,
  String(first.body?.configurationVersion));

const tampered = first.body.licence.replace(/^(.{20})./, "$1X");
check("an edited licence does not verify", (await verifyLicence(tampered)) === null);

const second = await post("/api/licence/activate", {
  serial,
  deviceId: `device-two-${stamp}`,
  platform: "windows",
});
check("the second computer activates", second.status === 200, `status ${second.status}`);

const again = await post("/api/licence/activate", {
  serial,
  deviceId: `device-one-${stamp}`,
  platform: "windows",
});
check("the same computer again is not a third", again.status === 200, `status ${again.status}`);

const third = await post("/api/licence/activate", {
  serial,
  deviceId: `device-three-${stamp}`,
  platform: "mac",
});
check("a third computer is refused", third.status === 409, `status ${third.status}, ${third.body?.error}`);

/* ── Refresh ────────────────────────────────────────────────────────────── */

console.log("\nRefresh\n");

const token = again.body.deviceToken;
const refreshed = await post("/api/licence/refresh", {
  businessId: business.id,
  deviceId: `device-one-${stamp}`,
  deviceToken: token,
});
check("a computer with its token gets a fresh licence", refreshed.status === 200);
check("and is sent the lists again when it names no version",
  refreshed.body?.products?.length === 2);

const refreshedSame = await post("/api/licence/refresh", {
  businessId: business.id,
  deviceId: `device-one-${stamp}`,
  deviceToken: token,
  configurationVersion: 1,
});
check("a computer already holding the current version is sent no lists",
  refreshedSame.status === 200 &&
    refreshedSame.body?.configuration === null &&
    refreshedSame.body?.products === null &&
    refreshedSame.body?.staff === null,
  `status ${refreshedSame.status}`);

const wrongToken = await post("/api/licence/refresh", {
  businessId: business.id,
  deviceId: `device-one-${stamp}`,
  deviceToken: "not-the-right-token-at-all",
});
check("a wrong token is refused", wrongToken.status === 403, `status ${wrongToken.status}`);

const withSales = await post("/api/licence/refresh", {
  businessId: business.id,
  deviceId: `device-one-${stamp}`,
  deviceToken: token,
  sales: [{ total: 4500 }],
});
check("a body carrying sales is refused outright", withSales.status === 400,
  `status ${withSales.status}, ${withSales.body?.error}`);

const withStock = await post("/api/licence/activate", {
  serial,
  deviceId: `device-one-${stamp}`,
  platform: "windows",
  stock: [{ product: "x", quantity: 3 }],
});
check("so is one carrying stock", withStock.status === 400, `status ${withStock.status}`);

/* ── Releasing a computer ───────────────────────────────────────────────── */

console.log("\nReleasing\n");

const visitor = createClient(url, anon, { auth: { persistSession: false } });
const { data: session } = await visitor.auth.signInWithPassword({ email, password });
const bearer = { authorization: `Bearer ${session.session.access_token}` };

const released = await post("/api/builder/device", { deviceId: `device-two-${stamp}` }, bearer);
check("the owner frees a dead computer", released.status === 200, `status ${released.status}`);

const refreshAfterRelease = await post("/api/licence/refresh", {
  businessId: business.id,
  deviceId: `device-two-${stamp}`,
  deviceToken: second.body.deviceToken,
});
check("the freed computer stops refreshing", refreshAfterRelease.status === 404);

const nowFits = await post("/api/licence/activate", {
  serial,
  deviceId: `device-three-${stamp}`,
  platform: "mac",
});
check("a new computer fits in the freed place", nowFits.status === 200, `status ${nowFits.status}`);

/* ── Renewal codes ──────────────────────────────────────────────────────── */

console.log("\nRenewal codes\n");

const { deviceCodeFor, makeRenewalCode, verifyRenewalCode } = await import(
  "../app-ui/codes.ts"
).catch(() => import("../app-ui/codes.js"));

const codeOne = await deviceCodeFor(`device-one-${stamp}`);
const codeThree = await deviceCodeFor(`device-three-${stamp}`);
const endsAt = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 8, 20));

const renewal = await makeRenewalCode({
  deviceCode: codeOne,
  endsAt,
  secret: licenceRow.renewal_secret,
});

const checkedHere = await verifyRenewalCode({
  code: renewal,
  deviceCode: codeOne,
  secret: licenceRow.renewal_secret,
});
check("the code renews the computer it was made for", checkedHere.ok,
  checkedHere.ok ? checkedHere.endsAt.toISOString().slice(0, 10) : checkedHere.reason);

const checkedThere = await verifyRenewalCode({
  code: renewal,
  deviceCode: codeThree,
  secret: licenceRow.renewal_secret,
});
check("the same code fails on another computer", !checkedThere.ok, checkedThere.reason ?? "");

const checkedElsewhere = await verifyRenewalCode({
  code: renewal,
  deviceCode: codeOne,
  secret: crypto.randomUUID(),
});
check("and fails for another shop's licence", !checkedElsewhere.ok);

/* ── Clearing up ────────────────────────────────────────────────────────── */

await admin.from("businesses").delete().eq("id", business.id);
await admin.auth.admin.deleteUser(owner.id);

console.log(
  failures === 0
    ? "\nEverything a shop computer does, and everything it must not.\n"
    : `\n${failures} checks failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
