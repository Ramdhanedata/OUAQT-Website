import { describe, expect, it } from "vitest";
import { LICENCE_PLANS } from "@/builder/payment/pricing";
import { shownPrice } from "./pricing";

/*
 * What the marketing pages show when settings cannot be read: the decided
 * figures, and "coming soon" for a length only settings price.
 */
describe("a price on the marketing pages, with no settings", () => {
  it("shows the decided year and six months", () => {
    expect(shownPrice("annual", null, true).amount).toBe(1500000);
    expect(shownPrice("semiannual", null, false).amount).toBe(900000);
  });

  it("shows Adel's month, two months, extra device and visit, one price each", () => {
    expect(shownPrice("monthly", null, true)).toEqual({ plan: "monthly", amount: 130000, standard: 130000, launch: false });
    expect(shownPrice("bimonthly", null, false).amount).toBe(260000);
    expect(shownPrice("extra_device", null, true)).toEqual({ plan: "extra_device", amount: 300000, standard: 300000, launch: false });
    expect(shownPrice("setup_visit", null, true).amount).toBe(500000);
  });

  it("shows three months at 3 500 and two at 2 300 for launch, 3 900 and 2 600 standard (Adel, 2026-11-13)", () => {
    expect(shownPrice("quarterly", null, true)).toEqual({ plan: "quarterly", amount: 350000, standard: 390000, launch: true });
    expect(shownPrice("bimonthly", null, true)).toEqual({ plan: "bimonthly", amount: 230000, standard: 260000, launch: true });
    expect(shownPrice("quarterly", null, false).amount).toBe(390000);
  });

  it("covers every length a licence is paid for", () => {
    for (const plan of LICENCE_PLANS) expect(shownPrice(plan, null, false).plan).toBe(plan);
  });
});
