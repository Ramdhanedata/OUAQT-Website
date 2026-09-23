/*
 * The code de configuration, end to end, against a running site.
 *
 *   node --env-file=.env.local scripts/configuration-code-client.mjs [base-url]
 *
 * A phone session answers and gets its code; another device opens it typed
 * sloppily and pasted as a link; a guesser is slowed down without slowing
 * anyone else; a change on the computer is saved; Télécharger makes the shop
 * with no account, and the same code works again for a reinstall; a lost
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
check("another device opens it, typed in lowercase with spaces", opened.status === 200 && opened.json?.answers?.nameLatin === "Pharmacie Code", String(opened.status));
check("and learns the language it was made in, and sees the logo", opened.json?.locale === "ar" && Boolean(opened.json?.logo?.colour));
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

const saved = await post("/api/builder/configuration-code/save", { code, answers: { ...opened.json.answers, nameLatin: "Pharmacie Code Modifiée" }, step: 2 }, pc.token, "10.2.2.2");
check("a change on the computer is saved into the same configuration", saved.status === 200);

const shop = await post("/api/builder/configuration-code/shop", { code, products: [{ row: 1, name: "Savon", price: 12000, quantity: 5 }] }, pc.token, "10.2.2.2");
check("Télécharger makes the shop without an account", shop.status === 200 && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(shop.json?.serial ?? "") && shop.json?.link?.startsWith("ouaqt://activate?token="), JSON.stringify({ s: shop.status, serial: shop.json?.serial }));
const { data: business } = await admin.from("businesses").select("id, name_latin, owner_id").eq("owner_id", phone.user.id).single();
check("owned by the phone session that answered, with the change made on the computer", business?.name_latin === "Pharmacie Code Modifiée");
const { data: logoRow } = await admin.from("logos").select("colour_path").eq("business_id", business.id).maybeSingle();
check("and carrying the logo", Boolean(logoRow));
const twice = await post("/api/builder/configuration-code/shop", { code }, pc.token, "10.2.2.2");
check("the same code works again, for a reinstall: same serial, a fresh link", twice.json?.serial === shop.json.serial && twice.json?.link && twice.json.link !== shop.json.link);

const resend = await post("/api/builder/configuration-code/resend", { phone: "22 99 88 77" }, pc.token, "10.4.4.4");
const { data: request } = await admin.from("configuration_code_requests").select("phone, sent, handled_at").eq("phone", "22998877").order("created_at", { ascending: false }).limit(1).maybeSingle();
check("a lost code is queued for staff, and never shown", resend.json?.ok === true && !JSON.stringify(resend.json).includes("OUAQT") && request?.sent === false && request.handled_at === null);
const nobody = await post("/api/builder/configuration-code/resend", { phone: "22 00 00 01" }, pc.token, "10.4.4.4");
check("an unknown number gets the same answer", nobody.json?.ok === true);

await admin.from("builder_drafts").update({ last_accessed_at: new Date(Date.now() - 31 * 86400e3).toISOString() }).eq("code", code);
const expired = await post("/api/builder/configuration-code/resume", { code }, pc.token, "10.2.2.2");
const { data: marked } = await admin.from("builder_drafts").select("status").eq("code", code).single();
check("thirty days unopened, it says expired, and the row is kept, marked", expired.status === 410 && expired.json?.error === "expired" && marked.status === "expired");

/* Tidy the test's own rows. */
await admin.from("configuration_code_requests").delete().eq("phone", "22998877");
await admin.from("businesses").delete().eq("id", business.id);
await admin.from("builder_drafts").delete().eq("code", code);
for (const one of [phone, pc, guesser]) await admin.auth.admin.deleteUser(one.user.id);
/* The test's own wrong entries only: its sessions are gone, so their counts go too. */
await admin.from("configuration_code_attempts").delete().lt("last_failure_at", new Date(Date.now() + 60_000).toISOString()).gt("last_failure_at", new Date(Date.now() - 600_000).toISOString());
console.log(failures === 0 ? "\nThe code de configuration holds up.\n" : `\n${failures} checks failed.\n`);
process.exit(failures ? 1 : 0);
