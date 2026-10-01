import type { InsurancePayer } from "./config";
import { coveredPart, type Minor } from "./money";

/*
 * A sale a health fund pays part of.
 *
 * The till fills one in when the cashier picks a fund, the receipt prints it,
 * and the desktop app keeps it with the sale so the pharmacy can claim the
 * fund's part at the end of the month. Only pharmacies that said they are
 * conventionnée ever see one; for everybody else a sale has no cover and
 * nothing here runs.
 */
export type Cover = {
  payer: InsurancePayer;
  /** The insured person's number, from his card. The fund checks every claim against it. */
  memberNumber: string;
  /** The share the fund pays, in whole percent, as the cashier left it for this sale. */
  share: number;
  /** What the fund pays, in the smallest unit. The customer pays the total less this. */
  covered: Minor;
};

/** A cover for this total, the fund's part worked out once and kept. */
export function coverFor(
  total: Minor,
  payer: InsurancePayer,
  memberNumber: string,
  share: number
): Cover {
  return { payer, memberNumber: memberNumber.trim(), share, covered: coveredPart(total, share) };
}

/** What the customer hands over: the whole total without a cover, his part with one. */
export function customerPays(total: Minor, cover?: Cover | null): Minor {
  return cover ? Math.max(0, total - cover.covered) : total;
}
