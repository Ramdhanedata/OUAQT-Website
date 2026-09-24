import { describe, expect, it } from "vitest";
import { formatAmount, formatMoney } from "./format";
import { change, fromOldOuguiya, lineTotal, perMonth, sum, toMajor, toMinor } from "./money";

/*
 * The money path, checked with the numbers that break floats.
 *
 * This file is shared with the desktop app, where the same arithmetic runs a
 * till all day. A hundredth lost per sale is a lot by December.
 */

describe("money is whole numbers", () => {
  it("0.1 plus 0.2 is exactly 0.3", () => {
    expect(sum([toMinor(0.1), toMinor(0.2)])).toBe(toMinor(0.3));
    expect(toMajor(sum([toMinor(0.1), toMinor(0.2)]))).toBe(0.3);
  });

  it("stays exact over a thousand awkward prices", () => {
    const prices = Array.from({ length: 1000 }, (_, index) => toMinor(0.01 * (index + 1)));
    const total = sum(prices);
    expect(Number.isInteger(total)).toBe(true);
    /* 0.01 + 0.02 + ... + 10.00 is 5005 ouguiyas exactly. */
    expect(total).toBe(toMinor(5005));
  });

  it("keeps a line total whole even when the quantity is not", () => {
    expect(lineTotal(3, toMinor(120.5))).toBe(toMinor(361.5));
    expect(Number.isInteger(lineTotal(0.25, toMinor(99.99)))).toBe(true);
  });

  it("never hands back negative change", () => {
    expect(change(toMinor(500), toMinor(640))).toBe(0);
    expect(change(toMinor(1000), toMinor(640))).toBe(toMinor(360));
  });

  it("round-trips a price without drift", () => {
    for (const price of [0.01, 0.99, 120.5, 12000, 99999.99]) {
      expect(toMajor(toMinor(price))).toBe(price);
    }
  });
});

describe("the figures an owner compares", () => {
  it("gives a whole monthly amount from a yearly one", () => {
    expect(perMonth(toMinor(18000))).toBe(toMinor(1500));
    expect(perMonth(toMinor(15000))).toBe(toMinor(1250));
    expect(Number.isInteger(perMonth(toMinor(10000)))).toBe(true);
  });

  it("turns old ouguiyas into new ones, still whole", () => {
    expect(fromOldOuguiya(toMinor(12000))).toBe(toMinor(1200));
    expect(Number.isInteger(fromOldOuguiya(125))).toBe(true);
  });
});

describe("what a person reads", () => {
  it("writes the smallest unit as ouguiyas with two decimals", () => {
    expect(formatAmount(120050, "fr")).toBe("1 200,50");
    expect(formatMoney(12000, "fr")).toBe("120,00 MRU");
  });

  it("writes the same amount the English way", () => {
    expect(formatAmount(120050, "en")).toBe("1,200.50");
  });

  it("uses Western digits in Arabic", () => {
    expect(formatMoney(64000, "ar")).toBe("640,00 MRU");
  });
});
