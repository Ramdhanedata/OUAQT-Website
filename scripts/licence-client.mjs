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

import { createHash } from "node:crypto";
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

/*
 * The machine, as the app will send it: three salted hashes and no serial
 * numbers. Two of the three agreeing is the same computer, so a part can be
 * replaced without the owner losing anything.
 */
const FINGERPRINT_SALT = "ouaqt-desktop"; // the app ships one; it hides values, it is not a secret
function part(value) {
  return createHash("sha256").update(`${FINGERPRINT_SALT}:${value}`).digest("hex");
}
function machine(board, disk, id) {
  return { board: part(board), disk: part(disk), machine: part(id) };
}

const thisPc = machine(`board-${stamp}`, `disk-${stamp}`, `os-${stamp}`);

const first = await post("/api/licence/activate", {
  serial,
  deviceId: `device-one-${stamp}`,
  deviceName: "Caisse",
  platform: "windows",
  fingerprint: thisPc,
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

/* ── One trial per shop, and the honest people that rule is wrong about ─── */

console.log("\nTrials\n");

/*
 * A second shop, with its own owner, its own serial and its own phone.
 *
 * The phone is the digits of the login, so each of these needs a different
 * one or they all look like the same person trying again. Which is the rule
 * working, but not the rule under test.
 */
let shopCounter = 0;
async function anotherShop(label, phone = `${stamp}${(shopCounter += 1)}`) {
  const { data: madeUser } = await admin.auth.admin.createUser({
    email: `${phone}@${process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN ?? "ouaqtcom.vercel.app"}`,
    password: `licence-client-${label}-${stamp}`,
    email_confirm: true,
  });
  const { data: shop } = await admin
    .from("businesses")
    .insert({
      owner_id: madeUser.user.id,
      name_latin: `Test ${label}`,
      pack: "pharmacy",
      app_language: "fr",
    })
    .select("id")
    .single();
  await admin.from("licences").insert({
    business_id: shop.id,
    plan: "trial",
    status: "trial",
    renewal_secret: crypto.randomUUID(),
  });
  const ownSerial = makeSerial();
  await admin.from("serials").insert({
    business_id: shop.id,
    serial_hash: await hashSerial(ownSerial),
    serial_cipher: "test-client-does-not-decrypt",
  });
  return { id: shop.id, ownerId: madeUser.user.id, serial: ownSerial };
}

const shops = [];

/*
 * The plain case: a different shop, a different phone, the same computer. It
 * is refused, and the refusal carries the number to call rather than a
 * lecture.
 */
const sameMachineShop = await anotherShop("same-machine");
shops.push(sameMachineShop);
const onSameMachine = await post("/api/licence/activate", {
  serial: sameMachineShop.serial,
  deviceId: `device-other-${stamp}`,
  platform: "windows",
  fingerprint: thisPc,
});
check("a second shop on the same computer is refused", onSameMachine.status === 403,
  `status ${onSameMachine.status}, ${onSameMachine.body?.error}`);
check("the refusal says which rule, not who is to blame",
  onSameMachine.body?.because === "same_machine", String(onSameMachine.body?.because));
check("and hands over the number to call",
  Boolean(onSameMachine.body?.supportWhatsapp), onSameMachine.body?.supportWhatsapp ?? "");

/*
 * A repaired PC. The disk died and was replaced, so one part of three is new.
 * It is still the same computer, which is the point of using three.
 */
const repairedShop = await anotherShop("repaired");
shops.push(repairedShop);
const repaired = { ...thisPc, disk: part(`new-disk-${stamp}`) };
const afterRepair = await post("/api/licence/activate", {
  serial: repairedShop.serial,
  deviceId: `device-repaired-${stamp}`,
  platform: "windows",
  fingerprint: repaired,
});
check("a repaired PC is still recognised as the same machine", afterRepair.status === 403,
  `status ${afterRepair.status}`);

/* A genuinely different computer gets its own trial, as it should. */
const freshShop = await anotherShop("fresh");
shops.push(freshShop);
const onNewPc = await post("/api/licence/activate", {
  serial: freshShop.serial,
  deviceId: `device-fresh-${stamp}`,
  platform: "windows",
  fingerprint: machine(`board-b-${stamp}`, `disk-b-${stamp}`, `os-b-${stamp}`),
});
check("a different computer gets its own trial", onNewPc.status === 200,
  `status ${onNewPc.status}`);

/*
 * The same man, a new computer, the same telephone. The machine is different
 * and the number is not, which is the other half of the rule.
 */
/* The digits of the first owner's login, on a brand new account. */
const samePhoneShop = await anotherShop("same-phone", `${stamp}`);
shops.push(samePhoneShop);
const onSamePhone = await post("/api/licence/activate", {
  serial: samePhoneShop.serial,
  deviceId: `device-phone-${stamp}`,
  platform: "windows",
  fingerprint: machine(`board-c-${stamp}`, `disk-c-${stamp}`, `os-c-${stamp}`),
});
check("a second shop on the same phone number is refused",
  onSamePhone.status === 403 && onSamePhone.body?.because === "same_phone",
  `status ${onSamePhone.status}, ${onSamePhone.body?.because}`);

/* An app that sends no fingerprint at all is asked for one, not let through. */
const silentShop = await anotherShop("silent");
shops.push(silentShop);
const silent = await post("/api/licence/activate", {
  serial: silentShop.serial,
  deviceId: `device-silent-${stamp}`,
  platform: "windows",
});
check("an app that sends no fingerprint gets no trial", silent.status === 403,
  `status ${silent.status}, ${silent.body?.because}`);

/*
 * The second-hand PC. This owner is honest and the rule is wrong about him,
 * so someone gives him a trial by hand and his next activation works.
 */
await admin.from("trial_overrides").insert({
  business_id: sameMachineShop.id,
  reason: "Ordinateur acheté d'occasion, vérifié par téléphone",
});
const afterOverride = await post("/api/licence/activate", {
  serial: sameMachineShop.serial,
  deviceId: `device-other-${stamp}`,
  platform: "windows",
  fingerprint: thisPc,
});
check("a trial given by hand opens the door again", afterOverride.status === 200,
  `status ${afterOverride.status}`);

const { data: usedOverride } = await admin
  .from("trial_overrides")
  .select("used_at")
  .eq("business_id", sameMachineShop.id)
  .maybeSingle();
check("and is used once, not kept open", Boolean(usedOverride?.used_at));

/*
 * The same owner, refused twice before he rings us. Each refusal was a fresh
 * install, so a new device id each time. None of them may take a device slot,
 * or the trial granted by hand afterwards lands on a licence that is full.
 */
const retriedShop = await anotherShop("retried");
shops.push(retriedShop);
for (const attempt of ["one", "two"]) {
  await post("/api/licence/activate", {
    serial: retriedShop.serial,
    deviceId: `device-retried-${attempt}-${stamp}`,
    platform: "windows",
    fingerprint: thisPc,
  });
}
const { count: slotsAfterRefusals } = await admin
  .from("devices")
  .select("id", { count: "exact", head: true })
  .eq("business_id", retriedShop.id);
check("refused attempts take no device slot", slotsAfterRefusals === 0, `${slotsAfterRefusals} registered`);

await admin.from("trial_overrides").insert({ business_id: retriedShop.id, reason: "Refused twice, verified by phone" });
const afterTwoRefusals = await post("/api/licence/activate", {
  serial: retriedShop.serial,
  deviceId: `device-retried-three-${stamp}`,
  platform: "windows",
  fingerprint: thisPc,
});
const { count: slotsAfterGrant } = await admin
  .from("devices")
  .select("id", { count: "exact", head: true })
  .eq("business_id", retriedShop.id);
check("and the trial granted by hand then activates, on one computer",
  afterTwoRefusals.status === 200 && slotsAfterGrant === 1,
  `status ${afterTwoRefusals.status} ${afterTwoRefusals.body?.error ?? ""}, ${slotsAfterGrant} registered`);

/* ── One click, for an owner who built on the shop PC ──────────────────── */

console.log("\nOne-click activation\n");

/*
 * A shop of its own, so the token cases do not lean on anything above. It has
 * a fingerprint nobody has used, so its trial is not refused for reasons that
 * have nothing to do with the token.
 */
const clickShop = await anotherShop("one-click");
shops.push(clickShop);
const clickPc = machine(`board-click-${stamp}`, `disk-click-${stamp}`, `os-click-${stamp}`);

/* Step 4 asks for a token, as the owner, the way the page will. */
const ownerClient = createClient(url, anon, { auth: { persistSession: false } });
const { data: signedIn } = await ownerClient.auth.signInWithPassword({
  email: `${stamp}${shopCounter}@${process.env.NEXT_PUBLIC_ACCOUNT_EMAIL_DOMAIN ?? "ouaqtcom.vercel.app"}`,
  password: `licence-client-one-click-${stamp}`,
});
const asOwner = { authorization: `Bearer ${signedIn?.session?.access_token ?? ""}` };

const minted = await post("/api/builder/activation-token", {}, asOwner);
const link = minted.body?.link ?? "";
const oneTime = new URL(link || "ouaqt://activate").searchParams.get("token") ?? "";
check("step 4 gets a link for its own shop", minted.status === 200 && link.startsWith("ouaqt://activate?token="),
  `status ${minted.status}`);
check("the link carries a token, not the serial", oneTime.length >= 20 && oneTime !== clickShop.serial);

const { data: stored } = await admin
  .from("activation_tokens")
  .select("token_hash")
  .eq("business_id", clickShop.id);
check("only the token's hash is kept", stored?.length === 1 && stored[0].token_hash !== oneTime);

/* The PC build: the app opens from the link and activates, nothing typed. */
const clicked = await post("/api/licence/activate", {
  token: oneTime,
  deviceId: `device-click-${stamp}`,
  platform: "windows",
  fingerprint: clickPc,
});
check("a PC build activates from the link with nothing typed", clicked.status === 200,
  `status ${clicked.status}, ${clicked.body?.error ?? ""}`);
check("and gets the whole shop with it", Boolean(clicked.body?.licence) && Boolean(clicked.body?.deviceToken));

/* Used twice: the same link on a second computer. */
const twice = await post("/api/licence/activate", {
  token: oneTime,
  deviceId: `device-click-second-${stamp}`,
  platform: "windows",
  fingerprint: clickPc,
});
check("a token used twice is refused", twice.status === 403 && twice.body?.error === "bad_token",
  `status ${twice.status}, ${twice.body?.error}`);

/* Expired: a link from yesterday. */
const staleToken = `stale-${stamp}-${crypto.randomUUID()}`;
await admin.from("activation_tokens").insert({
  business_id: clickShop.id,
  token_hash: createHash("sha256").update(staleToken).digest("hex"),
  expires_at: new Date(Date.now() - 60_000).toISOString(),
});
const expired = await post("/api/licence/activate", {
  token: staleToken,
  deviceId: `device-click-stale-${stamp}`,
  platform: "windows",
  fingerprint: clickPc,
});
check("an expired token is refused", expired.status === 403 && expired.body?.error === "bad_token",
  `status ${expired.status}, ${expired.body?.error}`);

/*
 * A refused activation must not spend the link. A token for a shop whose
 * trial is refused (this PC already had one) comes back usable.
 */
const refusedShop = await anotherShop("refused-click");
shops.push(refusedShop);
const refusedToken = `refused-${stamp}-${crypto.randomUUID()}`;
const { data: refusedRow } = await admin.from("activation_tokens").insert({
  business_id: refusedShop.id,
  token_hash: createHash("sha256").update(refusedToken).digest("hex"),
  expires_at: new Date(Date.now() + 3_600_000).toISOString(),
}).select("id").single();
const refused = await post("/api/licence/activate", {
  token: refusedToken,
  deviceId: `device-refused-${stamp}`,
  platform: "windows",
  fingerprint: thisPc,
});
const { data: afterRefusal } = await admin.from("activation_tokens").select("used_at").eq("id", refusedRow.id).single();
check("a refused activation hands the token back", refused.status === 403 && afterRefusal?.used_at === null,
  `status ${refused.status}, ${refused.body?.error}`);

/* Never both proofs at once. */
const both = await post("/api/licence/activate", {
  serial: clickShop.serial,
  token: oneTime,
  deviceId: `device-both-${stamp}`,
  platform: "windows",
});
check("a serial and a token together is refused", both.status === 400);

/* A computer that already holds another shop's database. */
const otherDb = await post("/api/licence/activate", {
  serial: freshShop.serial,
  deviceId: `device-fresh-${stamp}`,
  platform: "windows",
  fingerprint: machine(`board-b-${stamp}`, `disk-b-${stamp}`, `os-b-${stamp}`),
  expectBusinessId: clickShop.id,
});
check("a serial for a different shop than this PC's database is refused",
  otherDb.status === 409 && otherDb.body?.error === "different_business",
  `status ${otherDb.status}, ${otherDb.body?.error}`);

/* ── Clearing up ────────────────────────────────────────────────────────── */

await admin.from("businesses").delete().eq("id", business.id);
await admin.auth.admin.deleteUser(owner.id);
for (const shop of shops) {
  await admin.from("businesses").delete().eq("id", shop.id);
  await admin.auth.admin.deleteUser(shop.ownerId);
}

console.log(
  failures === 0
    ? "\nEverything a shop computer does, and everything it must not.\n"
    : `\n${failures} checks failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
