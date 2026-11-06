import { describe, expect, it } from "vitest";
import { LICENCE_PLANS } from "@/builder/payment/pricing";
import { shownPrice } from "./pricing";

/*
 * What the marketing pages show when settings cannot be read: the decided
 * year and six months, and "coming soon" for every length nobody has priced.
 */
describe("a price on the marketing pages, with no settings", () => {
  it("shows the decided year and six months", () => {
    expect(shownPrice("annual", null, true).amount).toBe(1500000);
    expect(shownPrice("semiannual", null, false).amount).toBe(900000);
  });

  it("invents nothing for a month, two months or three", () => {
    for (const plan of ["quarterly", "bimonthly", "monthly"] as const) {
      expect(shownPrice(plan, null, true)).toEqual({ plan, amount: null, standard: null, launch: false });
    }
  });

  it("covers every length a licence is paid for", () => {
    for (const plan of LICENCE_PLANS) expect(shownPrice(plan, null, false).plan).toBe(plan);
  });
});
