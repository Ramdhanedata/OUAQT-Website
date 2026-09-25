/*
 * What can be decided about a payment without a person, and what cannot.
 *
 * Nothing here ever marks a payment as paid. The best outcome is
 * "pending_confirmation", which means the automatic checks found nothing
 * wrong and a human being still has to look. That is the whole design: the
 * checks exist to catch the honest mistake and the obvious duplicate early,
 * while the owner is still on the page and can fix it, not to decide who has
 * paid us.
 *
 * The owner types nothing but chooses his app and sends the screenshot. When
 * the AI reads images, what it read is checked here: that it is a transfer
 * at all, the amount, the date, the number it went to, and that the
 * transaction number has not been used. When it does not, there is nothing
 * to check but the image itself, and a person reads the rest.
 *
 * not-a-rule-file: the amounts, the number and the window all arrive as
 * arguments, read from settings.
 */

import { toMinor } from "@/app-ui/money";

export type CheckCode =
  | "not_receipt"
  | "reference_used"
  | "image_used"
  | "wrong_amount"
  | "wrong_recipient"
  | "too_old"
  | "future_date";

export type CheckFailure = {
  code: CheckCode;
  expected?: string | number;
  found?: string | number;
};

/**
 * What was read off the screenshot, tidied by receipt.ts. Null when it was
 * not read: the free tier, no key, or a reading that did not come back.
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

const MS_IN_A_DAY = 86_400_000;

/*
 * A transfer dated tomorrow is a clock or a timezone, not a forgery, up to a
 * day. Past that, the date on the screenshot is not the date it was sent.
 */
const FUTURE_SLACK_DAYS = 1; // not-a-rule: one timezone's worth of doubt

/** Phone numbers are compared as digits: spaces and a country code are noise. */
function sameNumber(a: string, b: string): boolean {
  const digits = (value: string) => value.replace(/\D/g, "");
  const left = digits(a);
  const right = digits(b);
  if (left === "" || right === "") return false;
  return left.endsWith(right) || right.endsWith(left);
}

export function checkPayment(input: {
  /** In minor units, as stored. */
  expectedAmount: number;
  /** The number on the app he chose. */
  payToNumber: string;
  paymentMaxAgeDays: number;
  now: Date;
  extracted: Extracted;
  referenceAlreadyUsed: boolean;
  imageAlreadyUsed: boolean;
}): PaymentDecision {
  const failures: CheckFailure[] = [];
  const read = input.extracted;
  const reference = read?.reference?.trim() || null;

  if (input.imageAlreadyUsed) {
    failures.push({ code: "image_used" });
  }

  /* Not a transfer at all: nothing else on it is worth checking. */
  if (read?.isReceipt === false) {
    failures.push({ code: "not_receipt" });
    return { decision: "rejected_auto", failures, reference };
  }

  if (reference && input.referenceAlreadyUsed) {
    failures.push({ code: "reference_used", found: reference });
  }

  /*
   * Only what was actually read gets checked. A reading that could not make
   * out the amount is not evidence that the amount is wrong.
   *
   * Less than expected is refused. More is not: he has paid, and a person
   * sees the difference beside the screenshot.
   */
  if (read?.amountMru != null) {
    const found = toMinor(read.amountMru);
    if (found < input.expectedAmount) {
      failures.push({ code: "wrong_amount", expected: input.expectedAmount, found });
    }
  }

  if (read?.recipient && !sameNumber(read.recipient, input.payToNumber)) {
    failures.push({ code: "wrong_recipient", expected: input.payToNumber, found: read.recipient });
  }

  if (read?.date) {
    /* In whole days: a transfer from a week ago today is a week old, not more. */
    const days = (input.now.getTime() - new Date(read.date).getTime()) / MS_IN_A_DAY;
    if (Number.isFinite(days) && Math.floor(days) > input.paymentMaxAgeDays) {
      failures.push({ code: "too_old", expected: input.paymentMaxAgeDays, found: Math.floor(days) });
    } else if (Number.isFinite(days) && days < -FUTURE_SLACK_DAYS) {
      failures.push({ code: "future_date", found: read.date });
    }
  }

  return {
    decision: failures.length === 0 ? "pending_confirmation" : "rejected_auto",
    failures,
    reference,
  };
}

/*
 * Whether a payment may be confirmed without waiting for a person (0022).
 *
 * Only when everything was read and everything matched: a transfer, at least
 * the price, a date inside the window, a transaction number, and our number
 * as the recipient. A field that could not be read is not a failure, but it
 * is not a match either, so that payment waits for a person. A person still
 * looks at every automatic confirmation afterwards and can undo it.
 */
export function confirmsAlone(outcome: PaymentDecision, read: Extracted, expectedAmount: number): boolean {
  return (
    outcome.decision === "pending_confirmation" &&
    outcome.failures.length === 0 &&
    read !== null &&
    read.isReceipt === true &&
    read.amountMru != null &&
    toMinor(read.amountMru) >= expectedAmount &&
    Boolean(read.date) &&
    Boolean(outcome.reference) &&
    Boolean(read.recipient)
  );
}
