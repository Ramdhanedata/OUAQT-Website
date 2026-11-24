import { describe, expect, it } from "vitest";
import { decidePayment } from "./decide";
import type { Price } from "./pricing";

/* The five lengths, longest first as licenceChoices gives them, at launch prices in minor units. */
const offered: Price[] = [
  { plan: "annual", amount: 1_500_000, standard: 1_800_000, launch: true },
  { plan: "semiannual", amount: 750_000, standard: 900_000, launch: true },
  { plan: "quarterly", amount: 350_000, standard: 420_000, launch: true },
  { plan: "bimonthly", amount: 230_000, standard: 270_000, launch: true },
  { plan: "monthly", amount: 130_000, standard: 150_000, launch: true },
];
const numbers = [{ app: "bankily" as const, number: "38087272" }];
const base = {
  offered,
  chosenPlan: false,
  numbers,
  app: null,
  referenceAlreadyUsed: false,
  imageAlreadyUsed: false,
  now: new Date("2026-11-24T10:00:00Z"),
};

describe("the length picked on the pay page", () => {
  it("is what a payment is filed as when nothing could be read", () => {
    const { price, outcome } = decidePayment({ ...base, fallback: "monthly", extracted: null });
    expect(price.plan).toBe("monthly");
    expect(price.amount).toBe(130_000);
    /* Nothing is granted on it: it waits for a person. */
    expect(outcome.decision).toBe("pending_confirmation");
  });

  it("never outweighs an amount that was read", () => {
    const { price } = decidePayment({
      ...base,
      fallback: "monthly",
      extracted: { isReceipt: true, amountMru: 15000, recipient: "38087272", date: "2026-11-24", reference: "T1" },
    });
    expect(price.plan).toBe("annual");
  });

  it("leaves the old answer when none was sent", () => {
    const { price } = decidePayment({ ...base, extracted: null });
    expect(price.plan).toBe("annual");
  });
});
