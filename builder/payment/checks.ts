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
 * With the AI off there is nothing to read out of the screenshot, so the
 * typed reference becomes the only thing to check against, and it is
 * required.
 *
 * not-a-rule-file: the amounts, the number and the window all arrive as
 * arguments, read from settings.
 */

export type CheckCode =
  | "reference_missing"
  | "reference_used"
  | "image_used"
  | "wrong_amount"
  | "wrong_recipient"
  | "too_old";

export type CheckFailure = {
  code: CheckCode;
  expected?: string | number;
  found?: string | number;
};

/** What a vision call read off the screenshot. Null when the AI is off. */
export type Extracted = {
  amountMru?: number | null;
  recipient?: string | null;
  date?: string | null;
  reference?: string | null;
} | null;

export type PaymentDecision = {
  decision: "pending_confirmation" | "rejected_auto";
  failures: CheckFailure[];
  /** The reference that will be stored, from the owner or from the image. */
  reference: string | null;
};

const MS_IN_A_DAY = 86_400_000;

/** Phone numbers are compared as digits: spaces and a country code are noise. */
function sameNumber(a: string, b: string): boolean {
  const digits = (value: string) => value.replace(/\D/g, "");
  const left = digits(a);
  const right = digits(b);
  if (left === "" || right === "") return false;
  return left.endsWith(right) || right.endsWith(left);
}

export function checkPayment(input: {
  expectedAmount: number;
  bankilyNumber: string;
  paymentMaxAgeDays: number;
  now: Date;
  typedReference: string | null;
  extracted: Extracted;
  referenceAlreadyUsed: boolean;
  imageAlreadyUsed: boolean;
  /** False on the free tier, where a screenshot is never sent to a model. */
  aiReadsImages: boolean;
}): PaymentDecision {
  const failures: CheckFailure[] = [];
  const typed = input.typedReference?.trim() || null;
  const reference = typed ?? input.extracted?.reference?.trim() ?? null;

  if (!input.aiReadsImages && !typed) {
    failures.push({ code: "reference_missing" });
  }

  if (input.imageAlreadyUsed) {
    failures.push({ code: "image_used" });
  }

  if (reference && input.referenceAlreadyUsed) {
    failures.push({ code: "reference_used", found: reference });
  }

  /*
   * Only what was actually read gets checked. A vision call that could not
   * make out the amount is not evidence that the amount is wrong.
   */
  const read = input.aiReadsImages ? input.extracted : null;

  if (read?.amountMru != null && read.amountMru !== input.expectedAmount) {
    failures.push({
      code: "wrong_amount",
      expected: input.expectedAmount,
      found: read.amountMru,
    });
  }

  if (read?.recipient && !sameNumber(read.recipient, input.bankilyNumber)) {
    failures.push({
      code: "wrong_recipient",
      expected: input.bankilyNumber,
      found: read.recipient,
    });
  }

  if (read?.date) {
    const when = new Date(read.date);
    const age = (input.now.getTime() - when.getTime()) / MS_IN_A_DAY;
    if (Number.isFinite(age) && age > input.paymentMaxAgeDays) {
      failures.push({
        code: "too_old",
        expected: input.paymentMaxAgeDays,
        found: Math.floor(age),
      });
    }
  }

  return {
    decision: failures.length === 0 ? "pending_confirmation" : "rejected_auto",
    failures,
    reference,
  };
}
