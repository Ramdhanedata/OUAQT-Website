import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { mayReadImages } from "@/builder/ai";
import { audit } from "@/builder/db/audit";
import { getPrivateSettings } from "@/builder/db/private-settings";
import { getPublicSettings } from "@/builder/db/settings";
import { checkPayment, type CheckFailure } from "./checks";
import { priceFor, type Plan } from "./pricing";

/*
 * Filing a payment an owner says he made, whichever way he came: signed in
 * to his account, or with nothing but his numéro de série.
 *
 * Nothing here decides that he has paid. The screenshot is hashed, checked
 * against what was expected and against receipts already used, and filed for
 * a person to confirm. The only status this can write that means anything
 * good is `pending_confirmation`.
 */

export type Filed =
  | { ok: true; paymentId: string; decision: string; failures: CheckFailure[]; expected: number }
  | { ok: false; error: "no_settings" | "no_bankily_number" | "no_price" | "not_saved"; status: number };

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
    /* Where the screenshot already is, in the payments bucket. */
    path: string;
    bytes: ArrayBuffer;
    reference: string | null;
    /* The account that sent it, or null when it came with a serial alone. */
    actorId: string | null;
  }
): Promise<Filed> {
  const [settings, secrets] = await Promise.all([getPublicSettings(), getPrivateSettings()]);
  if (!settings || !secrets) return { ok: false, error: "no_settings", status: 503 };

  // No number to pay to means no payment page: it stays hidden until it is set.
  if (secrets.bankily_number.trim() === "") return { ok: false, error: "no_bankily_number", status: 503 };

  const price = priceFor(input.plan, settings, input.launchClient);
  // A price nobody has decided is how a refund conversation starts.
  if (price.amount == null) return { ok: false, error: "no_price", status: 503 };

  /*
   * Hashed here rather than in the browser. A hash sent up with the request
   * is only as honest as the page that sent it, and this one decides whether
   * the same receipt has been used twice.
   */
  const imageHash = await sha256(input.bytes);
  const reference = input.reference?.trim() || null;

  const [{ data: sameImage }, { data: sameReference }] = await Promise.all([
    admin.from("payments").select("id").eq("image_hash", imageHash).maybeSingle(),
    reference ? admin.from("payments").select("id").eq("reference", reference).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const outcome = checkPayment({
    expectedAmount: price.amount,
    bankilyNumber: secrets.bankily_number,
    paymentMaxAgeDays: secrets.payment_max_age_days,
    now: new Date(),
    typedReference: reference,
    extracted: null,
    referenceAlreadyUsed: Boolean(sameReference),
    imageAlreadyUsed: Boolean(sameImage),
    aiReadsImages: mayReadImages(),
  });

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      business_id: input.businessId,
      plan: input.plan,
      expected_amount: price.amount,
      screenshot_path: input.path,
      image_hash: imageHash,
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
    detail: { plan: input.plan, expected: price.amount, failures: outcome.failures, bySerial: input.actorId === null },
  });

  return { ok: true, paymentId: payment.id, decision: outcome.decision, failures: outcome.failures, expected: price.amount };
}
