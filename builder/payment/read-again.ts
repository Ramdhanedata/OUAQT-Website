import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { getPublicSettings } from "@/builder/db/settings";
import { isPaymentApp, payToFrom } from "./apps";
import { confirmsAlone } from "./checks";
import { decidePayment } from "./decide";
import { grantLicence } from "./grant";
import { isLicencePlan, licenceChoices, type Price } from "./pricing";
import { readReceipt } from "./read";

/*
 * A payment whose screenshot could not be read when it was sent.
 *
 * The AI answers "too many requests" when a few screenshots arrive in the
 * same minute, or when the day's allowance is spent (twenty a day on the
 * free tier, seen on 2026-11-06), or runs out of time. Such a payment used
 * to wait for a person, and the owner's software with it, though nothing was
 * wrong with his payment. Now it is read again, by itself, when his software
 * next asks whether anything changed: every few seconds while its end window
 * is open (see app/api/licence/refresh). A minute after it was sent, then
 * twice as long after each try, an hour at most, so a busy minute is waited
 * out quickly and a spent day is still caught when it starts again; thirty
 * tries, about a day. After that it is a person's, as before.
 *
 * Read and matched, it is confirmed exactly as it would have been when sent,
 * by the same rules (decide.ts), the date measured against the day it was
 * sent. Read and not matched, what was read is kept and a person decides:
 * the owner is not on the page any more to be told why. Two devices asking at
 * once cannot both confirm it: the payment is claimed before the licence is
 * touched, and only one claim succeeds.
 */

const READ_AGAIN_FOR_MS = 2 * 86_400_000; // not-a-rule: long enough for thirty tries spread over a day
const FIRST_WAIT_MS = 60_000; // not-a-rule: a minute, the AI's own counting window
const LONGEST_WAIT_MS = 3_600_000; // not-a-rule: an hour, so a new day's allowance is caught soon
const READ_AGAIN_TIMES = 30; // not-a-rule: about a day of tries, then a person

/* How long after the last try (or the sending) the next one may be: a minute, doubling, an hour at most. */
export function waitBefore(tries: number): number {
  return Math.min(FIRST_WAIT_MS * 2 ** tries, LONGEST_WAIT_MS);
}

export type ReadAgain = "none" | "waiting" | "confirmed" | "for_a_person";

export async function readAgain(admin: SupabaseClient, businessId: string, now = new Date()): Promise<ReadAgain> {
  const { data: payment } = await admin
    .from("payments")
    .select("id, plan, app, expected_amount, screenshot_path, created_at")
    .eq("business_id", businessId)
    .eq("status", "pending_confirmation")
    .is("extracted", null)
    .gt("created_at", new Date(now.getTime() - READ_AGAIN_FOR_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment) return "none";

  /* Its trail says what he chose when he sent it, and how often it has been read again since. */
  const { data: trail } = await admin
    .from("audit_events")
    .select("action, detail, created_at")
    .eq("subject", "payment")
    .eq("subject_id", payment.id)
    .order("created_at", { ascending: false });
  const tries = (trail ?? []).filter((one) => one.action === "read_again");
  if (tries.length >= READ_AGAIN_TIMES) return "waiting";
  const last = tries[0]?.created_at ?? payment.created_at;
  if (now.getTime() - Date.parse(last) < waitBefore(tries.length)) return "waiting";

  const [settings, secrets] = await Promise.all([getPublicSettings(), getPrivateSettings()]);
  if (!settings || !secrets?.payment_auto_confirm) return "waiting";

  const { data: business } = await admin.from("businesses").select("launch_client").eq("id", businessId).maybeSingle();
  if (!business) return "waiting";

  /* Counted before the reading, so a reading that fails still waits its minute. */
  await audit({ actorId: null, subject: "payment", subjectId: payment.id, action: "read_again", detail: { attempt: tries.length + 1 } });

  const file = await admin.storage.from("payments").download(payment.screenshot_path);
  if (file.error || !file.data) return "waiting";
  const extracted = await readReceipt(await file.data.arrayBuffer());
  if (!extracted) return "waiting";

  const reference = extracted.reference?.trim() || null;
  const { data: sameReference } = reference
    ? await admin
        .from("payments")
        .select("id")
        .eq("reference", reference)
        .neq("status", "rejected_auto")
        .neq("id", payment.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  /*
   * What he chose, as it was filed. A trail without it is taken as chosen,
   * which is the stricter: the exact price of the plan it was filed as.
   */
  const filed = (trail ?? []).find((one) => one.action === "pending_confirmation")?.detail as
    | { chosen?: { plan?: boolean; app?: boolean } }
    | null
    | undefined;
  const chosenPlan = filed?.chosen?.plan !== false;
  const chosenApp = filed?.chosen?.app !== false;
  const offered: Price[] =
    chosenPlan && isLicencePlan(payment.plan)
      ? [{ plan: payment.plan, amount: payment.expected_amount, standard: payment.expected_amount, launch: false }]
      : licenceChoices(settings, Boolean(business.launch_client));
  const numbers = payToFrom(secrets);
  if (offered.length === 0 || numbers.length === 0) return "waiting";

  const { price, payTo, outcome, refundDue } = decidePayment({
    offered,
    chosenPlan,
    numbers,
    app: chosenApp && isPaymentApp(payment.app) ? payment.app : null,
    extracted,
    referenceAlreadyUsed: Boolean(sameReference),
    imageAlreadyUsed: false,
    now: new Date(payment.created_at),
  });
  const confirms = confirmsAlone(outcome, extracted);

  /*
   * Claimed: only the first of two devices asking at once gets a row back.
   * A transaction number already on another payment is left in what was
   * read, not in its column, where a receipt may only be once (0021).
   */
  const { data: claimed } = await admin
    .from("payments")
    .update({
      extracted,
      reference: sameReference ? null : outcome.reference,
      plan: price.plan,
      app: payTo.app,
      expected_amount: price.amount,
      ...(confirms ? { status: "confirmed", auto_confirmed: true } : {}),
    })
    .eq("id", payment.id)
    .eq("status", "pending_confirmation")
    .is("extracted", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return "waiting";

  if (!confirms) {
    await audit({
      actorId: null,
      subject: "payment",
      subjectId: payment.id,
      action: "read_again_unmatched",
      detail: { failures: outcome.failures, plan: price.plan },
    });
    return "for_a_person";
  }

  const granted = await grantLicence(admin, { business_id: businessId, plan: price.plan });
  if (!granted.ok) {
    /* Read, but the licence could not be written: a person finishes it, with what was read in front of them. */
    await admin.from("payments").update({ status: "pending_confirmation", auto_confirmed: false }).eq("id", payment.id);
    return "for_a_person";
  }
  await admin.from("payments").update({ licence_before: granted.before }).eq("id", payment.id);
  await audit({
    actorId: null,
    subject: "payment",
    subjectId: payment.id,
    action: "confirmed_auto",
    detail: { amount: price.amount, plan: price.plan, refundDue, readAgain: tries.length + 1 },
  });
  await audit({
    actorId: null,
    subject: "licence",
    subjectId: granted.licenceId,
    action: "activated",
    detail: { until: granted.endsAt, from: payment.id, automatically: true },
  });
  return "confirmed";
}
