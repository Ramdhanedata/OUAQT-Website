import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { deviceCodeFor, normaliseCode } from "@/app-ui/codes";
import { hashSerial, normaliseSerial } from "@/builder/serial/serial";
import { matchText, phoneDigits, type MatchKind } from "./search-rules";

/*
 * Finding a shop from whatever the person on the phone can read out: the
 * shop's name in either script, the owner's phone, the numéro de série, the
 * code the software shows on its own screen, part of the address, or the
 * shop's id.
 *
 * Names, phones and addresses are compared here rather than in SQL, because
 * a phone is written "22 33 44 55" on one receipt and "+222 22334455" on
 * another, and a name with or without its accents. A serial is looked up by
 * its hash, the way activation does, since no serial is stored in the clear.
 * A computer's code is worked out from each computer's id and compared, only
 * when what was typed has the shape of one.
 */

const MANY = 5_000; // not-a-rule: a ceiling on each read, far above today's shop count
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ShopRow = {
  id: string;
  name_latin: string;
  name_arabic: string | null;
  pack: string;
  launch_client: boolean;
  receipt_phone: string | null;
  receipt_address: string | null;
  created_at: string;
};

export type Found = { shop: ShopRow; matched: MatchKind | null };

/** Every shop, newest first, each with what matched; all of them when nothing was typed. */
export async function findShops(supabase: SupabaseClient, query: string): Promise<Found[]> {
  const { data } = await supabase
    .from("businesses")
    .select("id, name_latin, name_arabic, pack, launch_client, receipt_phone, receipt_address, created_at")
    .order("created_at", { ascending: false })
    .limit(MANY);
  const shops = (data ?? []) as ShopRow[];
  const typed = query.trim();
  if (!typed) return shops.map((shop) => ({ shop, matched: null }));

  const matched = new Map<string, MatchKind>();
  const mark = (id: string | null | undefined, kind: MatchKind) => {
    if (id && !matched.has(id)) matched.set(id, kind);
  };

  if (UUID.test(typed)) mark(shops.find((shop) => shop.id === typed.toLowerCase())?.id, "id");

  const serial = normaliseSerial(typed);
  if (serial) {
    const hash = await hashSerial(serial);
    const [{ data: serials }, { data: drafts }] = await Promise.all([
      supabase.from("serials").select("business_id").eq("serial_hash", hash),
      supabase.from("builder_drafts").select("business_id").eq("serial_hash", hash).not("business_id", "is", null),
    ]);
    for (const row of [...(serials ?? []), ...(drafts ?? [])]) mark(row.business_id, "serial");
  }

  /* A computer's code is ten letters and digits, shown in two groups of five. */
  const code = normaliseCode(typed);
  if (/^[A-Z0-9]{10}$/.test(code)) {
    const { data: devices } = await supabase.from("devices").select("business_id, device_id").limit(MANY);
    for (const device of devices ?? []) {
      if (normaliseCode(await deviceCodeFor(device.device_id)) === code) mark(device.business_id, "device");
    }
  }

  const digits = phoneDigits(typed);
  if (digits) {
    const [{ data: drafts }, { data: claims }] = await Promise.all([
      supabase.from("builder_drafts").select("business_id, phone").not("business_id", "is", null).not("phone", "is", null).limit(MANY),
      supabase.from("trial_claims").select("business_id, phone").not("phone", "is", null).limit(MANY),
    ]);
    for (const row of [...(drafts ?? []), ...(claims ?? [])]) {
      if ((row.phone ?? "").replace(/\D/g, "").includes(digits)) mark(row.business_id, "phone");
    }
    for (const shop of shops) {
      if ((shop.receipt_phone ?? "").replace(/\D/g, "").includes(digits)) mark(shop.id, "phone");
    }
  }

  for (const shop of shops) {
    if (matchText(shop.name_latin, typed) || matchText(shop.name_arabic, typed)) mark(shop.id, "name");
    else if (matchText(shop.receipt_address, typed)) mark(shop.id, "address");
  }

  return shops.filter((shop) => matched.has(shop.id)).map((shop) => ({ shop, matched: matched.get(shop.id) ?? null }));
}
