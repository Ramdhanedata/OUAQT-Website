import "server-only";

import QRCode from "qrcode";
import type { SupabaseClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/i18n/metadata";

/*
 * A representative's link and QR code, and what their page lists.
 *
 * The link is the site's front door with their code (?ref=CODE): it opens
 * the home page in the visitor's language, and the middleware keeps the code
 * (builder/referral.ts). The QR code is that link, drawn on the server.
 */

export function repLink(code: string): string {
  return `${siteUrl()}/?ref=${code}`;
}

/* An SVG to put straight in the page: black on white, with the quiet zone a scanner needs. */
export async function repQrSvg(code: string): Promise<string> {
  return QRCode.toString(repLink(code), { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });
}

export async function repQrPng(code: string): Promise<Buffer> {
  return QRCode.toBuffer(repLink(code), { type: "png", width: 1200, margin: 3, errorCorrectionLevel: "M" });
}

/* A representative's bonus rule in words: only the parts that are set. */
export function ruleWords(
  words: { rulePercent: string; rulePerShop: string; ruleNone: string },
  rule: { percent: number; perShop: number },
  format: { number: (value: number) => string; money: (value: number) => string }
): string {
  const parts = [
    rule.percent > 0 ? words.rulePercent.replace("{percent}", format.number(rule.percent)) : null,
    rule.perShop > 0 ? words.rulePerShop.replace("{perShop}", format.money(rule.perShop)) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" + ") : words.ruleNone;
}

export type RepShop = { id: string; name: string; pack: string; createdAt: string; paid: number };
export type Payout = { id: string; amount: number; note: string | null; paidAt: string };

/* The shops a representative brought, with what each has paid, and what they have been paid. */
export async function repDetail(supabase: SupabaseClient, id: string) {
  const [{ data: rep }, { data: shops }, { data: payouts }] = await Promise.all([
    supabase.from("representatives").select("id, name, phone, code, commission_percent, bonus_per_client, active, note, created_at").eq("id", id).maybeSingle(),
    supabase.from("businesses").select("id, name_latin, pack, created_at").eq("representative_id", id).order("created_at", { ascending: false }).limit(1000),
    supabase.from("representative_payouts").select("id, amount, note, paid_at").eq("representative_id", id).order("paid_at", { ascending: false }),
  ]);
  if (!rep) return null;

  const ids = (shops ?? []).map((one) => one.id as string);
  const { data: payments } = ids.length
    ? await supabase.from("payments").select("business_id, expected_amount").eq("status", "confirmed").in("business_id", ids)
    : { data: [] as { business_id: string; expected_amount: number }[] };
  const paidBy = new Map<string, number>();
  for (const one of payments ?? []) paidBy.set(one.business_id as string, (paidBy.get(one.business_id as string) ?? 0) + Number(one.expected_amount));

  return {
    rep: {
      id: rep.id as string,
      name: rep.name as string,
      phone: (rep.phone as string | null) ?? null,
      code: rep.code as string,
      percent: Number(rep.commission_percent),
      perShop: Number(rep.bonus_per_client),
      active: Boolean(rep.active),
      note: (rep.note as string | null) ?? null,
      createdAt: rep.created_at as string,
    },
    shops: (shops ?? []).map((one): RepShop => ({
      id: one.id as string,
      name: one.name_latin as string,
      pack: one.pack as string,
      createdAt: one.created_at as string,
      paid: paidBy.get(one.id as string) ?? 0,
    })),
    payouts: (payouts ?? []).map((one): Payout => ({
      id: one.id as string,
      amount: Number(one.amount),
      note: (one.note as string | null) ?? null,
      paidAt: one.paid_at as string,
    })),
  };
}
