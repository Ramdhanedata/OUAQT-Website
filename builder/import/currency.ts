import type { Pack } from "@/app-ui/packs";
import { text } from "./normalise";

/*
 * Old ouguiyas.
 *
 * Mauritania changed currency in 2018: one new ouguiya for ten old ones. Many
 * shops still keep a price list in the old money, and plenty of people still
 * say "UM" for both. A file whose prices are ten times too high is not an
 * error to correct quietly; it is a question to ask.
 *
 * Nothing here ever converts anything. It decides whether to ask, and the
 * owner decides the rest, after seeing a few of his own prices converted.
 *
 * not-a-rule-file: the thresholds below decide when to ask a question, and
 * nothing else. No money is computed from them.
 */

/** Said out loud, "UM" means both currencies, so the word alone only raises the question. */
const OLD_WORDS = /\b(um|ouguiyas?\s+anciennes?|anciennes?\s+ouguiyas?)\b|أوقية\s*قديمة/i;

/**
 * A median price above this, for this trade, is worth asking about.
 *
 * A pharmacy sells things costing tens or hundreds of new ouguiyas; a
 * warehouse sells sacks and cases, and four figures there is ordinary. The
 * numbers are deliberately generous: the cost of asking is one screen, the
 * cost of not asking is a shop whose prices are all ten times wrong.
 */
const SUSPICIOUS_MEDIAN: Record<Pack, number> = {
  pharmacy: 5_000,
  bakery: 2_000,
  restaurant: 5_000,
  warehouse: 100_000,
};
/* These are read against prices as written in the file, in whole ouguiyas,
   before anything is converted to the smallest unit. */

export function mentionsOldMoney(header: string, samples: unknown[]): boolean {
  if (OLD_WORDS.test(header)) return true;
  return samples.some((cell) => OLD_WORDS.test(text(cell)));
}

export function median(values: number[]): number | null {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export type CurrencyDoubt = {
  ask: boolean;
  why: "said_um" | "prices_high" | null;
  median: number | null;
};

export function currencyDoubt(input: {
  pack: Pack;
  priceHeader: string;
  priceCells: unknown[];
  prices: number[];
}): CurrencyDoubt {
  const middle = median(input.prices);

  if (mentionsOldMoney(input.priceHeader, input.priceCells)) {
    return { ask: true, why: "said_um", median: middle };
  }

  if (middle != null && middle > SUSPICIOUS_MEDIAN[input.pack]) {
    return { ask: true, why: "prices_high", median: middle };
  }

  return { ask: false, why: null, median: middle };
}

/** One old ouguiya is a tenth of a new one. Applied only after he says so. */
export function toNewOuguiya(price: number): number {
  const OLD_PER_NEW = 10; // not-a-rule: the 2018 redenomination, a fact
  return price / OLD_PER_NEW;
}
