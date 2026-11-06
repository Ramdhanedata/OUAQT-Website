import { describe, expect, it } from "vitest";
import type { PublicSettings } from "@/builder/db/settings";
import {
  isLicencePlan,
  LICENCE_PLANS,
  licenceChoices,
  monthlyEquivalent,
  monthsOf,
  perMonthOf,
  planPaidFor,
  priceFor,
  refundFor,
} from "./pricing";

/* Amounts as the database now holds them: the smallest unit. */
const settings = {
  trial_days: 14,
  renewal_grace_days: 30,
  max_devices: 2,
  support_whatsapp: "22226406568",
  price_installation_builder_mru: 0,
  price_annual_launch_mru: 1500000,
  price_annual_standard_mru: 1800000,
  price_quarterly_standard_mru: 450000,
  price_semiannual_launch_mru: 750000,
  price_semiannual_standard_mru: 900000,
  /* As 0035 leaves them: nobody has decided these yet. */
  price_quarterly_launch_mru: null,
  price_bimonthly_launch_mru: null,
  price_bimonthly_standard_mru: null,
  price_monthly_launch_mru: null,
  price_monthly_standard_mru: null,
  price_setup_visit_mru: 1000000,
  price_extra_device_launch_mru: 600000,
  price_extra_device_standard_mru: 800000,
  price_installation_launch_mru: 2500000,
  price_installation_standard_mru: 3000000,
  price_perpetual_launch_mru: 9500000,
  price_perpetual_standard_mru: 11000000,
  bespoke_maintenance_percent: 18,
  bespoke_maintenance_from_month: 13,
  launch_clients_limit: 100,
  launch_price_freeze_years: 3,
  referral_free_months: 1,
  tutorial_video_windows_url: "",
  tutorial_video_mac_url: "",
  installer_url_windows_pharmacy: "",
  installer_url_mac_pharmacy: "",
  installer_url_windows_bakery: "",
  installer_url_mac_bakery: "",
  installer_url_windows_restaurant: "",
  installer_url_mac_restaurant: "",
  installer_url_windows_warehouse: "",
  installer_url_mac_warehouse: "",
  installer_url_windows_shop: "",
  installer_url_mac_shop: "",
  installer_url_windows_hotel: "",
  installer_url_mac_hotel: "",
  installer_url_windows_transport: "",
  installer_url_mac_transport: "",
  installer_url_windows_wash: "",
  installer_url_mac_wash: "",
  installer_url_windows_general: "",
  installer_url_mac_general: "",
} satisfies PublicSettings;

describe("what an owner owes", () => {
  it("charges a launch client the launch price, and shows the other one", () => {
    expect(priceFor("annual", settings, true)).toEqual({
      plan: "annual",
      amount: 1500000,
      standard: 1800000,
      launch: true,
    });
  });

  it("charges everyone else the standard price", () => {
    expect(priceFor("annual", settings, false).amount).toBe(1800000);
  });

  it("prices six months at half the year, launch and standard", () => {
    expect(priceFor("semiannual", settings, true)).toEqual({ plan: "semiannual", amount: 750000, standard: 900000, launch: true });
    expect(priceFor("semiannual", settings, false).amount).toBe(900000);
  });

  it("says each renewing plan per month, and nothing for the others", () => {
    expect(perMonthOf("annual", 1800000)).toBe(150000);
    expect(perMonthOf("semiannual", 900000)).toBe(150000);
    expect(perMonthOf("perpetual", 11000000)).toBeNull();
  });

  it("offers no six months when its price is not set", () => {
    expect(priceFor("semiannual", { ...settings, price_semiannual_launch_mru: null, price_semiannual_standard_mru: null }, true).amount).toBeNull();
  });

  it("has no launch price for three months until one is set", () => {
    expect(priceFor("quarterly", settings, true).amount).toBe(450000);
    expect(priceFor("quarterly", settings, true).launch).toBe(false);
  });

  it("prices an extra computer and a perpetual licence the same way", () => {
    expect(priceFor("extra_device", settings, true).amount).toBe(600000);
    expect(priceFor("extra_device", settings, false).amount).toBe(800000);
    expect(priceFor("perpetual", settings, true).amount).toBe(9500000);
    expect(priceFor("perpetual", settings, false).amount).toBe(11000000);
  });

  it("says nothing rather than guessing when a price is unset", () => {
    const unpriced = { ...settings, price_annual_standard_mru: null, price_annual_launch_mru: null };
    expect(priceFor("annual", unpriced, false).amount).toBeNull();
  });

  it("falls back to the standard price if a launch price was never set", () => {
    const partial = { ...settings, price_annual_launch_mru: null };
    expect(priceFor("annual", partial, true).amount).toBe(1800000);
  });

  it("works out the monthly figure an owner compares against", () => {
    expect(monthlyEquivalent(1800000)).toBe(150000);
    expect(monthlyEquivalent(1500000)).toBe(125000);
  });
});

/* Every length priced, as the admin might set them: invented figures for the test only. */
const allPriced = {
  ...settings,
  price_quarterly_launch_mru: 400000,
  price_bimonthly_launch_mru: 280000,
  price_bimonthly_standard_mru: 320000,
  price_monthly_launch_mru: 150000,
  price_monthly_standard_mru: 170000,
} satisfies PublicSettings;

describe("the lengths a licence is paid for", () => {
  it("are a year, six months, three, two and one, longest first", () => {
    expect(LICENCE_PLANS).toEqual(["annual", "semiannual", "quarterly", "bimonthly", "monthly"]);
    expect(LICENCE_PLANS.map(monthsOf)).toEqual([12, 6, 3, 2, 1]);
  });

  it("buy no months for what does not renew", () => {
    expect(monthsOf("perpetual")).toBeNull();
    expect(monthsOf("setup_visit")).toBeNull();
    expect(monthsOf("nonsense")).toBeNull();
  });

  it("are told apart from the other things that are paid for", () => {
    expect(isLicencePlan("monthly")).toBe(true);
    expect(isLicencePlan("bimonthly")).toBe(true);
    expect(isLicencePlan("perpetual")).toBe(false);
    expect(isLicencePlan(null)).toBe(false);
  });

  it("each read their price from settings, launch and standard", () => {
    expect(priceFor("monthly", allPriced, true)).toEqual({ plan: "monthly", amount: 150000, standard: 170000, launch: true });
    expect(priceFor("monthly", allPriced, false)).toEqual({ plan: "monthly", amount: 170000, standard: 170000, launch: false });
    expect(priceFor("bimonthly", allPriced, true).amount).toBe(280000);
    expect(priceFor("bimonthly", allPriced, false).amount).toBe(320000);
    expect(priceFor("quarterly", allPriced, true)).toEqual({ plan: "quarterly", amount: 400000, standard: 450000, launch: true });
  });

  it("have no price while settings hold none, so nothing is invented", () => {
    expect(priceFor("monthly", settings, true).amount).toBeNull();
    expect(priceFor("bimonthly", settings, false).amount).toBeNull();
  });

  it("charge a launch client the standard price when there is no launch price, and do not call it one", () => {
    const standardOnly = { ...allPriced, price_monthly_launch_mru: null };
    expect(priceFor("monthly", standardOnly, true)).toEqual({ plan: "monthly", amount: 170000, standard: 170000, launch: false });
  });

  it("are offered only when priced, longest first", () => {
    expect(licenceChoices(settings, true).map((one) => one.plan)).toEqual(["annual", "semiannual", "quarterly"]);
    expect(licenceChoices(allPriced, true).map((one) => one.plan)).toEqual(LICENCE_PLANS);
    expect(licenceChoices(allPriced, true).every((one) => one.amount != null)).toBe(true);
  });

  it("are each said per month", () => {
    expect(perMonthOf("quarterly", 450000)).toBe(150000);
    expect(perMonthOf("bimonthly", 320000)).toBe(160000);
    expect(perMonthOf("monthly", 170000)).toBe(170000);
  });
});

describe("the length an amount paid for, among all five", () => {
  const offered = licenceChoices(allPriced, true);

  it("is the length whose price was sent", () => {
    expect(planPaidFor(150000, offered)?.plan).toBe("monthly");
    expect(planPaidFor(280000, offered)?.plan).toBe("bimonthly");
    expect(planPaidFor(400000, offered)?.plan).toBe("quarterly");
    expect(planPaidFor(750000, offered)?.plan).toBe("semiannual");
    expect(planPaidFor(1500000, offered)?.plan).toBe("annual");
  });

  it("is the longest one covered between two prices, the rest owed back", () => {
    expect(planPaidFor(200000, offered)?.plan).toBe("monthly");
    expect(refundFor(200000, planPaidFor(200000, offered))).toBe(50000);
    expect(planPaidFor(500000, offered)?.plan).toBe("quarterly");
    expect(planPaidFor(1499900, offered)?.plan).toBe("semiannual");
  });

  it("is nothing below a month's price", () => {
    expect(planPaidFor(149900, offered)).toBeNull();
  });

  it("goes to the longer of two lengths at the same price", () => {
    const same = licenceChoices({ ...allPriced, price_monthly_launch_mru: 280000 }, true);
    expect(planPaidFor(280000, same)?.plan).toBe("bimonthly");
  });
});

describe("the length an amount paid for, between a year and six months", () => {
  /* Only the two lengths offered before 2026-11-06. */
  const offered = licenceChoices({ ...settings, price_quarterly_standard_mru: null }, true);

  it("is the year for the year's price and six months for the half year's", () => {
    expect(planPaidFor(1500000, offered)?.plan).toBe("annual");
    expect(planPaidFor(750000, offered)?.plan).toBe("semiannual");
  });

  it("is six months between the two prices, and a year above the year's", () => {
    expect(planPaidFor(1000000, offered)?.plan).toBe("semiannual");
    expect(planPaidFor(1499900, offered)?.plan).toBe("semiannual");
    expect(planPaidFor(1800000, offered)?.plan).toBe("annual");
  });

  it("is nothing below the smallest price, or when the amount could not be read", () => {
    expect(planPaidFor(749900, offered)).toBeNull();
    expect(planPaidFor(null, offered)).toBeNull();
  });

  it("owes back what was sent beyond the price of what it bought", () => {
    expect(refundFor(1000000, planPaidFor(1000000, offered))).toBe(250000);
    expect(refundFor(1800000, planPaidFor(1800000, offered))).toBe(300000);
    expect(refundFor(1500000, planPaidFor(1500000, offered))).toBe(0);
    expect(refundFor(null, null)).toBe(0);
  });
});
