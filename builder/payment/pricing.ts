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

export type Plan = "annual" | "semiannual" | "quarterly" | "perpetual" | "extra_device" | "setup_visit";

export type Price = {
  plan: Plan;
  /** Null when the price has not been set yet. The page then says so. */
  amount: number | null;
  /** What the same thing costs outside the launch offer, for the struck price. */
  standard: number | null;
  launch: boolean;
};

export function priceFor(
  plan: Plan,
  settings: PublicSettings,
  launchClient: boolean
): Price {
  const pair = (launchKey: keyof PublicSettings, standardKey: keyof PublicSettings) => {
    const standard = settings[standardKey] as number | null;
    const launch = settings[launchKey] as number | null;
    return {
      amount: launchClient ? (launch ?? standard) : standard,
      standard,
    };
  };

  switch (plan) {
    case "annual": {
      const { amount, standard } = pair("price_annual_launch_mru", "price_annual_standard_mru");
      return { plan, amount, standard, launch: launchClient };
    }
    case "semiannual": {
      const { amount, standard } = pair("price_semiannual_launch_mru", "price_semiannual_standard_mru");
      return { plan, amount, standard, launch: launchClient };
    }
    case "quarterly":
      /* No launch price on the quarterly option: it is the standard one only. */
      return {
        plan,
        amount: settings.price_quarterly_standard_mru,
        standard: settings.price_quarterly_standard_mru,
        launch: false,
      };
    case "perpetual": {
      const { amount, standard } = pair("price_perpetual_launch_mru", "price_perpetual_standard_mru");
      return { plan, amount, standard, launch: launchClient };
    }
    case "extra_device": {
      const { amount, standard } = pair(
        "price_extra_device_launch_mru",
        "price_extra_device_standard_mru"
      );
      return { plan, amount, standard, launch: launchClient };
    }
    case "setup_visit":
      return {
        plan,
        amount: settings.price_setup_visit_mru,
        standard: settings.price_setup_visit_mru,
        launch: false,
      };
  }
}

/** What an owner thinks in: the yearly price divided by twelve. */
export { perMonth as monthlyEquivalent } from "@/app-ui/money";

/* How many months a licence plan buys, for what it costs a month. Null where it does not renew. */
export const MONTHS_OF: Partial<Record<Plan, number>> = {
  annual: 12, // not-a-rule: a year
  semiannual: 6, // not-a-rule: half a year
  quarterly: 3, // not-a-rule: a quarter
};

/** A plan's price said per month, rounded to the smallest unit. */
export function perMonthOf(plan: Plan, amount: number): number | null {
  const months = MONTHS_OF[plan];
  return months ? Math.round(amount / months) : null;
}

/*
 * What the payment page offers: a year, and six months, each at its price.
 * A length whose price is not set is not offered.
 */
export function licenceChoices(settings: PublicSettings, launchClient: boolean): Price[] {
  return (["annual", "semiannual"] as const)
    .map((plan) => priceFor(plan, settings, launchClient))
    .filter((price) => price.amount != null);
}
