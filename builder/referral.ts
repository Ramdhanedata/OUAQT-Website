import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Who brought a shop to OUAQT.
 *
 * A representative's QR code opens www.ouaqt.com/?ref=CODE. The middleware
 * keeps the code in a cookie for 30 days, the first one only, so the person
 * who made the introduction keeps it. When that browser is given its serial
 * (or makes an account), the draft is credited; when the shop is made from
 * the draft, the shop carries the credit on, whichever computer that happens
 * on. A code that matches no active representative credits nobody.
 *
 * 0030 says the rest: the browser can never write the credit itself.
 */

export const REF_COOKIE = "ouaqt_ref";
export const REF_COOKIE_DAYS = 30; // not-a-rule: how long a QR scan keeps its representative

/* Six of these: no 0, O, 1 or I, so a code read aloud or typed is never misread. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REP_CODE = /^[A-HJ-NP-Z2-9]{6}$/;

export function repCodeOf(value: string | null | undefined): string | null {
  const code = (value ?? "").trim().toUpperCase();
  return REP_CODE.test(code) ? code : null;
}

export function newRepCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

/* The active representative a cookie names, or nobody. */
export async function representativeFor(admin: SupabaseClient, cookie: string | null | undefined): Promise<string | null> {
  const code = repCodeOf(cookie);
  if (!code) return null;
  const { data } = await admin.from("representatives").select("id").eq("code", code).eq("active", true).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/* Credits a draft to the representative its browser came with. The first credit stays. */
export async function creditDraft(admin: SupabaseClient, draftId: string, cookie: string | null | undefined): Promise<void> {
  const representativeId = await representativeFor(admin, cookie);
  if (!representativeId) return;
  await admin.from("builder_drafts").update({ representative_id: representativeId }).eq("id", draftId).is("representative_id", null);
}

/* The shop made from a draft carries its credit, unless staff already gave the shop one. */
export async function carryCredit(admin: SupabaseClient, draftId: string, businessId: string): Promise<void> {
  const { data } = await admin.from("builder_drafts").select("representative_id").eq("id", draftId).maybeSingle();
  const representativeId = data?.representative_id as string | null | undefined;
  if (!representativeId) return;
  await admin.from("businesses").update({ representative_id: representativeId }).eq("id", businessId).is("representative_id", null);
}
