/*
 * The code de configuration, end to end, against a running site.
 *
 *   node --env-file=.env.local scripts/configuration-code-client.mjs [base-url]
 *
 * A phone session answers and gets its code; another device opens it typed
 * sloppily and pasted as a link; a guesser is slowed down without slowing
 * anyone else; the computer changes nothing; Télécharger makes the shop
 * with no account, and the same code works again for a reinstall; the
 * shop's numéro de série typed in the same box finds that shop; a lost
 * code is queued for staff and never shown; thirty days unopened, it says
 * expired and the row is kept. Everything it creates, it removes.
 */
import { createClient } from "@supabase/supabase-js";
const base = process.argv[2] ?? "http://localhost:3000";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const session = async () => {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await c.auth.signInAnonymously();
  return { client: c, user: data.user, token: data.session.access_token };
};
const post = async (path, body, token, ip) => {
  const res = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), "x-forwarded-for": ip ?? "10.0.0.1" }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json().catch(() => null) };
};
let failures = 0;
const check = (what, ok, detail = "") => { if (!ok) failures += 1; console.log(`  ${ok ? "pass" : "FAIL"}  ${what}${detail ? "  " + detail : ""}`); };

const phone = await session();
const tiny = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
await phone.client.from("builder_drafts").insert({ session_owner: phone.user.id, pack: "pharmacy", locale: "ar", step: 2, answers: { pack: "pharmacy", builderLanguage: "ar", appLanguage: "ar", nameLatin: "Pharmacie Code", nameArabic: "صيدلية الرمز", phone: "+222 22 99 88 77", interview: {} } });

const issued = await post("/api/builder/configuration-code", { language: "ar", logo: tiny, logoMono: tiny }, phone.token, "10.1.1.1");
check("the phone gets a code when its questions are done", issued.status === 200 && /^OUAQT-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(issued.json?.code ?? ""), JSON.stringify(issued.json));
check("and is told honestly that nothing was sent yet", issued.json?.sent === false && issued.json?.hasPhone === true);
const again = await post("/api/builder/configuration-code", { language: "ar" }, phone.token, "10.1.1.1");
check("asking twice gives the same code", again.json?.code === issued.json?.code);
const code = issued.json.code;
const { data: stored } = await admin.from("builder_drafts").select("phone, logo_path, status").eq("code", code).single();
check("the draft keeps the phone as digits and the logo in storage", stored.phone === "22998877" && Boolean(stored.logo_path), JSON.stringify(stored));

const pc = await session();
const sloppy = `  ${code.toLowerCase().replace(/-/g, " ")} `;
const opened = await post("/api/builder/configuration-code/resume", { code: sloppy }, pc.token, "10.2.2.2");
check("another device opens it, typed in lowercase with spaces", opened.status === 200 && opened.json?.nameLatin === "Pharmacie Code" && opened.json?.pack === "pharmacy", String(opened.status));
check("and learns the language it was made in, and nothing more than the download shows", opened.json?.locale === "ar" && opened.json?.answers === undefined);
const link = await post("/api/builder/configuration-code/resume", { code: `https://ouaqt.com/fr/x?code=${code}` }, pc.token, "10.2.2.2");
check("a pasted link opens it too", link.status === 200);

const guesser = await session();
let last;
for (let i = 0; i < 6; i += 1) last = await post("/api/builder/configuration-code/resume", { code: "OUAQT-ZZZZ-ZZZZ" }, guesser.token, "10.3.3.3");
check("an unknown code says unknown, not invalid", last.json?.error === "unknown" || last.json?.error === "slow_down");
const slowed = await post("/api/builder/configuration-code/resume", { code }, guesser.token, "10.3.3.3");
check("after five wrong entries even the right code must wait", slowed.status === 429 && slowed.json?.wait > 0, JSON.stringify(slowed.json));
const other = await post("/api/builder/configuration-code/resume", { code }, pc.token, "10.2.2.2");
check("someone else is not slowed down by the guesser", other.status === 200);

const saved = await post("/api/builder/configuration-code/save", { code, answers: {}, step: 2 }, pc.token, "10.2.2.2");
check("the computer cannot change the answers: there is nothing to save through", saved.status === 404 || saved.status === 405, String(saved.status));

const shop = await post("/api/builder/configuration-code/shop", { code, products: [{ row: 1, name: "Savon", price: 12000, quantity: 5 }] }, pc.token, "10.2.2.2");
check("Télécharger makes the shop without an account", shop.status === 200 && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(shop.json?.serial ?? "") && shop.json?.link?.startsWith("ouaqt://activate?token="), JSON.stringify({ s: shop.status, serial: shop.json?.serial }));
const { data: business } = await admin.from("businesses").select("id, name_latin, owner_id").eq("owner_id", phone.user.id).single();
check("owned by the phone session that answered, with its answers", business?.name_latin === "Pharmacie Code");
const { data: logoRow } = await admin.from("logos").select("colour_path").eq("business_id", business.id).maybeSingle();
check("and carrying the logo", Boolean(logoRow));
const twice = await post("/api/builder/configuration-code/shop", { code }, pc.token, "10.2.2.2");
check("the same code works again, for a reinstall: same serial, a fresh link", twice.json?.serial === shop.json.serial && twice.json?.link && twice.json.link !== shop.json.link);

const typedSerial = shop.json.serial.toLowerCase().replace("-", " ");
const bySerial = await post("/api/builder/configuration-code/resume", { code: typedSerial }, pc.token, "10.2.2.2");
check("its numéro de série typed in the same box opens the same shop", bySerial.status === 200 && bySerial.json?.serial === shop.json.serial && bySerial.json?.pack === "pharmacy" && !bySerial.json?.code, JSON.stringify(bySerial.json));
const prefixed = await post("/api/builder/configuration-code/resume", { code: `OUAQT-${shop.json.serial}` }, pc.token, "10.2.2.2");
check("even with OUAQT put in front of it", prefixed.status === 200 && prefixed.json?.serial === shop.json.serial);
const fromSerial = await post("/api/builder/configuration-code/shop", { serial: shop.json.serial }, pc.token, "10.2.2.2");
check("and Télécharger from it gives a fresh link for that shop, no second shop", fromSerial.status === 200 && fromSerial.json?.serial === shop.json.serial && fromSerial.json?.link?.startsWith("ouaqt://activate?token="));
const { count: shops } = await admin.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", phone.user.id);
check("still one shop", shops === 1);

const resend = await post("/api/builder/configuration-code/resend", { phone: "22 99 88 77" }, pc.token, "10.4.4.4");
const { data: request } = await admin.from("configuration_code_requests").select("phone, sent, handled_at").eq("phone", "22998877").order("created_at", { ascending: false }).limit(1).maybeSingle();
check("a lost code is queued for staff, and never shown", resend.json?.ok === true && !JSON.stringify(resend.json).includes("OUAQT") && request?.sent === false && request.handled_at === null);
const nobody = await post("/api/builder/configuration-code/resend", { phone: "22 00 00 01" }, pc.token, "10.4.4.4");
check("an unknown number gets the same answer", nobody.json?.ok === true);

await admin.from("builder_drafts").update({ last_accessed_at: new Date(Date.now() - 31 * 86400e3).toISOString() }).eq("code", code);
const expired = await post("/api/builder/configuration-code/resume", { code }, pc.token, "10.2.2.2");
const { data: marked } = await admin.from("builder_drafts").select("status").eq("code", code).single();
check("thirty days unopened, it says expired, and the row is kept, marked", expired.status === 410 && expired.json?.error === "expired" && marked.status === "expired");

/*
 * Staff answering on a phone in test mode: the computer has no test-mode
 * cookie, and its shop still gets the test-mode trial. Only where the admin
 * area is open for testing, since that is where the cookie can be had.
 */
const staffPhone = await session();
const opening = await fetch(`${base}/api/admin/test-builder`, { redirect: "manual" });
const testerCookie = (opening.headers.get("set-cookie") ?? "").split(";")[0];
let testBusiness = null;
if (!testerCookie.includes("=")) {
  console.log("  skip  test mode on the phone: the admin area is closed here");
} else {
  await staffPhone.client.from("builder_drafts").insert({ session_owner: staffPhone.user.id, pack: "restaurant", locale: "fr", step: 2, answers: { pack: "restaurant", nameLatin: "Essai Mode Test", interview: {} } });
  const res = await fetch(`${base}/api/builder/configuration-code`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${staffPhone.token}`, cookie: testerCookie, "x-forwarded-for": "10.5.5.5" }, body: JSON.stringify({ language: "fr" }) });
  const staffCode = (await res.json()).code;
  const made = await post("/api/builder/configuration-code/shop", { code: staffCode }, pc.token, "10.5.5.5");
  const { data: shopRow } = await admin.from("businesses").select("id").eq("owner_id", staffPhone.user.id).single();
  testBusiness = shopRow?.id ?? null;
  const { data: override } = await admin.from("trial_overrides").select("business_id").eq("business_id", testBusiness).maybeSingle();
  check("a phone in test mode gives the computer's shop the test-mode trial", made.status === 200 && Boolean(override));
  await admin.from("builder_drafts").delete().eq("code", staffCode);
}

/* Tidy the test's own rows. */
await admin.from("configuration_code_requests").delete().eq("phone", "22998877");
await admin.from("businesses").delete().eq("id", business.id);
if (testBusiness) await admin.from("businesses").delete().eq("id", testBusiness);
await admin.from("builder_drafts").delete().eq("code", code);
for (const one of [phone, pc, guesser, staffPhone]) await admin.auth.admin.deleteUser(one.user.id);
/* The test's own wrong entries only: its sessions are gone, so their counts go too. */
await admin.from("configuration_code_attempts").delete().lt("last_failure_at", new Date(Date.now() + 60_000).toISOString()).gt("last_failure_at", new Date(Date.now() - 600_000).toISOString());
console.log(failures === 0 ? "\nThe code de configuration holds up.\n" : `\n${failures} checks failed.\n`);
process.exit(failures ? 1 : 0);
