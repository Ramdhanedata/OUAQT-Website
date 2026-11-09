import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings, type PrivateSettings } from "@/builder/db/private-settings";
import {
  repeatSignals,
  tradeChangeAllowed,
  trialAllowed,
  type Claim,
  type Decision,
  type Fingerprint,
  type TrialRules,
} from "./trial";

/*
 * The database half of the trial rules: what a shop's marks are, what every
 * earlier trial's marks were, and writing down the claim once it is allowed.
 *
 * The decisions themselves live in trial.ts, with no database anywhere near
 * them, so they can be argued with in a test.
 */

export function rulesFrom(settings: PrivateSettings): TrialRules {
  return {
    onePerFingerprint: settings.trial_one_per_fingerprint,
    onePerPhone: settings.trial_one_per_phone,
    requireFingerprint: settings.trial_require_fingerprint,
    fingerprintPartsToMatch: settings.trial_fingerprint_parts_to_match,
    similarityPercent: settings.trial_similarity_percent,
  };
}

async function sha256(input: Uint8Array | string): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Buffer.from(digest).toString("hex");
}

/*
 * The owner's login phone, which is the local part of the address his account
 * was made with. It is the number he would answer if we rang him, and the one
 * he would use again if he wanted a second trial.
 */
async function phoneOf(
  supabase: SupabaseClient,
  ownerId: string
): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(ownerId);
  const email = data?.user?.email ?? "";
  const digits = email.split("@")[0]?.replace(/\D/g, "") ?? "";
  return digits || null;
}

/*
 * The product list, reduced to one line per product so that the same catalogue
 * imported twice under two shop names hashes the same. Sorted, because two
 * imports of one spreadsheet can arrive in a different order.
 */
async function productsHashOf(
  supabase: SupabaseClient,
  businessId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("products_initial")
    .select("data")
    .eq("business_id", businessId);

  if (!data || data.length === 0) return null;

  const lines = data
    .map((row) => {
      const product = row.data as { name?: unknown; price?: unknown };
      return `${String(product.name ?? "").trim().toLowerCase()}|${String(product.price ?? "")}`;
    })
    .sort();

  return sha256(lines.join("\n"));
}

/*
 * The logo, hashed from the bytes themselves. Best effort on purpose: a logo
 * that cannot be fetched costs us one soft signal, and a signal that only
 * ever suggests a second look is not worth failing an activation over.
 */
async function logoHashOf(
  supabase: SupabaseClient,
  businessId: string
): Promise<string | null> {
  try {
    const { data: row } = await supabase
      .from("logos")
      .select("colour_path")
      .eq("business_id", businessId)
      .maybeSingle();
    if (!row?.colour_path) return null;

    const { data: file } = await supabase.storage.from("logos").download(row.colour_path);
    if (!file) return null;

    return sha256(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return null;
  }
}

/* The trade of the shop a row belongs to, read through its business. */
export function packOfRow(row: { businesses?: unknown }): string | null {
  const shop = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
  const pack = (shop as { pack?: unknown } | null | undefined)?.pack;
  return typeof pack === "string" && pack ? pack : null;
}

/*
 * The trades a claim covered (0039), or failing that the trade its shop has
 * now. Empty only when neither can be read, which counts as every trade.
 */
export function packsOfRow(row: { packs?: unknown; businesses?: unknown }): string[] {
  const written = Array.isArray(row.packs) ? row.packs.filter((one): one is string => typeof one === "string" && one !== "") : [];
  if (written.length > 0) return written;
  const now = packOfRow(row);
  return now ? [now] : [];
}

/*
 * Every trade a shop is known to have run, from a row that carries
 * businesses(pack, trial_claims(packs)): what its trials covered and the
 * trade it has now. Empty only when nothing could be read.
 */
export function tradesOfShopRow(row: { businesses?: unknown }): string[] {
  const shop = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
  const claims = (shop as { trial_claims?: unknown } | null | undefined)?.trial_claims;
  const covered = Array.isArray(claims) ? claims.flatMap((claim) => packsOfRow(claim as { packs?: unknown })) : [];
  const now = packOfRow(row);
  return [...new Set([...covered, ...(now ? [now] : [])])];
}

async function pastClaims(supabase: SupabaseClient): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("trial_claims")
    .select(
      "business_id, packs, fingerprint_board, fingerprint_disk, fingerprint_machine, phone, logo_hash, products_hash, name, address, businesses(pack)"
    );
  /*
   * Unread is not empty: an empty list would give every device a trial. The
   * activation fails instead, and the owner tries again a minute later.
   */
  if (error) throw new Error(`trial claims not read: ${error.message}`);

  return (data ?? []).map((row) => ({
    businessId: row.business_id as string,
    packs: packsOfRow(row),
    fingerprint: {
      board: row.fingerprint_board as string | null,
      disk: row.fingerprint_disk as string | null,
      machine: row.fingerprint_machine as string | null,
    },
    phone: row.phone as string | null,
    logoHash: row.logo_hash as string | null,
    productsHash: row.products_hash as string | null,
    name: (row.name as string) ?? "",
    address: row.address as string | null,
  }));
}

export type Business = {
  id: string;
  owner_id: string;
  pack: string;
  name_latin: string;
  receipt_address: string | null;
};

export type ClaimOutcome =
  | { kind: "not_a_trial" }
  | { kind: "already_claimed" }
  | { kind: "granted" }
  | { kind: "refused"; decision: Extract<Decision, { allowed: false }> };

/**
 * Settle whether this activation may start a trial, and write the claim when
 * it may.
 *
 * `startsTrial` is false for a shop that has paid, and such a shop is never
 * asked for a fingerprint: the rules here exist to protect a free thing, not
 * to stand between a customer and the software he bought.
 */
export async function claimTrial(
  supabase: SupabaseClient,
  business: Business,
  fingerprint: Fingerprint,
  settings: PrivateSettings,
  startsTrial: boolean
): Promise<ClaimOutcome> {
  if (!startsTrial) return { kind: "not_a_trial" };

  const past = await pastClaims(supabase);
  if (past.some((one) => one.businessId === business.id)) {
    /* This shop's trial, carrying on. A second computer is not a second trial. */
    return { kind: "already_claimed" };
  }

  /* Someone was refused and we decided otherwise. That decision comes first. */
  const { data: override } = await supabase
    .from("trial_overrides")
    .select("id")
    .eq("business_id", business.id)
    .is("used_at", null)
    .limit(1)
    .maybeSingle();

  const [phone, productsHash, logoHash] = await Promise.all([
    phoneOf(supabase, business.owner_id),
    productsHashOf(supabase, business.id),
    logoHashOf(supabase, business.id),
  ]);

  const candidate: Claim = {
    businessId: business.id,
    packs: [business.pack],
    fingerprint,
    phone,
    logoHash,
    productsHash,
    name: business.name_latin,
    address: business.receipt_address,
  };

  const rules = rulesFrom(settings);

  if (!override) {
    const decision = trialAllowed(candidate, past, rules);
    if (!decision.allowed) return { kind: "refused", decision };
  }

  await supabase.from("trial_claims").insert({
    business_id: business.id,
    packs: [business.pack],
    fingerprint_board: fingerprint.board,
    fingerprint_disk: fingerprint.disk,
    fingerprint_machine: fingerprint.machine,
    phone,
    logo_hash: logoHash,
    products_hash: productsHash,
    name: business.name_latin,
    address: business.receipt_address,
    signals: repeatSignals(candidate, past, rules),
  });

  if (override) {
    await supabase
      .from("trial_overrides")
      .update({ used_at: new Date().toISOString() })
      .eq("id", override.id);
  }

  return { kind: "granted" };
}

export type TradeOutcome = "nothing_to_do" | "covered" | "added" | "granted_by_hand" | "ended";

/**
 * A shop's trade, settled against its free trial. Called each time the shop
 * follows what its owner changed on the website, with the trade it runs now.
 *
 * A trial that is running and has not covered this trade yet is asked
 * tradeChangeAllowed. Allowed, the trade is added to what the trial covered,
 * so no other shop on these devices gets a trial of it later. Refused, the
 * trial ends now and the app shows its end-of-trial window at its next
 * check, unless staff had already granted this shop a trial by hand. Staff
 * can still reopen it from the client's page, like any licence.
 *
 * Nothing is written until the decision is: a step that fails leaves the
 * trade uncovered, so the next refresh asks again instead of letting it
 * through.
 */
export async function settleTrade(
  supabase: SupabaseClient,
  businessId: string,
  pack: string
): Promise<TradeOutcome> {
  const { data: licence } = await supabase
    .from("licences")
    .select("id, plan, starts_at, ends_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  /*
   * Only a running trial has anything to protect. One not started yet is
   * claimed under the trade it starts with; one ended or paid for gains
   * nothing from a change of trade.
   */
  const running =
    licence?.plan === "trial" &&
    Boolean(licence.starts_at) &&
    Boolean(licence.ends_at) &&
    new Date(licence.ends_at as string).getTime() > Date.now();
  if (!licence || !running) return "nothing_to_do";

  const { data: own, error } = await supabase
    .from("trial_claims")
    .select("id, packs, phone, fingerprint_board, fingerprint_disk, fingerprint_machine")
    .eq("business_id", businessId);
  if (error || !own || own.length === 0) return "nothing_to_do";

  const covered = [...new Set(own.flatMap((row) => packsOfRow(row)))];
  if (covered.includes(pack)) return "covered";

  const settings = await getPrivateSettings();
  if (!settings) return "nothing_to_do";

  const { data: devices } = await supabase
    .from("devices")
    .select("fingerprint")
    .eq("business_id", businessId)
    .eq("status", "active");
  const reported = (mark: Fingerprint | null) => Boolean(mark && (mark.board || mark.disk || mark.machine));
  const fingerprints = [
    ...own.map((row) => ({
      board: row.fingerprint_board as string | null,
      disk: row.fingerprint_disk as string | null,
      machine: row.fingerprint_machine as string | null,
    })),
    ...(devices ?? []).map((device) => device.fingerprint as Fingerprint | null),
  ].filter((mark): mark is Fingerprint => reported(mark));

  const decision = tradeChangeAllowed(
    { businessId, pack, fingerprints, phone: (own[0].phone as string | null) ?? null },
    await pastClaims(supabase),
    rulesFrom(settings)
  );

  let outcome: TradeOutcome = "added";
  if (!decision.allowed) {
    const { data: override } = await supabase
      .from("trial_overrides")
      .select("id")
      .eq("business_id", businessId)
      .is("used_at", null)
      .limit(1)
      .maybeSingle();

    if (override) {
      await supabase.from("trial_overrides").update({ used_at: new Date().toISOString() }).eq("id", override.id);
      outcome = "granted_by_hand";
    } else {
      const { error: notEnded } = await supabase
        .from("licences")
        .update({ ends_at: new Date().toISOString() })
        .eq("id", licence.id);
      if (notEnded) return "nothing_to_do";
      await audit({
        actorId: null,
        subject: "licence",
        subjectId: licence.id as string,
        action: "trial_refused",
        detail: { businessId, because: decision.because, tradeChange: { to: pack, covered } },
      });
      outcome = "ended";
    }
  }

  for (const row of own) {
    await supabase
      .from("trial_claims")
      .update({ packs: [...new Set([...packsOfRow(row), pack])] })
      .eq("id", row.id);
  }
  return outcome;
}
