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
 * and say so.
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

/** What was sent beyond the price of what a confirmed payment bought. */
export function overpaid(payment: PaymentFacts): number {
  if (payment.status !== "confirmed" || payment.read == null) return 0;
  return Math.max(0, payment.read - payment.expected);
}

/** What is still owed back to the owner: nothing once staff said it was sent. */
export function refundOwed(payment: PaymentFacts): number {
  return payment.refunded != null ? 0 : overpaid(payment);
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

export function summaryOf(payments: (PaymentFacts & { createdAt: string })[], now: Date): PaymentSummary {
  const summary: PaymentSummary = { monthCount: 0, monthAmount: 0, allAmount: 0, toHandle: 0, refundCount: 0, refundAmount: 0 };
  for (const payment of payments) {
    if (needsAPerson(payment)) summary.toHandle += 1;
    const owed = refundOwed(payment);
    if (owed > 0) {
      summary.refundCount += 1;
      summary.refundAmount += owed;
    }
    if (payment.status !== "confirmed") continue;
    summary.allAmount += payment.expected;
    if (sameMonth(payment.createdAt, now)) {
      summary.monthCount += 1;
      summary.monthAmount += payment.expected;
    }
  }
  return summary;
}
