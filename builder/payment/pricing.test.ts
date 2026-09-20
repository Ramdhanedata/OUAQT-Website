import { describe, expect, it } from "vitest";
import type { PublicSettings } from "@/builder/db/settings";
import { monthlyEquivalent, priceFor } from "./pricing";

const settings = {
  trial_days: 14,
  renewal_grace_days: 30,
  max_devices: 2,
  enabled_packs: ["pharmacy"],
  support_whatsapp: "22226406568",
  price_installation_builder_mru: 0,
  price_annual_launch_mru: 15000,
  price_annual_standard_mru: 18000,
  price_quarterly_standard_mru: 4500,
  price_setup_visit_mru: 10000,
  price_extra_device_launch_mru: 6000,
  price_extra_device_standard_mru: 8000,
  price_installation_launch_mru: 25000,
  price_installation_standard_mru: 30000,
  price_perpetual_launch_mru: 95000,
  price_perpetual_standard_mru: 110000,
  bespoke_maintenance_percent: 18,
  bespoke_maintenance_from_month: 13,
  launch_clients_limit: 100,
  launch_price_freeze_years: 3,
  referral_free_months: 1,
  tutorial_video_windows_url: "",
  tutorial_video_mac_url: "",
} satisfies PublicSettings;

describe("what an owner owes", () => {
  it("charges a launch client the launch price, and shows the other one", () => {
    expect(priceFor("annual", settings, true)).toEqual({
      plan: "annual",
      amount: 15000,
      standard: 18000,
      launch: true,
    });
  });

  it("charges everyone else the standard price", () => {
    expect(priceFor("annual", settings, false).amount).toBe(18000);
  });

  it("has no launch price for the quarterly option", () => {
    expect(priceFor("quarterly", settings, true).amount).toBe(4500);
    expect(priceFor("quarterly", settings, true).launch).toBe(false);
  });

  it("prices an extra computer and a perpetual licence the same way", () => {
    expect(priceFor("extra_device", settings, true).amount).toBe(6000);
    expect(priceFor("extra_device", settings, false).amount).toBe(8000);
    expect(priceFor("perpetual", settings, true).amount).toBe(95000);
    expect(priceFor("perpetual", settings, false).amount).toBe(110000);
  });

  it("says nothing rather than guessing when a price is unset", () => {
    const unpriced = { ...settings, price_annual_standard_mru: null, price_annual_launch_mru: null };
    expect(priceFor("annual", unpriced, false).amount).toBeNull();
  });

  it("falls back to the standard price if a launch price was never set", () => {
    const partial = { ...settings, price_annual_launch_mru: null };
    expect(priceFor("annual", partial, true).amount).toBe(18000);
  });

  it("works out the monthly figure an owner compares against", () => {
    expect(monthlyEquivalent(18000)).toBe(1500);
    expect(monthlyEquivalent(15000)).toBe(1250);
  });
});
