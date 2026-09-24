/*
 * The owner's one number, end to end, against a running site.
 *
 *   node --env-file=.env.local scripts/configuration-code-client.mjs [base-url]
 *
 * A phone session answers and is given its numéro de série; the computer
 * types it sloppily or pastes the WhatsApp message and gets the download;
 * a guesser is slowed down without slowing anyone else; the first download
 * makes the shop with that very number, and every later one finds it again;
 * the number typed
 * straight into the software makes the shop too; a lost number is queued for
 * staff and never shown; thirty days unopened, an unused number says expired
 * and the row is kept. Everything it creates, it removes.
 */
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const base = process.argv[2] ?? "http://localhost:3000";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const session = async () => {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await c.auth.signInAnonymously();
  return { client: c, user: data.user, token: data.session.access_token };
};
const post = async (path, body, token, ip, cookie) => {
  const res = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie } : {}), "x-forwarded-for": ip ?? "10.0.0.1" }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const SERIAL = /^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;
let failures = 0;
const check = (what, ok, detail = "") => { if (!ok) failures += 1; console.log(`  ${ok ? "pass" : "FAIL"}  ${what}${detail ? "  " + detail : ""}`); };
const answers = (name, pack = "pharmacy", locale = "ar") => ({ pack, builderLanguage: locale, appLanguage: locale, nameLatin: name, nameArabic: "صيدلية الرمز", phone: "+222 22 99 88 77", interview: {} });

const phone = await session();
const tiny = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
await phone.client.from("builder_drafts").insert({ session_owner: phone.user.id, pack: "pharmacy", locale: "ar", step: 2, answers: answers("Pharmacie Numéro") });

const issued = await post("/api/builder/configuration-code", { language: "ar", logo: tiny, logoMono: tiny }, phone.token, "10.1.1.1");
const serial = issued.json?.serial ?? "";
check("the phone is given its numéro de série when its questions are done", issued.status === 200 && SERIAL.test(serial), JSON.stringify(issued.json));
check("and is told honestly that nothing was sent yet", issued.json?.sent === false && issued.json?.hasPhone === true);
const again = await post("/api/builder/configuration-code", { language: "ar" }, phone.token, "10.1.1.1");
check("asking twice gives the same number", again.json?.serial === serial);
const { data: stored } = await admin.from("builder_drafts").select("serial_hash, serial_cipher, phone, logo_path").eq("session_owner", phone.user.id).single();
check("the draft keeps it hashed and enciphered, never in the clear", Boolean(stored.serial_hash) && Boolean(stored.serial_cipher) && !JSON.stringify(stored).includes(serial));
check("and the phone as digits and the logo in storage", stored.phone === "22998877" && Boolean(stored.logo_path));
const { count: before } = await admin.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", phone.user.id);
check("no shop exists yet", before === 0);

const pc = await session();
const sloppy = `  ${serial.toLowerCase().replace("-", " ")} `;
const opened = await post("/api/builder/configuration-code/resume", { number: sloppy }, pc.token, "10.2.2.2");
check("the computer opens it, typed in lowercase with spaces", opened.status === 200 && opened.json?.serial === serial && opened.json?.pack === "pharmacy" && opened.json?.nameLatin === "Pharmacie Numéro" && opened.json?.made === false, JSON.stringify(opened.json));
check("and learns the language it was made in, and nothing more", opened.json?.locale === "ar" && opened.json?.answers === undefined);
const message = await post("/api/builder/configuration-code/resume", { number: `OUAQT. Votre numéro de série : ${serial}. Tapez-le sur le site.` }, pc.token, "10.2.2.2");
check("the WhatsApp message pasted whole opens it too", message.status === 200);

const guesser = await session();
let last;
for (let i = 0; i < 6; i += 1) last = await post("/api/builder/configuration-code/resume", { number: "ZZZZ-ZZZZ" }, guesser.token, "10.3.3.3");
check("an unknown number says unknown", last.json?.error === "unknown" || last.json?.error === "slow_down");
const slowed = await post("/api/builder/configuration-code/resume", { number: serial }, guesser.token, "10.3.3.3");
check("after five wrong entries even the right number must wait", slowed.status === 429 && slowed.json?.wait > 0, JSON.stringify(slowed.json));
const other = await post("/api/builder/configuration-code/resume", { number: serial }, pc.token, "10.2.2.2");
check("someone else is not slowed down by the guesser", other.status === 200);

const shop = await post("/api/builder/configuration-code/shop", { number: serial }, pc.token, "10.2.2.2");
check("the first download makes the shop, with that very number", shop.status === 200 && shop.json?.serial === serial && shop.json?.link?.startsWith("ouaqt://activate?token="), JSON.stringify({ s: shop.status, serial: shop.json?.serial }));
const { data: business } = await admin.from("businesses").select("id, name_latin").eq("owner_id", phone.user.id).single();
check("owned by the phone session that answered, with its answers", business?.name_latin === "Pharmacie Numéro");
const { data: logoRow } = await admin.from("logos").select("colour_path").eq("business_id", business.id).maybeSingle();
check("and carrying the logo", Boolean(logoRow));
const twice = await post("/api/builder/configuration-code/shop", { number: serial }, pc.token, "10.2.2.2");
const { count: after } = await admin.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", phone.user.id);
check("the same number works again, for a reinstall: same shop, a fresh link", twice.json?.serial === serial && twice.json.link !== shop.json.link && after === 1);
const reopened = await post("/api/builder/configuration-code/resume", { number: serial }, pc.token, "10.2.2.2");
check("once the shop exists the number says so", reopened.json?.made === true);

/* The shop computer activates, the way the app does. */
const part = (value) => createHash("sha256").update(`ouaqt-desktop:${value}`).digest("hex");
const stampId = Date.now().toString(36);
const shopPc = await post("/api/licence/activate", { serial, deviceId: `device-${stampId}`, platform: "mac", fingerprint: { board: part(`board-${stampId}`), disk: part(`disk-${stampId}`), machine: part(`os-${stampId}`) } }, null, "10.2.2.2");
check("the shop computer activates with the number", shopPc.status === 200 && shopPc.json?.configuration?.pack === "pharmacy", `${shopPc.status} ${shopPc.json?.error ?? ""}`);
const heldVersion = shopPc.json?.configurationVersion;

/* He finishes the questions again with another trade and another name: the shop follows. */
await admin.from("builder_drafts").update({ pack: "restaurant", answers: answers("Restaurant Numéro", "restaurant", "ar") }).eq("session_owner", phone.user.id);
const shown = await post("/api/builder/configuration-code/resume", { number: serial }, pc.token, "10.2.2.2");
const followed = await post("/api/builder/configuration-code/shop", { number: serial }, pc.token, "10.2.2.2");
const { data: nowShop } = await admin.from("businesses").select("pack, name_latin").eq("id", business.id).single();
const { data: newest } = await admin.from("configurations").select("version, config").eq("business_id", business.id).order("version", { ascending: false }).limit(1).single();
check("finishing again with another trade changes the shop, as a new version of its configuration", shown.json?.pack === "restaurant" && followed.json?.pack === "restaurant" && followed.json?.serial === serial && nowShop.pack === "restaurant" && nowShop.name_latin === "Restaurant Numéro" && newest.config.pack === "restaurant" && newest.version === 2, JSON.stringify({ shop: nowShop, version: newest.version, pack: newest.config.pack }));

/* The app asks what changed, as it does at start and every few hours. */
const asked = await post("/api/licence/refresh", { businessId: business.id, deviceId: `device-${stampId}`, deviceToken: shopPc.json?.deviceToken, configurationVersion: heldVersion }, null, "10.2.2.2");
check("the app asking what changed is handed the new trade", asked.status === 200 && asked.json?.configuration?.pack === "restaurant" && asked.json?.configurationVersion > heldVersion, `${asked.status} ${asked.json?.configuration?.pack}`);
const again2 = await post("/api/licence/refresh", { businessId: business.id, deviceId: `device-${stampId}`, deviceToken: shopPc.json?.deviceToken, configurationVersion: asked.json?.configurationVersion }, null, "10.2.2.2");
check("and nothing more once it holds it", again2.status === 200 && again2.json?.configuration === null);

/* Typed straight into the software before any download: the shop is made then. */
const direct = await session();
await direct.client.from("builder_drafts").insert({ session_owner: direct.user.id, pack: "shop", locale: "fr", step: 2, answers: answers("Boutique Numéro", "shop", "fr") });
const directIssued = await post("/api/builder/configuration-code", { language: "fr" }, direct.token, "10.6.6.6");
const directSerial = directIssued.json?.serial;
const activation = await fetch(`${base}/api/licence/activate`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.6.6.6" }, body: JSON.stringify({ serial: directSerial, deviceId: `test-${direct.user.id}`, platform: "mac" }) });
const activated = await activation.json().catch(() => null);
const { data: directShop } = await admin.from("businesses").select("id").eq("owner_id", direct.user.id).maybeSingle();
check("typed straight into the software, the number makes the shop", Boolean(directShop) && activated?.error !== "unknown_serial", `${activation.status} ${activated?.error ?? "ok"}`);

const resend = await post("/api/builder/configuration-code/resend", { phone: "22 99 88 77" }, pc.token, "10.4.4.4");
const { data: request } = await admin.from("configuration_code_requests").select("phone, sent, handled_at").eq("phone", "22998877").order("created_at", { ascending: false }).limit(1).maybeSingle();
check("a lost number is queued for staff, and never shown", resend.json?.ok === true && !JSON.stringify(resend.json).includes(serial) && request?.sent === false && request.handled_at === null);
const nobody = await post("/api/builder/configuration-code/resend", { phone: "22 00 00 01" }, pc.token, "10.4.4.4");
check("an unknown phone gets the same answer", nobody.json?.ok === true);

/* An unused number, thirty days unopened. */
const idle = await session();
await idle.client.from("builder_drafts").insert({ session_owner: idle.user.id, pack: "pharmacy", locale: "fr", step: 2, answers: answers("Pharmacie Oubliée", "pharmacy", "fr") });
const idleSerial = (await post("/api/builder/configuration-code", { language: "fr" }, idle.token, "10.7.7.7")).json?.serial;
await admin.from("builder_drafts").update({ last_accessed_at: new Date(Date.now() - 31 * 86400e3).toISOString() }).eq("session_owner", idle.user.id);
const expired = await post("/api/builder/configuration-code/resume", { number: idleSerial }, pc.token, "10.2.2.2");
const { data: marked } = await admin.from("builder_drafts").select("status").eq("session_owner", idle.user.id).single();
check("thirty days unopened, an unused number says expired, and the row is kept, marked", expired.status === 410 && marked.status === "expired");
const oldShop = await post("/api/builder/configuration-code/resume", { number: serial }, pc.token, "10.2.2.2");
check("a shop's number never expires", oldShop.status === 200);

/*
 * Staff answering on a phone in test mode: the computer has no test-mode
 * cookie, and its shop still gets the test-mode trial. Only where the admin
 * area is open for testing, since that is where the cookie can be had.
 */
const staffPhone = await session();
const opening = await fetch(`${base}/api/admin/test-builder`, { redirect: "manual" });
const testerCookie = (opening.headers.get("set-cookie") ?? "").split(";")[0];
if (!testerCookie.includes("=")) {
  console.log("  skip  test mode on the phone: the admin area is closed here");
} else {
  await staffPhone.client.from("builder_drafts").insert({ session_owner: staffPhone.user.id, pack: "restaurant", locale: "fr", step: 2, answers: answers("Essai Mode Test", "restaurant", "fr") });
  const staffSerial = (await post("/api/builder/configuration-code", { language: "fr" }, staffPhone.token, "10.5.5.5", testerCookie)).json?.serial;
  const made = await post("/api/builder/configuration-code/shop", { number: staffSerial }, pc.token, "10.5.5.5");
  const { data: shopRow } = await admin.from("businesses").select("id").eq("owner_id", staffPhone.user.id).single();
  const { data: override } = await admin.from("trial_overrides").select("business_id").eq("business_id", shopRow?.id).maybeSingle();
  check("a phone in test mode gives the computer's shop the test-mode trial", made.status === 200 && Boolean(override));
}

/* Tidy the test's own rows: deleting the sessions removes their drafts, and their shops go by owner. */
await admin.from("configuration_code_requests").delete().eq("phone", "22998877");
const people = [phone, pc, guesser, direct, idle, staffPhone];
for (const one of people) await admin.from("businesses").delete().eq("owner_id", one.user.id);
for (const one of people) await admin.from("builder_drafts").delete().eq("session_owner", one.user.id);
for (const one of people) await admin.auth.admin.deleteUser(one.user.id);
/* The test's own wrong entries only: its sessions are gone, so their counts go too. */
await admin.from("configuration_code_attempts").delete().lt("last_failure_at", new Date(Date.now() + 60_000).toISOString()).gt("last_failure_at", new Date(Date.now() - 600_000).toISOString());
console.log(failures === 0 ? "\nThe one number holds up.\n" : `\n${failures} checks failed.\n`);
process.exit(failures ? 1 : 0);
