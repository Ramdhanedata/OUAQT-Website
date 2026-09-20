import { describe, expect, it } from "vitest";
import { currencyDoubt, median, toNewOuguiya } from "./currency";

describe("when to ask about old ouguiyas", () => {
  it("asks when the column says UM, whatever the numbers are", () => {
    const doubt = currencyDoubt({
      pack: "pharmacy",
      priceHeader: "Prix UM",
      priceCells: [],
      prices: [120, 150, 200],
    });
    expect(doubt).toMatchObject({ ask: true, why: "said_um" });
  });

  it("asks when a pharmacy's prices are ten times what they should be", () => {
    const doubt = currencyDoubt({
      pack: "pharmacy",
      priceHeader: "Prix",
      priceCells: [],
      prices: [12000, 15000, 20000],
    });
    expect(doubt).toMatchObject({ ask: true, why: "prices_high" });
  });

  it("does not ask a pharmacy about ordinary prices", () => {
    const doubt = currencyDoubt({
      pack: "pharmacy",
      priceHeader: "Prix",
      priceCells: [],
      prices: [120, 150, 900],
    });
    expect(doubt.ask).toBe(false);
  });

  it("does not ask a warehouse about four figure prices, which are its normal", () => {
    const doubt = currencyDoubt({
      pack: "warehouse",
      priceHeader: "Prix",
      priceCells: [],
      prices: [9000, 12000, 11000],
    });
    expect(doubt.ask).toBe(false);
  });

  it("asks when a cell says it, not only the header", () => {
    const doubt = currencyDoubt({
      pack: "bakery",
      priceHeader: "Prix",
      priceCells: ["200 UM", "150"],
      prices: [200, 150],
    });
    expect(doubt).toMatchObject({ ask: true, why: "said_um" });
  });

  it("says nothing about an empty file rather than asking", () => {
    const doubt = currencyDoubt({ pack: "bakery", priceHeader: "Prix", priceCells: [], prices: [] });
    expect(doubt.ask).toBe(false);
    expect(doubt.median).toBeNull();
  });
});

describe("the middle price", () => {
  it("is the middle one, not the average", () => {
    expect(median([100, 200, 90000])).toBe(200);
  });

  it("averages the two in the middle of an even list", () => {
    expect(median([100, 200, 300, 400])).toBe(250);
  });

  it("ignores prices of zero", () => {
    expect(median([0, 0, 500])).toBe(500);
  });
});

describe("converting, once he has said so", () => {
  it("is a tenth", () => {
    expect(toNewOuguiya(12000)).toBe(1200);
    expect(toNewOuguiya(150)).toBe(15);
  });
});
