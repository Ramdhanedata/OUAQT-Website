import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { configurationFrom, createShop, shopInput, type ImportedRow } from "@/builder/licence/create-shop";
import { decryptSerial, encryptSerial } from "@/builder/serial/cipher";
import { hashSerial, makeUniqueSerial } from "@/builder/serial/serial";
import { isExpired, readNumber, waitAfter } from "./code";

/*
 * The server's side of the owner's one number, his numéro de série: giving
 * it when the questions end, finding what it stands for, making the shop the
 * first time it is used, counting wrong entries, and putting the logo where
 * the shop will find it.
 *
 * Everything here runs with the service role, because the draft belongs to
 * the phone's session and the computer asking is a different one. What makes
 * that safe is the number itself: eight characters from thirty-one is about
 * eight hundred and fifty billion possibilities, and wrong entries slow down
 * after five.
 */

export type Draft = {
  id: string;
  session_owner: string;
  business_id: string | null;
  pack: string | null;
  locale: string;
  step: number;
  answers: Record<string, unknown>;
  serial_hash: string | null;
  serial_cipher: string | null;
  phone: string | null;
  created_at: string;
  last_accessed_at: string | null;
  status: "active" | "expired";
  logo_path: string | null;
  logo_mono_path: string | null;
  made_in_test_mode: boolean;
};

const COLUMNS =
  "id, session_owner, business_id, pack, locale, step, answers, serial_hash, serial_cipher, phone, created_at, last_accessed_at, status, logo_path, logo_mono_path, made_in_test_mode";

type Answers = Record<string, unknown> & {
  pack?: string;
  appLanguage?: string;
  builderLanguage?: string;
  nameLatin?: string;
  nameArabic?: string;
  phone?: string;
  address?: string;
  interview?: Record<string, unknown>;
  patched?: { common?: unknown; features?: unknown };
  staff?: { name: string; role: "manager" | "cashier" }[];
};

/* Whether a serial already belongs to a shop or is reserved on a draft. */
async function taken(admin: SupabaseClient, serial: string): Promise<boolean> {
  const hash = await hashSerial(serial);
  const [{ data: shop }, { data: draft }] = await Promise.all([
    admin.from("serials").select("business_id").eq("serial_hash", hash).maybeSingle(),
    admin.from("builder_drafts").select("id").eq("serial_hash", hash).maybeSingle(),
  ]);
  return Boolean(shop || draft);
}

/*
 * The number for a draft: given once, when its questions end, and the same
 * every time after. A session that already has a shop (an owner who started
 * the questions again) gets that shop's number, the one its software knows.
 */
export async function numberFor(
  admin: SupabaseClient,
  draft: { id: string; session_owner: string; serial_cipher: string | null }
): Promise<string | null> {
  if (draft.serial_cipher) {
    const kept = await decryptSerial(draft.serial_cipher);
    if (kept) return kept;
  }

  const { data: business } = await admin.from("businesses").select("id").eq("owner_id", draft.session_owner).limit(1).maybeSingle();
  let serial: string | null = null;
  if (business) {
    const { data: row } = await admin.from("serials").select("serial_cipher").eq("business_id", business.id).maybeSingle();
    serial = row?.serial_cipher ? await decryptSerial(row.serial_cipher) : null;
  }
  serial ??= await makeUniqueSerial((candidate) => taken(admin, candidate));
  const hash = await hashSerial(serial);

  /* An older draft of the same shop lets go of the number: the newest one holds it. */
  if (business) {
    await admin.from("builder_drafts").update({ serial_hash: null, serial_cipher: null }).eq("serial_hash", hash).neq("id", draft.id);
  }
  await admin
    .from("builder_drafts")
    .update({
      serial_hash: hash,
      serial_cipher: await encryptSerial(serial),
      last_accessed_at: new Date().toISOString(),
      status: "active",
      ...(business ? { business_id: business.id } : {}),
    })
    .eq("id", draft.id)
    .is("serial_hash", null);

  /* Read back: a second tap may have got there first, and its number is the one. */
  const { data: again } = await admin.from("builder_drafts").select("serial_cipher").eq("id", draft.id).single();
  return again?.serial_cipher ? decryptSerial(again.serial_cipher) : null;
}

export type Found =
  | { kind: "shop"; businessId: string; serial: string; pack: string; nameLatin: string; nameArabic: string; draft: Draft | null }
  | { kind: "draft"; serial: string; draft: Draft }
  | { kind: "expired"; draft: Draft }
  | { kind: "unknown" };

/*
 * What a number stands for: a shop already made, or a configuration whose
 * shop is made the first time the number is used. A configuration not
 * opened for thirty days is marked expired; the row stays, so staff can
 * revive it for someone who calls. A shop's number never expires.
 */
export async function openByNumber(admin: SupabaseClient, input: string, now = new Date()): Promise<Found> {
  const serial = readNumber(input);
  if (!serial) return { kind: "unknown" };
  const hash = await hashSerial(serial);

  const { data: row } = await admin.from("serials").select("business_id").eq("serial_hash", hash).maybeSingle();
  if (row) {
    const { data: business } = await admin
      .from("businesses")
      .select("id, pack, name_latin, name_arabic")
      .eq("id", row.business_id)
      .maybeSingle();
    if (business) {
      const { data: draft } = await admin
        .from("builder_drafts")
        .select(COLUMNS)
        .eq("business_id", business.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return {
        kind: "shop",
        businessId: business.id,
        serial,
        pack: business.pack,
        nameLatin: business.name_latin ?? "",
        nameArabic: business.name_arabic ?? "",
        draft: (draft as Draft | null) ?? null,
      };
    }
  }

  const { data } = await admin.from("builder_drafts").select(COLUMNS).eq("serial_hash", hash).maybeSingle();
  if (!data) return { kind: "unknown" };
  const draft = data as Draft;
  if (draft.status === "expired" || isExpired(draft.last_accessed_at, draft.created_at, now)) {
    if (draft.status !== "expired") await admin.from("builder_drafts").update({ status: "expired" }).eq("id", draft.id);
    return { kind: "expired", draft: { ...draft, status: "expired" } };
  }
  const touched = now.toISOString();
  await admin.from("builder_drafts").update({ last_accessed_at: touched }).eq("id", draft.id);
  return { kind: "draft", serial, draft: { ...draft, last_accessed_at: touched } };
}

/** What the download screen shows for a number: the trade and the name. */
export function describe(found: Extract<Found, { kind: "shop" | "draft" }>) {
  if (found.kind === "shop") {
    return { serial: found.serial, pack: found.pack, nameLatin: found.nameLatin, nameArabic: found.nameArabic, locale: found.draft?.locale ?? null, made: true };
  }
  const answers = found.draft.answers as Answers;
  return {
    serial: found.serial,
    pack: answers.pack ?? found.draft.pack,
    nameLatin: answers.nameLatin ?? "",
    nameArabic: answers.nameArabic ?? "",
    locale: found.draft.locale,
    made: false,
  };
}

function shapeOf(draft: Draft, products: ImportedRow[]) {
  const answers = draft.answers as Answers;
  return shopInput.safeParse({
    pack: answers.pack,
    language: answers.appLanguage ?? answers.builderLanguage ?? draft.locale,
    business: {
      nameLatin: answers.nameLatin ?? "",
      nameArabic: answers.nameArabic || undefined,
      phone: answers.phone || undefined,
      address: answers.address || undefined,
    },
    answers: answers.interview ?? {},
    patched: answers.patched,
    staff: answers.staff ?? [],
    products,
  });
}

export type Shop = { ok: true; businessId: string; serial: string; pack: string } | { ok: false; error: string; status: number };

/*
 * The shop a number stands for, made now if this is its first use, from the
 * computer's download page or from the software itself. Answers changed on
 * the phone since the shop was made become a new version of its
 * configuration, never an edit of the one a running shop uses.
 */
export async function shopFor(
  admin: SupabaseClient,
  found: Extract<Found, { kind: "shop" | "draft" }>,
  options: { tester: boolean; products?: ImportedRow[] }
): Promise<Shop> {
  if (found.kind === "shop") {
    const draft = found.draft;
    if (draft) {
      const shaped = shapeOf(draft, []);
      const configuration = shaped.success ? configurationFrom(shaped.data) : null;
      const { data: latest } = await admin
        .from("configurations")
        .select("version, config")
        .eq("business_id", found.businessId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (configuration?.success && latest && JSON.stringify(latest.config) !== JSON.stringify(configuration.data)) {
        await admin.from("configurations").insert({
          business_id: found.businessId,
          version: latest.version + 1,
          schema_version: String(configuration.data.version),
          config: configuration.data,
          created_by: "phone_answers",
        });
      }
    }
    return { ok: true, businessId: found.businessId, serial: found.serial, pack: found.pack };
  }

  const draft = found.draft;
  const shaped = shapeOf(draft, options.products ?? []);
  if (!shaped.success) return { ok: false, error: "incomplete", status: 400 };
  const made = await createShop(admin, draft.session_owner, shaped.data, {
    /* In test mode on the phone that answered, or where this runs. */
    tester: draft.made_in_test_mode || options.tester,
    logo: draft.logo_path && draft.logo_mono_path ? { colourPath: draft.logo_path, monoPath: draft.logo_mono_path } : null,
    serial: found.serial,
  });
  if (!made.ok) return { ok: false, error: made.error, status: made.status };
  await admin.from("builder_drafts").update({ business_id: made.businessId }).eq("id", draft.id);
  return { ok: true, businessId: made.businessId, serial: made.serial, pack: shaped.data.pack };
}

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/*
 * Who is trying, as hashes: the browser's session and the address the
 * request came from. Either one reaching five wrong entries slows both down,
 * so opening a new private window does not reset the count.
 */
export async function attemptKeys(request: Request, sessionId: string | null, purpose: string): Promise<string[]> {
  const address = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  const keys: string[] = [];
  if (sessionId) keys.push(await sha256(`${purpose}:session:${sessionId}`));
  if (address) keys.push(await sha256(`${purpose}:address:${address}`));
  return keys;
}

/** Seconds still to wait before another try, or 0. */
export async function waitingFor(admin: SupabaseClient, keys: string[], now = new Date()): Promise<number> {
  if (keys.length === 0) return 0;
  const { data } = await admin.from("configuration_code_attempts").select("locked_until").in("key", keys);
  const latest = Math.max(0, ...(data ?? []).map((row) => (row.locked_until ? new Date(row.locked_until).getTime() : 0)));
  return Math.max(0, Math.ceil((latest - now.getTime()) / 1000));
}

export async function recordFailure(admin: SupabaseClient, keys: string[], now = new Date()): Promise<number> {
  let longest = 0;
  for (const key of keys) {
    const { data } = await admin.from("configuration_code_attempts").select("failures").eq("key", key).maybeSingle();
    const failures = (data?.failures ?? 0) + 1;
    const wait = waitAfter(failures);
    longest = Math.max(longest, wait);
    await admin.from("configuration_code_attempts").upsert({
      key,
      failures,
      last_failure_at: now.toISOString(),
      locked_until: wait > 0 ? new Date(now.getTime() + wait * 1000).toISOString() : null,
    });
  }
  return longest;
}

export async function clearFailures(admin: SupabaseClient, keys: string[]): Promise<void> {
  if (keys.length > 0) await admin.from("configuration_code_attempts").delete().in("key", keys);
}

const DATA_URL = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/;
const LOGO_BYTES = 1_000_000; // not-a-rule: the logos bucket's own ceiling, see 0005

/*
 * The logo, moved from the phone to the logos bucket once, when the code is
 * issued: the computer that opens the code needs to show it, and the shop
 * made from it needs it on its receipt. Kept in the phone session's own
 * folder, which is the folder the shop's owner reads from.
 */
export async function keepLogo(
  admin: SupabaseClient,
  owner: string,
  draftId: string,
  colour: string | undefined,
  mono: string | undefined
): Promise<{ colourPath: string; monoPath: string } | null> {
  const parse = (value: string | undefined) => {
    const match = value?.match(DATA_URL);
    if (!match) return null;
    const bytes = Buffer.from(match[2], "base64");
    return bytes.length > 0 && bytes.length <= LOGO_BYTES ? { type: match[1], bytes } : null;
  };
  const one = parse(colour);
  const two = parse(mono);
  if (!one || !two) return null;
  const extension = (type: string) => (type === "image/png" ? "png" : "jpg");
  const colourPath = `${owner}/draft-${draftId}-colour.${extension(one.type)}`;
  const monoPath = `${owner}/draft-${draftId}-mono.${extension(two.type)}`;
  const up1 = await admin.storage.from("logos").upload(colourPath, one.bytes, { contentType: one.type, upsert: true });
  const up2 = await admin.storage.from("logos").upload(monoPath, two.bytes, { contentType: two.type, upsert: true });
  if (up1.error || up2.error) return null;
  return { colourPath, monoPath };
}
