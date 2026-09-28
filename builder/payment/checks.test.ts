import { describe, expect, it } from "vitest";
import { checkPayment, confirmsAlone } from "./checks";

/* A year at 18 000 MRU, stored in minor units as every amount is since 0009. */
const YEAR = 1_800_000;

const base = {
  expectedAmount: YEAR,
  payToNumber: "38087272",
  now: new Date("2026-09-25T14:00:00Z"),
  extracted: null,
  referenceAlreadyUsed: false,
  imageAlreadyUsed: false,
};

const right = {
  isReceipt: true,
  amountMru: 18000,
  recipient: "38087272",
  date: "2026-09-25",
  reference: "BK-99",
};

const codes = (extracted: Parameters<typeof checkPayment>[0]["extracted"], more = {}) =>
  checkPayment({ ...base, extracted, ...more }).failures.map((failure) => failure.code);

describe("the three rules", () => {
  it("passes a screenshot where the number, today's date and the plan's price are all right", () => {
    const outcome = checkPayment({ ...base, extracted: right });
    expect(outcome.failures).toEqual([]);
    expect(outcome.reference).toBe("BK-99");
    expect(confirmsAlone(outcome, right)).toBe(true);
  });

  it("wants exactly the price of the plan chosen, no less and no more", () => {
    expect(codes({ ...right, amountMru: 9000 })).toEqual(["wrong_amount"]);
    expect(codes({ ...right, amountMru: 20000 })).toEqual(["wrong_amount"]);
    expect(codes({ ...right, amountMru: 9000 }, { expectedAmount: 900_000 })).toEqual([]);
  });

  it("says what the amount was and what it should have been", () => {
    expect(checkPayment({ ...base, extracted: { ...right, amountMru: 15000 } }).failures[0]).toEqual({
      code: "wrong_amount",
      expected: YEAR,
      found: 1_500_000,
    });
  });

  it("wants OUAQT's number on the app chosen, written any way", () => {
    expect(codes({ ...right, recipient: "22299999" })).toEqual(["wrong_recipient"]);
    expect(codes({ ...right, recipient: "+222 38 08 72 72" })).toEqual([]);
    expect(codes(right, { payToNumber: "44000000" })).toEqual(["wrong_recipient"]);
  });

  it("wants today's date", () => {
    expect(codes({ ...right, date: "2026-09-24" })).toEqual(["wrong_date"]);
    expect(codes({ ...right, date: "2026-09-26" })).toEqual(["wrong_date"]);
  });

  it("says which one could not be read, rather than letting it pass", () => {
    expect(codes({ ...right, amountMru: null, recipient: null, date: null })).toEqual([
      "recipient_unread",
      "date_unread",
      "amount_unread",
    ]);
  });

  it("names every rule that failed at once", () => {
    expect(codes({ ...right, amountMru: 100, recipient: "11111111", date: "2020-01-01" })).toEqual([
      "wrong_recipient",
      "wrong_date",
      "wrong_amount",
    ]);
  });
});

describe("what else refuses a payment", () => {
  it("an image that is not a transfer, and only that", () => {
    expect(codes({ isReceipt: false, amountMru: 5, recipient: "11111111", date: "2020-01-01" })).toEqual(["not_receipt"]);
  });

  it("a screenshot or a transaction number already used", () => {
    expect(codes(right, { imageAlreadyUsed: true })).toEqual(["image_used"]);
    expect(codes(right, { referenceAlreadyUsed: true })).toEqual(["reference_used"]);
  });

  it("never lets a refused payment succeed", () => {
    const outcome = checkPayment({ ...base, extracted: { ...right, amountMru: 100 } });
    expect(confirmsAlone(outcome, { ...right, amountMru: 100 })).toBe(false);
  });
});

describe("when the screenshot could not be read at all", () => {
  it("goes to a person, and never succeeds on its own", () => {
    const outcome = checkPayment(base);
    expect(outcome.decision).toBe("pending_confirmation");
    expect(outcome.failures).toEqual([]);
    expect(confirmsAlone(outcome, null)).toBe(false);
  });

  it("still refuses the same screenshot twice", () => {
    expect(codes(null, { imageAlreadyUsed: true })).toEqual(["image_used"]);
  });
});
