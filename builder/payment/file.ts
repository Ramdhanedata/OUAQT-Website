import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { toMinor } from "@/app-ui/money";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { getPublicSettings } from "@/builder/db/settings";
import { payToFrom, type PaymentApp } from "./apps";
import { checkPayment, confirmsAlone, type CheckFailure, type Extracted, type ReadBack } from "./checks";
import { grantLicence } from "./grant";
import { priceFor, type Plan } from "./pricing";
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
    plan: Plan;
    /* The app he says he paid from. */
    app: PaymentApp;
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
  const payTo = payToFrom(secrets).find((one) => one.app === input.app);
  if (!payTo) return { ok: false, error: "no_number", status: 503 };

  const price = priceFor(input.plan, settings, input.launchClient);
  // A price nobody has decided is how a refund conversation starts.
  if (price.amount == null) return { ok: false, error: "no_price", status: 503 };

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

  const outcome = checkPayment({
    expectedAmount: price.amount,
    payToNumber: payTo.number,
    now: new Date(),
    extracted,
    referenceAlreadyUsed: Boolean(sameReference),
    imageAlreadyUsed: Boolean(sameImage),
  });

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      business_id: input.businessId,
      plan: input.plan,
      app: input.app,
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
      plan: input.plan,
      app: input.app,
      expected: price.amount,
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
  if (secrets.payment_auto_confirm && confirmsAlone(outcome, extracted)) {
    const granted = await grantLicence(admin, { business_id: input.businessId, plan: input.plan });
    if (granted.ok) {
      await admin
        .from("payments")
        .update({ status: "confirmed", auto_confirmed: true, licence_before: granted.before })
        .eq("id", payment.id);
      decision = "confirmed";
      await audit({
        actorId: null,
        subject: "payment",
        subjectId: payment.id,
        action: "confirmed_auto",
        detail: { amount: price.amount, plan: input.plan },
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
    expected: price.amount,
    read: extracted
      ? {
          amount: extracted.amountMru != null ? toMinor(extracted.amountMru) : null,
          date: extracted.date ?? null,
          reference: outcome.reference,
        }
      : null,
  };
}
