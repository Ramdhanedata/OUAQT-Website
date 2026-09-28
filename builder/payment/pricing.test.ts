import { describe, expect, it } from "vitest";
import type { PublicSettings } from "@/builder/db/settings";
import { monthlyEquivalent, perMonthOf, priceFor } from "./pricing";

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

  it("has no launch price for the quarterly option", () => {
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
