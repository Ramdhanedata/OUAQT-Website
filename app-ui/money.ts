/*
 * Money, as whole numbers.
 *
 * Every amount in the builder, the database and the desktop app is an integer
 * of the smallest unit: 1 MRU is 100. Nothing is ever a float, because
 * 0.1 + 0.2 is not 0.3 and a till that is out by a hundredth on every sale is
 * out by a lot by December.
 *
 * This file is shared with the desktop app, so there is one rule rather than
 * two that agree until they do not.
 *
 * not-a-rule-file: a unit of currency, not a price anybody sets.
 */

const MINOR_PER_MAJOR = 100;

/** An integer number of the smallest unit. 12050 is 120,50 MRU. */
export type Minor = number;

/** From what a person types or a spreadsheet holds, to what we store. */
export function toMinor(major: number): Minor {
  return Math.round(major * MINOR_PER_MAJOR);
}

/** Back again, for a formatter that wants ouguiyas. Display only. */
export function toMajor(minor: Minor): number {
  return minor / MINOR_PER_MAJOR;
}

export function sum(amounts: Minor[]): Minor {
  return amounts.reduce((total, amount) => total + amount, 0);
}

/** A line total: the quantity may be fractional, the price never is. */
export function lineTotal(quantity: number, unitPrice: Minor): Minor {
  return Math.round(quantity * unitPrice);
}

const PERCENT = 100;

/** A fund's share as the cashier typed it, kept to a whole percent from 0 to 100. */
export function clampShare(share: number): number {
  if (!Number.isFinite(share)) return 0;
  return Math.min(PERCENT, Math.max(0, Math.round(share)));
}

/*
 * What a health fund pays on a sale, from the share it covers.
 *
 * Rounded to the smallest unit once, here, and the customer pays whatever is
 * left: the two parts always add up to the total, so the drawer and the claim
 * to the fund can never disagree by a rounding.
 */
export function coveredPart(total: Minor, share: number): Minor {
  return Math.min(total, Math.round((total * clampShare(share)) / PERCENT));
}

/** What to hand back, never negative. */
export function change(given: Minor, due: Minor): Minor {
  return Math.max(0, given - due);
}

/** A yearly price said the way an owner thinks about it, still an integer. */
export function perMonth(annual: Minor): Minor {
  const MONTHS = 12; // not-a-rule: a year has twelve months
  return Math.round(annual / MONTHS);
}

/*
 * Old ouguiyas: one new for ten old. Applied only after the owner has said
 * that is what his prices are in.
 */
export function fromOldOuguiya(minor: Minor): Minor {
  const OLD_PER_NEW = 10; // not-a-rule: the 2018 redenomination, a fact
  return Math.round(minor / OLD_PER_NEW);
}
