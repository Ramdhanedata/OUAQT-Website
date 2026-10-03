import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { toMinor } from "@/app-ui/money";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { getPublicSettings } from "@/builder/db/settings";
import { payToFrom, type PaymentApp } from "./apps";
import { checkPayment, confirmsAlone, sameNumber, type CheckFailure, type Extracted, type ReadBack } from "./checks";
import { grantLicence } from "./grant";
import { licenceChoices, planPaidFor, priceFor, refundFor, type Plan } from "./pricing";
import { readReceipt } from "./read";

/*
 * Filing a payment an owner says he made, whichever way he came: signed in
 * to his account, or with nothing but his numéro de série.
 *
 * The screenshot is hashed, read when the AI may read images, checked
 * against what was expected and against receipts already used, and filed.
 * When it was read and everything on it matched, the payment is confirmed at
 * once (0022), and a person looks at it afterwards. Otherwise it waits for a
 * person, as every payment did before.
 */

/* Confirmed only when the screenshot was read and matched, and the setting allows it. */
type Decision = "pending_confirmation" | "rejected_auto" | "confirmed";

export type Filed =
  | {
      ok: true;
      paymentId: string;
      decision: Decision;
      failures: CheckFailure[];
      expected: number;
      read: ReadBack | null;
      /* What it was filed as: the plan chosen, or the one its amount paid for. */
      plan: Plan;
      /* When the licence now ends, once confirmed. */
      endsAt: string | null;
      /* What he sent beyond the price of what it bought, in minor units: OUAQT owes it back. */
      refundDue: number;
    }
  | { ok: false; error: "no_settings" | "no_number" | "no_price" | "not_saved"; status: number };

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function filePayment(
  admin: SupabaseClient,
  input: {
    businessId: string;
    launchClient: boolean;
    /*
     * The plan he chose, or null when he chose none: the amount on the
     * screenshot then says whether it is a year or six months.
     */
    plan: Plan | null;
    /* The app he says he paid from, or null: the number the money went to says which. */
    app: PaymentApp | null;
    /* Where the screenshot already is, in the payments bucket. */
    path: string;
    bytes: ArrayBuffer;
    /* The account that sent it, or null when it came with a serial alone. */
    actorId: string | null;
  }
): Promise<Filed> {
  const [settings, secrets] = await Promise.all([getPublicSettings(), getPrivateSettings()]);
  if (!settings || !secrets) return { ok: false, error: "no_settings", status: 503 };

  // An app with no number to pay to is not offered, so a payment on it is not taken.
  const numbers = payToFrom(secrets);
  if (input.app && !numbers.some((one) => one.app === input.app)) return { ok: false, error: "no_number", status: 503 };
  if (numbers.length === 0) return { ok: false, error: "no_number", status: 503 };

  /* The plan he chose, or every one on offer when the amount is to say which. */
  const offered = input.plan ? [priceFor(input.plan, settings, input.launchClient)] : licenceChoices(settings, input.launchClient);
  // A price nobody has decided is how a refund conversation starts.
  if (offered.length === 0 || offered.some((one) => one.amount == null)) return { ok: false, error: "no_price", status: 503 };

  /*
   * Hashed here rather than in the browser. A hash sent up with the request
   * is only as honest as the page that sent it, and this one decides whether
   * the same receipt has been used twice. A receipt refused on sight reserves
   * nothing (see 0021), so it is not counted.
   */
  const imageHash = await sha256(input.bytes);
  const { data: sameImage } = await admin
    .from("payments")
    .select("id")
    .eq("image_hash", imageHash)
    .neq("status", "rejected_auto")
    .limit(1)
    .maybeSingle();

  /* A receipt already on file is not read again: that answer is known. */
  const extracted: Extracted = sameImage ? null : await readReceipt(input.bytes);
  const readReference = extracted?.reference?.trim() || null;

  const { data: sameReference } = readReference
    ? await admin
        .from("payments")
        .select("id")
        .eq("reference", readReference)
        .neq("status", "rejected_auto")
        .limit(1)
        .maybeSingle()
    : { data: null };

  /*
   * Which plan, and which app. Chosen, they are what he said. Not chosen, the
   * amount read says the plan (the longest one it covers, the rest owed back
   * to him), and the number the money went to says the app. What cannot be
   * told (nothing read, or less than the smallest price) is filed as the
   * first on offer, and a person decides; nothing is granted on it by
   * itself, because the checks below cannot all pass.
   */
  const amountRead = extracted?.amountMru != null ? toMinor(extracted.amountMru) : null;
  const price = offered.length === 1 ? offered[0] : (planPaidFor(amountRead, offered) ?? offered[0]);
  const payTo =
    numbers.find((one) => one.app === input.app) ??
    numbers.find((one) => extracted?.recipient && sameNumber(extracted.recipient, one.number)) ??
    numbers[0];

  const outcome = checkPayment({
    expectedAmounts: offered.map((one) => one.amount as number),
    atLeast: input.plan === null,
    payToNumber: payTo.number,
    now: new Date(),
    extracted,
    referenceAlreadyUsed: Boolean(sameReference),
    imageAlreadyUsed: Boolean(sameImage),
  });

  /* Sent more than the price of what it bought: said to him now, and to staff in the admin area. */
  const refundDue = input.plan === null && outcome.failures.length === 0 ? refundFor(amountRead, price) : 0;

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      business_id: input.businessId,
      plan: price.plan,
      app: payTo.app,
      expected_amount: price.amount,
      screenshot_path: input.path,
      image_hash: imageHash,
      extracted,
      reference: outcome.reference,
      status: outcome.decision,
    })
    .select("id")
    .single();

  if (error || !payment) {
    console.error("payment: not saved", error);
    return { ok: false, error: "not_saved", status: 502 };
  }

  await audit({
    actorId: input.actorId,
    subject: "payment",
    subjectId: payment.id,
    action: outcome.decision,
    detail: {
      plan: price.plan,
      app: payTo.app,
      /* Whether he chose them, or the screenshot said. */
      chosen: { plan: input.plan !== null, app: input.app !== null },
      expected: price.amount,
      refundDue,
      read: extracted !== null,
      failures: outcome.failures,
      bySerial: input.actorId === null,
    },
  });

  /*
   * Everything read and everything matched: the licence opens now, and the
   * owner's software with it at its next check. A person still sees it in
   * the admin area, and can undo it. Anything short of that waits for them.
   */
  let decision: Decision = outcome.decision;
  let endsAt: string | null = null;
  if (secrets.payment_auto_confirm && confirmsAlone(outcome, extracted)) {
    const granted = await grantLicence(admin, { business_id: input.businessId, plan: price.plan });
    if (granted.ok) {
      await admin
        .from("payments")
        .update({ status: "confirmed", auto_confirmed: true, licence_before: granted.before })
        .eq("id", payment.id);
      decision = "confirmed";
      endsAt = granted.endsAt;
      await audit({
        actorId: null,
        subject: "payment",
        subjectId: payment.id,
        action: "confirmed_auto",
        detail: { amount: price.amount, plan: price.plan },
      });
      await audit({
        actorId: null,
        subject: "licence",
        subjectId: granted.licenceId,
        action: "activated",
        detail: { until: granted.endsAt, from: payment.id, automatically: true },
      });
    }
  }

  return {
    ok: true,
    paymentId: payment.id,
    decision,
    failures: outcome.failures,
    expected: price.amount as number,
    plan: price.plan,
    endsAt,
    refundDue,
    read: extracted
      ? {
          amount: extracted.amountMru != null ? toMinor(extracted.amountMru) : null,
          date: extracted.date ?? null,
          reference: outcome.reference,
        }
      : null,
  };
}
