import { describe, expect, it } from "vitest";
import { checkPayment } from "./checks";

/* 18 000 MRU, stored in minor units as every amount is since 0009. */
const EXPECTED = 1_800_000;

const base = {
  expectedAmount: EXPECTED,
  payToNumber: "38087272",
  paymentMaxAgeDays: 7,
  now: new Date("2026-09-20T12:00:00Z"),
  extracted: null,
  referenceAlreadyUsed: false,
  imageAlreadyUsed: false,
};

describe("when the screenshot is not read", () => {
  it("files it for a person, with nothing typed", () => {
    const result = checkPayment(base);
    expect(result.decision).toBe("pending_confirmation");
    expect(result.failures).toEqual([]);
    expect(result.reference).toBeNull();
  });

  it("still refuses the same screenshot twice", () => {
    const result = checkPayment({ ...base, imageAlreadyUsed: true });
    expect(result.failures.map((f) => f.code)).toEqual(["image_used"]);
  });
});

describe("when the screenshot is read", () => {
  const read = {
    ...base,
    extracted: {
      isReceipt: true,
      amountMru: 18000,
      recipient: "38087272",
      date: "2026-09-19",
      reference: "BNK-99",
    },
  };

  it("accepts one that matches, and keeps the transaction number it read", () => {
    const result = checkPayment(read);
    expect(result.decision).toBe("pending_confirmation");
    expect(result.reference).toBe("BNK-99");
  });

  it("compares the amount in ouguiyas with the price in minor units", () => {
    const result = checkPayment({ ...read, extracted: { ...read.extracted, amountMru: 180 } });
    expect(result.failures[0]).toEqual({ code: "wrong_amount", expected: EXPECTED, found: 18_000 });
  });

  it("says what the amount was and what it should have been", () => {
    const result = checkPayment({ ...read, extracted: { ...read.extracted, amountMru: 15000 } });
    expect(result.failures[0]).toEqual({ code: "wrong_amount", expected: EXPECTED, found: 1_500_000 });
  });

  it("does not refuse a transfer of more than the price", () => {
    const result = checkPayment({ ...read, extracted: { ...read.extracted, amountMru: 20000 } });
    expect(result.decision).toBe("pending_confirmation");
  });

  it("refuses an image that is not a transfer, and says only that", () => {
    const result = checkPayment({
      ...read,
      extracted: { isReceipt: false, amountMru: 5, recipient: "11111111", date: "2020-01-01" },
    });
    expect(result.failures.map((f) => f.code)).toEqual(["not_receipt"]);
  });

  it("refuses a transfer sent to somebody else", () => {
    const result = checkPayment({ ...read, extracted: { ...read.extracted, recipient: "22299999" } });
    expect(result.failures.map((f) => f.code)).toContain("wrong_recipient");
  });

  it("checks against the number of the app he chose", () => {
    const result = checkPayment({ ...read, payToNumber: "44000000" });
    expect(result.failures.map((f) => f.code)).toContain("wrong_recipient");
  });

  it("accepts the same number written with a country code", () => {
    const result = checkPayment({ ...read, extracted: { ...read.extracted, recipient: "+222 38 08 72 72" } });
    expect(result.failures).toEqual([]);
  });

  it("refuses a transfer older than the window", () => {
    const result = checkPayment({ ...read, extracted: { ...read.extracted, date: "2026-09-01" } });
    expect(result.failures[0]).toMatchObject({ code: "too_old", expected: 7 });
  });

  it("counts a week-old transfer as a week, not more", () => {
    const result = checkPayment({ ...read, extracted: { ...read.extracted, date: "2026-09-13" } });
    expect(result.failures).toEqual([]);
  });

  it("allows tomorrow's date, which is a timezone, and refuses later ones", () => {
    const tomorrow = checkPayment({ ...read, extracted: { ...read.extracted, date: "2026-09-21" } });
    expect(tomorrow.failures).toEqual([]);
    const later = checkPayment({ ...read, extracted: { ...read.extracted, date: "2026-09-23" } });
    expect(later.failures.map((f) => f.code)).toEqual(["future_date"]);
  });

  it("refuses a transaction number already used", () => {
    const result = checkPayment({ ...read, referenceAlreadyUsed: true });
    expect(result.failures.map((f) => f.code)).toContain("reference_used");
  });

  it("does not treat an unreadable field as a wrong one", () => {
    const result = checkPayment({
      ...read,
      extracted: { isReceipt: null, amountMru: null, recipient: null, date: null, reference: "BNK-42" },
    });
    expect(result.decision).toBe("pending_confirmation");
  });
});

describe("what the checks can never do", () => {
  it("has no outcome that means paid", () => {
    const outcomes = new Set<string>();
    for (const referenceAlreadyUsed of [true, false]) {
      for (const imageAlreadyUsed of [true, false]) {
        for (const extracted of [null, { isReceipt: true, reference: "R1" }, { isReceipt: false }]) {
          outcomes.add(checkPayment({ ...base, referenceAlreadyUsed, imageAlreadyUsed, extracted }).decision);
        }
      }
    }
    expect(Array.from(outcomes).sort()).toEqual(["pending_confirmation", "rejected_auto"]);
  });
});
