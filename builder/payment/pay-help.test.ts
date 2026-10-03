import { describe, expect, it } from "vitest";
import type { PrivateSettings } from "@/builder/db/private-settings";
import type { PublicSettings } from "@/builder/db/settings";
import { payHelpFor } from "./pay-help";

/* Only the settings this reads. Amounts in the smallest unit. */
const settings = {
  price_annual_launch_mru: 1500000,
  price_annual_standard_mru: 1800000,
  price_semiannual_launch_mru: 750000,
  price_semiannual_standard_mru: 900000,
} as unknown as PublicSettings;

const secrets = {
  bankily_number: "38087272",
  masrvi_number: "",
  click_number: " 38087272 ",
} as unknown as PrivateSettings;

describe("how to pay, sent with the licence", () => {
  it("names each app that has a number, in both scripts", () => {
    expect(payHelpFor(settings, secrets, false).payTo).toEqual([
      { app: "bankily", name: "Bankily", nameArabic: "بنكيلي", number: "38087272" },
      { app: "click", name: "Click", nameArabic: "كليك", number: "38087272" },
    ]);
  });

  it("gives the year and the six months at this shop's own price", () => {
    expect(payHelpFor(settings, secrets, false).prices).toEqual([
      { plan: "annual", amount: 1800000 },
      { plan: "semiannual", amount: 900000 },
    ]);
    expect(payHelpFor(settings, secrets, true).prices).toEqual([
      { plan: "annual", amount: 1500000 },
      { plan: "semiannual", amount: 750000 },
    ]);
  });

  it("leaves out a price that is not set rather than sending nothing as zero", () => {
    const unset = { ...settings, price_semiannual_standard_mru: null } as unknown as PublicSettings;
    expect(payHelpFor(unset, secrets, false).prices).toEqual([{ plan: "annual", amount: 1800000 }]);
  });
});
