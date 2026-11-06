import type { PublicSettings } from "@/builder/db/settings";

/*
 * What this owner owes, and why it is that number.
 *
 * Two prices exist for most things: what the first clients pay while the
 * launch offer is open, and what it costs afterwards. Which one applies to a
 * business is decided when the business is created and then kept, because
 * working it out again later from a count would move an owner's price under
 * him as other people sign up.
 *
 * not-a-rule-file: every number below arrives from the settings table.
 */

/*
 * The lengths a licence can be paid for, longest first, and how many months
 * each buys. These are what the words mean rather than prices anybody
 * administers: a year is twelve months. Adel, 2026-11-06: a month, two
 * months, three, six, or a year, each at its own price from settings.
 *
 * Longest first because that is the order they are offered in: the year
 * leads, and it is what a payment is filed as when its amount cannot say.
 */
export const LICENCE_LENGTHS = [
  { plan: "annual", months: 12 }, // not-a-rule: a year
  { plan: "semiannual", months: 6 }, // not-a-rule: half a year
  { plan: "quarterly", months: 3 }, // not-a-rule: a quarter
  { plan: "bimonthly", months: 2 }, // not-a-rule: two months
  { plan: "monthly", months: 1 }, // not-a-rule: a month
] as const;

/** A length of licence time, paid for and renewed. */
export type LicencePlan = (typeof LICENCE_LENGTHS)[number]["plan"];

export const LICENCE_PLANS = LICENCE_LENGTHS.map((one) => one.plan) as [LicencePlan, ...LicencePlan[]];

export function isLicencePlan(plan: unknown): plan is LicencePlan {
  return typeof plan === "string" && (LICENCE_PLANS as string[]).includes(plan);
}

export type Plan = LicencePlan | "perpetual" | "extra_device" | "setup_visit";

export type Price = {
  plan: Plan;
  /** Null when the price has not been set yet. The page then says so. */
  amount: number | null;
  /** What the same thing costs outside the launch offer, for the struck price. */
  standard: number | null;
  launch: boolean;
};

/*
 * Where each price lives in settings: a launch price beside the standard
 * one. The setup visit has no launch price. Three months had none before
 * 2026-11-06 either; its launch row starts empty, like the new lengths'.
 */
const PRICE_KEYS: Record<Plan, { launch: keyof PublicSettings | null; standard: keyof PublicSettings }> = {
  annual: { launch: "price_annual_launch_mru", standard: "price_annual_standard_mru" },
  semiannual: { launch: "price_semiannual_launch_mru", standard: "price_semiannual_standard_mru" },
  quarterly: { launch: "price_quarterly_launch_mru", standard: "price_quarterly_standard_mru" },
  bimonthly: { launch: "price_bimonthly_launch_mru", standard: "price_bimonthly_standard_mru" },
  monthly: { launch: "price_monthly_launch_mru", standard: "price_monthly_standard_mru" },
  perpetual: { launch: "price_perpetual_launch_mru", standard: "price_perpetual_standard_mru" },
  extra_device: { launch: "price_extra_device_launch_mru", standard: "price_extra_device_standard_mru" },
  setup_visit: { launch: null, standard: "price_setup_visit_mru" },
};

/*
 * A launch client pays the launch price when there is one, and the standard
 * price when there is not: an empty launch row is not a free licence. The
 * price is only called a launch price when it is one.
 */
export function priceFor(
  plan: Plan,
  settings: PublicSettings,
  launchClient: boolean
): Price {
  const keys = PRICE_KEYS[plan];
  const standard = (settings[keys.standard] as number | null | undefined) ?? null;
  const launch = keys.launch ? ((settings[keys.launch] as number | null | undefined) ?? null) : null;
  const atLaunch = launchClient && launch != null;
  return { plan, amount: atLaunch ? launch : standard, standard, launch: atLaunch };
}

/** What an owner thinks in: the yearly price divided by twelve. */
export { perMonth as monthlyEquivalent } from "@/app-ui/money";

/* How many months a plan buys, for what it costs a month. Null where it does not renew. */
export function monthsOf(plan: string): number | null {
  return LICENCE_LENGTHS.find((one) => one.plan === plan)?.months ?? null;
}

/** A plan's price said per month, rounded to the smallest unit. */
export function perMonthOf(plan: Plan, amount: number): number | null {
  const months = monthsOf(plan);
  return months ? Math.round(amount / months) : null;
}

/*
 * What the payment page offers: every length whose price is set, longest
 * first, each at its price. A length whose price is not set is not offered:
 * a price nobody has decided is how a refund conversation starts.
 */
export function licenceChoices(settings: PublicSettings, launchClient: boolean): Price[] {
  return LICENCE_PLANS.map((plan) => priceFor(plan, settings, launchClient)).filter(
    (price) => price.amount != null
  );
}

/*
 * Which length an amount paid for, among the ones on offer: the screenshot
 * says how much he sent, and that alone says how long he bought (Adel,
 * 2026-10-03). The longest one it covers: between the three months' price
 * and the six months' it is three months, above the year's it is a year,
 * and what was sent beyond that price is his to get back (see refundFor).
 * Below the smallest price it buys nothing, and he is told so. Two lengths
 * at the same price go to the longer, which comes first.
 */
export function planPaidFor(amount: number | null, prices: Price[]): Price | null {
  if (amount == null) return null;
  let best: Price | null = null;
  for (const one of prices) {
    if (one.amount == null || one.amount > amount) continue;
    if (!best || (best.amount ?? 0) < one.amount) best = one;
  }
  return best;
}

/** What was sent beyond the price of what it bought, in minor units: OUAQT owes it back. */
export function refundFor(amount: number | null, price: Price | null): number {
  if (amount == null || price?.amount == null) return 0;
  return Math.max(0, amount - price.amount);
}
