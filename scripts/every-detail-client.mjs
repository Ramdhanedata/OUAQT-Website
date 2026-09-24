/*
 * Every detail the owner gives the builder, carried to the shop the app
 * reads, then changed on the website and carried again. Run against a
 * running site, in three steps, with the app activated in between:
 *
 *   node --env-file=.env.local scripts/every-detail-client.mjs make   <state.json> [base-url]
 *   node --env-file=.env.local scripts/every-detail-client.mjs change <state.json> [base-url]
 *   node --env-file=.env.local scripts/every-detail-client.mjs clean  <state.json>
 *
 * "make" answers on a phone session with a name in both scripts, a phone
 * number, an address, two staff and a logo, issues the numéro de série, and
 * makes the shop from the computer with a product list whose rows carry a
 * location and a way of selling. It checks what the activation hands over.
 * "change" renames the shop, adds a member of staff and sends another logo,
 * and checks the app's refresh is handed all three. "clean" removes it all.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { createClient } from "@supabase/supabase-js";

const [, , step, stateFile, baseArg] = process.argv;
const base = baseArg ?? "http://localhost:3000";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let failures = 0;
const check = (what, ok, detail = "") => {
  if (!ok) failures += 1;
  console.log(`  ${ok ? "pass" : "FAIL"}  ${what}${detail ? "  " + detail : ""}`);
};
const post = async (path, body, token, ip = "10.9.9.9") => {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const session = async () => {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await c.auth.signInAnonymously();
  return { client: c, user: data.user, token: data.session.access_token };
};

/* A small PNG of one colour, so two logos can be told apart by their bytes. */
function png(width, height, [r, g, b]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buffer) => {
    let c = 0xffffffff;
    for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) rows.set([r, g, b], y * (width * 3 + 1) + 1 + x * 3);
  }
  const bytes = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}
const fingerprint = (url) => createHash("sha256").update(Buffer.from(url.split(",")[1], "base64")).digest("hex");
const fetched = async (url) => createHash("sha256").update(Buffer.from(await (await fetch(url)).arrayBuffer())).digest("hex");

const LOGO_A = png(120, 60, [30, 90, 200]);
const LOGO_A_MONO = png(120, 60, [0, 0, 0]);
const LOGO_B = png(120, 60, [200, 60, 30]);
const LOGO_B_MONO = png(120, 60, [40, 40, 40]);

const answers = (nameLatin, staff) => ({
  pack: "pharmacy",
  builderLanguage: "fr",
  appLanguage: "fr",
  nameLatin,
  nameArabic: "صيدلية التفاصيل",
  phone: "+222 45 67 89 01",
  address: "Tevragh Zeina, Nouakchott",
  interview: {},
  staff,
});

if (step === "make") {
  const phone = await session();
  await phone.client.from("builder_drafts").insert({
    session_owner: phone.user.id,
    pack: "pharmacy",
    locale: "fr",
    step: 2,
    answers: answers("Pharmacie Détails", [
      { name: "Aïcha Diallo", role: "manager" },
      { name: "Moussa Ba", role: "cashier" },
    ]),
  });
  const issued = await post("/api/builder/configuration-code", { language: "fr", logo: LOGO_A, logoMono: LOGO_A_MONO }, phone.token);
  const serial = issued.json?.serial ?? "";
  check("the number is issued with the logo", issued.status === 200 && Boolean(serial), JSON.stringify(issued.json));

  const pc = await session();
  const products = [
    { row: 2, name: "Doliprane 1000", price: 15000, quantity: 20, batch: "D10", expiry: "2027-06-30", location: "Rayon A", soldBy: "Boîte" },
    { row: 3, name: "Smecta", price: 25000, quantity: 8, quantityUnit: "sachets", location: "Rayon B", soldBy: "Sachet" },
  ];
  const shop = await post("/api/builder/configuration-code/shop", { number: serial, products }, pc.token);
  check("the computer makes the shop with its product list", shop.status === 200 && shop.json?.serial === serial, JSON.stringify({ status: shop.status, error: shop.json?.error }));

  const { data: business } = await admin.from("businesses").select("id, name_latin, name_arabic, receipt_phone, receipt_address").eq("owner_id", phone.user.id).single();
  check("the shop carries both names, the phone and the address", business.name_latin === "Pharmacie Détails" && business.name_arabic === "صيدلية التفاصيل" && business.receipt_address === "Tevragh Zeina, Nouakchott" && Boolean(business.receipt_phone));

  const part = (value) => createHash("sha256").update(`ouaqt-desktop:${value}`).digest("hex");
  const stamp = Date.now().toString(36);
  const activated = await post("/api/licence/activate", { serial, deviceId: `probe-${stamp}`, platform: "mac", fingerprint: { board: part(`b-${stamp}`), disk: part(`d-${stamp}`), machine: part(`m-${stamp}`) } });
  const config = activated.json?.configuration;
  check("activation hands over both names, the phone and the address", config?.business?.nameLatin === "Pharmacie Détails" && config.business.nameArabic === "صيدلية التفاصيل" && config.business.phone && config.business.address === "Tevragh Zeina, Nouakchott", JSON.stringify(config?.business));
  check("the receipt is set to print the logo, the phone and the address", config?.receipt?.showLogo === true && config.receipt.showPhone === true && config.receipt.showAddress === true);
  const logo = activated.json?.logo;
  check("and the logo, the one he chose, in colour and for the printer", Boolean(logo) && (await fetched(logo.colour)) === fingerprint(LOGO_A) && (await fetched(logo.mono)) === fingerprint(LOGO_A_MONO));
  check("and both members of staff", (activated.json?.staff ?? []).length === 2);
  const handed = activated.json?.products ?? [];
  check("and the products with where they sit and how they are sold", handed.length === 2 && handed.every((one) => one.location && one.soldBy), JSON.stringify(handed.map((one) => [one.name, one.location, one.soldBy])));
  check("and the word written beside a quantity", handed.some((one) => one.quantityUnit === "sachets"));

  /* The probe's own device goes, so the real app can take the shop's one place. */
  await admin.from("devices").delete().eq("business_id", business.id);

  /* The phone's session is kept for "change", in a file of the test's own; it is never printed. */
  writeFileSync(stateFile, JSON.stringify({ serial, phone: { id: phone.user.id, token: phone.token }, pc: { id: pc.user.id }, businessId: business.id, probe: { deviceId: `probe-${stamp}`, token: activated.json?.deviceToken, version: activated.json?.configurationVersion } }, null, 2));
  console.log(`\nSERIAL ${serial}`);
}

if (step === "change") {
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  /* He edits his answers on the website: a new name and a third member of staff. */
  await admin
    .from("builder_drafts")
    .update({
      answers: answers("Pharmacie Détails Nouvelle", [
        { name: "Aïcha Diallo", role: "manager" },
        { name: "Moussa Ba", role: "cashier" },
        { name: "Khadija Sy", role: "cashier" },
      ]),
    })
    .eq("session_owner", state.phone.id);
  /* And finishes again on the same phone with another logo: the route keeps it and the shop follows. */
  const again1 = await post("/api/builder/configuration-code", { language: "fr", logo: LOGO_B, logoMono: LOGO_B_MONO }, state.phone.token);
  check("finishing again gives the same number", again1.status === 200 && again1.json?.serial === state.serial, JSON.stringify(again1.json));

  /* The shop follows at once: a new version, the new name, the new logo, the third member of staff. */
  const { data: newest } = await admin.from("configurations").select("version, config, created_by").eq("business_id", state.businessId).order("version", { ascending: false }).limit(1).single();
  check("the shop's configuration takes the new name, as a new version", newest.config.business.nameLatin === "Pharmacie Détails Nouvelle" && newest.version > state.probe.version, JSON.stringify({ version: newest.version, by: newest.created_by }));
  const { data: logoRow } = await admin.from("logos").select("colour_path, mono_path").eq("business_id", state.businessId).single();
  const colourBytes = await admin.storage.from("logos").download(logoRow.colour_path);
  const hash = createHash("sha256").update(Buffer.from(await colourBytes.data.arrayBuffer())).digest("hex");
  check("its logo is the new one", hash === fingerprint(LOGO_B), logoRow.colour_path.split("/").pop());
  const { data: staff } = await admin.from("staff_initial").select("name").eq("business_id", state.businessId);
  check("and its staff has the third name", (staff ?? []).some((person) => person.name === "Khadija Sy") && staff.length === 3);
  const { data: files } = await admin.storage.from("logos").list(state.phone.id);
  check("the logo it replaced is not kept", (files ?? []).length === 2, (files ?? []).map((file) => file.name).join(", "));
}

if (step === "fingerprints") {
  console.log(JSON.stringify({ A: fingerprint(LOGO_A), AMono: fingerprint(LOGO_A_MONO), B: fingerprint(LOGO_B), BMono: fingerprint(LOGO_B_MONO) }));
}

if (step === "clean") {
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  const { data: files } = await admin.storage.from("logos").list(state.phone.id);
  if (files?.length) await admin.storage.from("logos").remove(files.map((file) => `${state.phone.id}/${file.name}`));
  for (const id of [state.phone.id, state.pc.id]) {
    await admin.from("businesses").delete().eq("owner_id", id);
    await admin.from("builder_drafts").delete().eq("session_owner", id);
    await admin.auth.admin.deleteUser(id);
  }
  console.log("  cleaned");
}

console.log(failures === 0 ? "\nEvery detail holds up.\n" : `\n${failures} checks failed.\n`);
process.exit(failures ? 1 : 0);
