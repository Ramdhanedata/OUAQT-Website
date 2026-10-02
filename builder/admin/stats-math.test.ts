import { describe, expect, it } from "vitest";
import {
  bonusOf,
  bucketsOf,
  changeOf,
  countBoth,
  distinctBoth,
  distinctSeriesOf,
  funnelOf,
  periodOf,
  seriesOf,
  sumBoth,
  sumSeriesOf,
  tallyOf,
  windowOf,
} from "./stats-math";

const now = new Date("2026-10-02T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

describe("a period", () => {
  it("is one of the offered lengths, thirty days otherwise", () => {
    expect(periodOf("7")).toBe(7);
    expect(periodOf(["90"])).toBe(90);
    expect(periodOf("365")).toBe(365);
    expect(periodOf("12")).toBe(30);
    expect(periodOf(undefined)).toBe(30);
  });
});

describe("this period and the one before", () => {
  const window = windowOf(now, 7);

  it("counts each date in the stretch it falls in", () => {
    expect(countBoth([daysAgo(1), daysAgo(6), daysAgo(8), daysAgo(13), daysAgo(20)], window)).toEqual({ current: 2, previous: 2 });
  });

  it("counts a visitor once per period, however many pages", () => {
    const rows = [
      { key: "a", at: daysAgo(1) },
      { key: "a", at: daysAgo(2) },
      { key: "b", at: daysAgo(3) },
      { key: "a", at: daysAgo(9) },
    ];
    expect(distinctBoth(rows, window)).toEqual({ current: 2, previous: 1 });
  });

  it("adds up amounts", () => {
    expect(sumBoth([{ amount: 500, at: daysAgo(1) }, { amount: 200, at: daysAgo(10) }, { amount: 50, at: daysAgo(30) }], window)).toEqual({
      current: 500,
      previous: 200,
    });
  });
});

describe("how a figure moved", () => {
  it("is a percentage against the period before", () => {
    expect(changeOf(15, 10)).toEqual({ trend: "up", percent: 50 });
    expect(changeOf(5, 10)).toEqual({ trend: "down", percent: -50 });
    expect(changeOf(10, 10)).toEqual({ trend: "flat", percent: 0 });
  });

  it("is new from nothing, and flat from nothing to nothing", () => {
    expect(changeOf(3, 0)).toEqual({ trend: "new", percent: null });
    expect(changeOf(0, 0)).toEqual({ trend: "flat", percent: null });
  });
});

describe("the chart's columns", () => {
  it("are days up to ninety days, ending today", () => {
    const days = bucketsOf(now, 7);
    expect(days).toHaveLength(7);
    expect(days[6]).toEqual({ start: "2026-10-02", days: 1 });
    expect(days[0].start).toBe("2026-09-26");
  });

  it("are weeks for a year", () => {
    const weeks = bucketsOf(now, 365);
    expect(weeks).toHaveLength(53);
    expect(weeks[52]).toEqual({ start: "2026-09-26", days: 7 });
  });

  it("put each date, visitor and amount in its column", () => {
    const days = bucketsOf(now, 3);
    expect(seriesOf([daysAgo(0), daysAgo(1), daysAgo(1), daysAgo(9)], days)).toEqual([0, 2, 1]);
    expect(distinctSeriesOf([{ key: "a", at: daysAgo(1) }, { key: "a", at: daysAgo(1) }, { key: "b", at: daysAgo(0) }], days)).toEqual([0, 1, 1]);
    expect(sumSeriesOf([{ amount: 300, at: daysAgo(2) }, { amount: 200, at: daysAgo(2) }], days)).toEqual([500, 0, 0]);
  });
});

describe("the funnel", () => {
  it("gives each step its share of the step before and of the first", () => {
    const steps = funnelOf([200, 50, 25, 0]);
    expect(steps[0]).toEqual({ count: 200, ofPrevious: null, ofFirst: null });
    expect(steps[1]).toEqual({ count: 50, ofPrevious: 0.25, ofFirst: 0.25 });
    expect(steps[2]).toEqual({ count: 25, ofPrevious: 0.5, ofFirst: 0.125 });
    expect(steps[3].ofPrevious).toBe(0);
  });

  it("has no share after an empty step", () => {
    expect(funnelOf([0, 0])[1]).toEqual({ count: 0, ofPrevious: null, ofFirst: null });
  });
});

describe("a breakdown", () => {
  it("counts each kind, most first, with the unknown named", () => {
    expect(tallyOf(["pharmacy", "shop", "pharmacy", null, ""], "none")).toEqual([
      ["none", 2],
      ["pharmacy", 2],
      ["shop", 1],
    ]);
  });
});

describe("a representative's bonus", () => {
  it("is their share of the revenue plus an amount per shop that paid", () => {
    expect(bonusOf({ revenue: 1_000_000, payingShops: 3, percent: 10, perShop: 50_000 })).toBe(250_000);
  });

  it("is nothing with no rule or no revenue", () => {
    expect(bonusOf({ revenue: 1_000_000, payingShops: 3, percent: 0, perShop: 0 })).toBe(0);
    expect(bonusOf({ revenue: 0, payingShops: 0, percent: 15, perShop: 20_000 })).toBe(0);
  });

  it("rounds to the smallest unit", () => {
    expect(bonusOf({ revenue: 333, payingShops: 0, percent: 12.5, perShop: 0 })).toBe(42);
  });
});
