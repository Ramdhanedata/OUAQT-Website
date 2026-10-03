/*
 * Where a payment stands, in the words staff use for it, worked out from its
 * row every time rather than stored: a status somebody forgot to update is
 * how a refund goes unpaid.
 *
 *   pending                 waiting for a person: the screenshot could not
 *                           be read, or the setting asks for one
 *   confirmed_auto          the screenshot matched and the licence opened at
 *                           once; nobody has looked yet
 *   confirmed_auto_checked  the same, looked at and kept
 *   confirmed               confirmed by a person
 *   rejected_auto           refused on sight: the screenshot showed something
 *                           else than a payment to OUAQT, today, at a price
 *   rejected_manual         refused by a person
 *   undone                  confirmed automatically, then undone by a person
 *
 * And what is owed back: a payment by serial takes any amount from the
 * smallest price up and buys the longest length it covers (2026-10-03), so
 * what was sent beyond that price is the owner's until staff send it back
 * and say so. One refused only because it was less than the smallest price
 * bought nothing, and the page told the owner to ask for it back: all of it
 * is owed. Refused for anything else (another number, another day, a
 * screenshot used before), nothing is: it may not be a payment to us at all.
 */

export const PAYMENT_FILTERS = ["pending", "confirmed", "refund", "refused", "undone"] as const;
export type PaymentFilter = (typeof PAYMENT_FILTERS)[number];

export function isPaymentFilter(value: unknown): value is PaymentFilter {
  return typeof value === "string" && (PAYMENT_FILTERS as readonly string[]).includes(value);
}

export type PaymentState =
  | "pending"
  | "confirmed_auto"
  | "confirmed_auto_checked"
  | "confirmed"
  | "rejected_auto"
  | "rejected_manual"
  | "undone";

export type PaymentFacts = {
  status: string;
  autoConfirmed: boolean;
  reviewedAt: string | null;
  /* The price of what it bought, minor units. */
  expected: number;
  /* What the screenshot showed was sent, minor units; null when it was not read. */
  read: number | null;
  /* What staff said they sent back, when they did. */
  refunded: number | null;
  /* The checks the screenshot failed when it was filed, by code. */
  failures: string[];
};

export function stateOf(payment: PaymentFacts): PaymentState {
  if (payment.status === "confirmed") {
    if (!payment.autoConfirmed) return "confirmed";
    return payment.reviewedAt ? "confirmed_auto_checked" : "confirmed_auto";
  }
  if (payment.status === "rejected_auto") return "rejected_auto";
  if (payment.status === "rejected_manual") return payment.autoConfirmed ? "undone" : "rejected_manual";
  return "pending";
}

/** Whether it was refused for being too little, and for nothing else. */
export function refusedAsTooLittle(payment: PaymentFacts): boolean {
  return payment.status === "rejected_auto" && payment.failures.length > 0 && payment.failures.every((code) => code === "amount_too_low");
}

/*
 * What the owner is owed back for it, whether or not it was sent yet: what
 * a confirmed payment sent beyond its price, or all of one refused as too
 * little.
 */
export function owedBack(payment: PaymentFacts): number {
  if (payment.read == null) return 0;
  if (payment.status === "confirmed") return Math.max(0, payment.read - payment.expected);
  if (refusedAsTooLittle(payment)) return payment.read;
  return 0;
}

/** What is still owed back to the owner: nothing once staff said it was sent. */
export function refundOwed(payment: PaymentFacts): number {
  return payment.refunded != null ? 0 : owedBack(payment);
}

/** Whether a person still has something to do about it. */
export function needsAPerson(payment: PaymentFacts): boolean {
  const state = stateOf(payment);
  return state === "pending" || state === "confirmed_auto";
}

export function matchesFilter(filter: PaymentFilter, payment: PaymentFacts): boolean {
  const state = stateOf(payment);
  switch (filter) {
    case "pending":
      return state === "pending";
    case "confirmed":
      return state === "confirmed" || state === "confirmed_auto" || state === "confirmed_auto_checked";
    case "refund":
      return refundOwed(payment) > 0;
    case "refused":
      return state === "rejected_auto" || state === "rejected_manual";
    case "undone":
      return state === "undone";
  }
}

export type PaymentSummary = {
  /* Confirmed this calendar month: how many, and what they paid for, at their prices. */
  monthCount: number;
  monthAmount: number;
  /* Every confirmed payment, at its price: the same sum as the statistics' "received". */
  allAmount: number;
  /* Waiting for a person, or confirmed alone and not looked at yet. */
  toHandle: number;
  /* Owed back, and to how many owners. */
  refundCount: number;
  refundAmount: number;
};

/* Months as Mauritania counts them: it keeps UTC all year. */
function sameMonth(iso: string, now: Date): boolean {
  const at = new Date(iso);
  return at.getUTCFullYear() === now.getUTCFullYear() && at.getUTCMonth() === now.getUTCMonth();
}

/*
 * The figures. What came in is added up from every confirmed payment when
 * they are given (the list itself holds only the newest), so the sum since
 * the start is the statistics' own; what is left to handle and to refund
 * comes from the list.
 */
export function summaryOf(
  payments: (PaymentFacts & { createdAt: string })[],
  now: Date,
  confirmed: { expected: number; createdAt: string }[] = payments.filter((one) => one.status === "confirmed")
): PaymentSummary {
  const summary: PaymentSummary = { monthCount: 0, monthAmount: 0, allAmount: 0, toHandle: 0, refundCount: 0, refundAmount: 0 };
  for (const payment of payments) {
    if (needsAPerson(payment)) summary.toHandle += 1;
    const owed = refundOwed(payment);
    if (owed > 0) {
      summary.refundCount += 1;
      summary.refundAmount += owed;
    }
  }
  for (const payment of confirmed) {
    summary.allAmount += payment.expected;
    if (sameMonth(payment.createdAt, now)) {
      summary.monthCount += 1;
      summary.monthAmount += payment.expected;
    }
  }
  return summary;
}
