import { toMinor } from "@/app-ui/money";
import type { PayTo, PaymentApp } from "./apps";
import { checkPayment, sameNumber, type Extracted, type PaymentDecision } from "./checks";
import { planPaidFor, refundFor, type Plan, type Price } from "./pricing";

/*
 * What a payment is, from what was read off its screenshot: which plan,
 * which app, whether every check passed, and what is owed back to him.
 *
 * One place for it, because a payment is decided twice over: when it is
 * sent, and again later when its screenshot could not be read then (see
 * read-again.ts). Both must come to the same answer from the same reading.
 *
 * Chosen, the plan and the app are what he said. Not chosen, the amount read
 * says the plan (the longest one it covers, the rest owed back to him), and
 * the number the money went to says the app. What cannot be told (nothing
 * read, or less than the smallest price) is filed as the length he picked on
 * the page, or else the first on offer, and a person decides; nothing is
 * granted on it by itself, because the checks cannot all pass. The length
 * picked never outweighs an amount that was read (Adel, 2026-11-24).
 */
export function decidePayment(input: {
  /* The plan he chose, or every one on offer when the amount is to say which. */
  offered: Price[];
  chosenPlan: boolean;
  /* The length he had picked on the page, for when the amount cannot say: a hint, not a choice. */
  fallback?: Plan | null;
  /* OUAQT's numbers, one per app that has one. */
  numbers: PayTo[];
  /* The app he chose, or null when the number the money went to is to say which. */
  app: PaymentApp | null;
  extracted: Extracted;
  referenceAlreadyUsed: boolean;
  imageAlreadyUsed: boolean;
  /* The day the payment was sent: its screenshot must show that day, or one of the days before it allowed. */
  now: Date;
  maxAgeDays?: number;
}): { price: Price; payTo: PayTo; outcome: PaymentDecision; refundDue: number } {
  const { offered, extracted } = input;
  const amountRead = extracted?.amountMru != null ? toMinor(extracted.amountMru) : null;
  const price =
    offered.length === 1
      ? offered[0]
      : (planPaidFor(amountRead, offered) ?? offered.find((one) => one.plan === input.fallback) ?? offered[0]);
  const payTo =
    input.numbers.find((one) => one.app === input.app) ??
    input.numbers.find((one) => extracted?.recipient && sameNumber(extracted.recipient, one.number)) ??
    input.numbers[0];

  const outcome = checkPayment({
    expectedAmounts: offered.map((one) => one.amount as number),
    atLeast: !input.chosenPlan,
    payToNumber: payTo.number,
    now: input.now,
    maxAgeDays: input.maxAgeDays,
    extracted,
    referenceAlreadyUsed: input.referenceAlreadyUsed,
    imageAlreadyUsed: input.imageAlreadyUsed,
  });

  /* Sent more than the price of what it bought: said to him, and to staff in the admin area. */
  const refundDue = !input.chosenPlan && outcome.failures.length === 0 ? refundFor(amountRead, price) : 0;

  return { price, payTo, outcome, refundDue };
}
