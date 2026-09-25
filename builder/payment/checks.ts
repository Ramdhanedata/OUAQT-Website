/*
 * What the screenshot of a payment has to show, and what it showed.
 *
 * Adel's rules, 2026-09-25. Three things are read off the screenshot and each
 * must be right: the number the money went to is OUAQT's number on the app
 * he chose, the date is today's, and the amount is exactly the price of the
 * plan he chose (a year or six months). All three right, and nothing used
 * before: the payment succeeds (see confirmsAlone). Any one wrong or missing:
 * it does not, and he is told which, while he is still on the page.
 *
 * When the screenshot could not be read at all (the reading failed or ran out
 * of time), there is nothing to judge and a person looks.
 *
 * not-a-rule-file: the amount and the number arrive as arguments, read from
 * settings.
 */

import { toMinor } from "@/app-ui/money";

export type CheckCode =
  | "not_receipt"
  | "reference_used"
  | "image_used"
  | "wrong_amount"
  | "amount_unread"
  | "wrong_recipient"
  | "recipient_unread"
  | "wrong_date"
  | "date_unread";

export type CheckFailure = {
  code: CheckCode;
  expected?: string | number;
  found?: string | number;
};

/**
 * What was read off the screenshot, tidied by receipt.ts. Null when it was
 * not read: no key, or a reading that did not come back.
 * `amountMru` is as written on the screenshot, in ouguiyas, not minor units.
 */
export type Extracted = {
  isReceipt?: boolean | null;
  amountMru?: number | null;
  recipient?: string | null;
  date?: string | null;
  reference?: string | null;
} | null;

/** What was read, sent back to the page so the owner sees it. Money in minor units. */
export type ReadBack = { amount: number | null; date: string | null; reference: string | null };

export type PaymentDecision = {
  decision: "pending_confirmation" | "rejected_auto";
  failures: CheckFailure[];
  /** The transaction number read off the screenshot, to be kept with it. */
  reference: string | null;
};

/** Phone numbers are compared as digits: spaces and a country code are noise. */
function sameNumber(a: string, b: string): boolean {
  const digits = (value: string) => value.replace(/\D/g, "");
  const left = digits(a);
  const right = digits(b);
  if (left === "" || right === "") return false;
  return left.endsWith(right) || right.endsWith(left);
}

/* Today as the owner's apps write it: Mauritania keeps UTC all year. */
function today(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function checkPayment(input: {
  /** In minor units, as stored: the price of the plan he chose. */
  expectedAmount: number;
  /** OUAQT's number on the app he chose. */
  payToNumber: string;
  now: Date;
  extracted: Extracted;
  referenceAlreadyUsed: boolean;
  imageAlreadyUsed: boolean;
}): PaymentDecision {
  const failures: CheckFailure[] = [];
  const read = input.extracted;
  const reference = read?.reference?.trim() || null;

  if (input.imageAlreadyUsed) failures.push({ code: "image_used" });

  /* Not read at all: nothing more can be said, a person looks. */
  if (read === null) {
    return { decision: failures.length === 0 ? "pending_confirmation" : "rejected_auto", failures, reference };
  }

  /* Not a transfer at all: nothing else on it is worth checking. */
  if (read.isReceipt === false) {
    failures.push({ code: "not_receipt" });
    return { decision: "rejected_auto", failures, reference };
  }

  if (reference && input.referenceAlreadyUsed) failures.push({ code: "reference_used", found: reference });

  /* The number it went to: OUAQT's, on the app he chose. */
  if (!read.recipient) failures.push({ code: "recipient_unread", expected: input.payToNumber });
  else if (!sameNumber(read.recipient, input.payToNumber)) {
    failures.push({ code: "wrong_recipient", expected: input.payToNumber, found: read.recipient });
  }

  /* Today's date. */
  if (!read.date) failures.push({ code: "date_unread" });
  else if (read.date !== today(input.now)) failures.push({ code: "wrong_date", expected: today(input.now), found: read.date });

  /* Exactly the price of the plan he chose. */
  if (read.amountMru == null) failures.push({ code: "amount_unread", expected: input.expectedAmount });
  else {
    const found = toMinor(read.amountMru);
    if (found !== input.expectedAmount) failures.push({ code: "wrong_amount", expected: input.expectedAmount, found });
  }

  return {
    decision: failures.length === 0 ? "pending_confirmation" : "rejected_auto",
    failures,
    reference,
  };
}

/*
 * Whether the payment succeeds on the spot (0022): the screenshot was read,
 * it is a transfer, and every rule above passed. A person still sees every
 * one of these afterwards in the admin area, and can undo it.
 */
export function confirmsAlone(outcome: PaymentDecision, read: Extracted): boolean {
  return outcome.decision === "pending_confirmation" && outcome.failures.length === 0 && read !== null && read.isReceipt !== false;
}
