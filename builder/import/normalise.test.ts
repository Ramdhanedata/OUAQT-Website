import { describe, expect, it } from "vitest";
import { isBlankRow, parseExpiry, parseNumber } from "./normalise";

describe("a price, however it was written", () => {
  it("reads the French way", () => {
    expect(parseNumber("1 200,50")).toBe(1200.5);
    expect(parseNumber("1 200,50")).toBe(1200.5);
    expect(parseNumber("0,75")).toBe(0.75);
  });

  it("reads the English way", () => {
    expect(parseNumber("1,200.50")).toBe(1200.5);
    expect(parseNumber("1200.5")).toBe(1200.5);
  });

  it("ignores the currency he typed next to it", () => {
    expect(parseNumber("1 200 MRU")).toBe(1200);
    expect(parseNumber("350 UM")).toBe(350);
    expect(parseNumber("350mru")).toBe(350);
  });

  it("takes a number as a number", () => {
    expect(parseNumber(1200.5)).toBe(1200.5);
    expect(parseNumber(0)).toBe(0);
  });

  it("says nothing rather than zero when the cell is empty", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("   ")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });

  it("refuses text that is not a number", () => {
    expect(parseNumber("à voir")).toBeNull();
    expect(parseNumber("-")).toBeNull();
  });
});

describe("an expiry date", () => {
  it("takes the month and year printed on the box, and means the end of it", () => {
    expect(parseExpiry("12/2026")).toBe("2026-12-31");
    expect(parseExpiry("2/27")).toBe("2027-02-28");
  });

  it("takes a full date", () => {
    expect(parseExpiry("31/12/2026")).toBe("2026-12-31");
    expect(parseExpiry("01-03-2027")).toBe("2027-03-01");
    expect(parseExpiry("2026-12-31")).toBe("2026-12-31");
  });

  it("takes what Excel hands over when the cell was a date", () => {
    // 46387 is 31 December 2026 in Excel's counting.
    expect(parseExpiry(46387)).toBe("2026-12-31");
  });

  it("refuses a month that does not exist", () => {
    expect(parseExpiry("13/2026")).toBeNull();
    expect(parseExpiry("00/2026")).toBeNull();
  });

  it("says nothing for an empty cell", () => {
    expect(parseExpiry("")).toBeNull();
  });
});

describe("blank rows", () => {
  it("knows the ones left by pressing Enter", () => {
    expect(isBlankRow(["", null, "   ", undefined])).toBe(true);
    expect(isBlankRow(["", "Savon", ""])).toBe(false);
  });
});
