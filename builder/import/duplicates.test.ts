import { describe, expect, it } from "vitest";
import { findDuplicates, productKey, resolve } from "./duplicates";
import type { ImportedProduct } from "./parse";

/* Invented names throughout: nothing here comes from a real shop. */
const product = (row: number, name: string, price = 100, quantity = 1): ImportedProduct => ({
  row,
  name,
  price,
  quantity,
});

describe("what counts as the same product", () => {
  it("ignores capitals, accents and stray spaces", () => {
    expect(productKey("Savon Alpha ")).toBe(productKey("savon  alpha"));
    expect(productKey("Crème Béta")).toBe(productKey("creme beta"));
  });

  it("keeps the numbers, because a strength is part of the name", () => {
    expect(productKey("Sirop Alpha 500")).not.toBe(productKey("Sirop Alpha 1000"));
  });

  it("treats 500 mg and 500mg as one thing", () => {
    expect(productKey("Sirop Alpha 500 mg")).toBe(productKey("Sirop Alpha 500mg"));
  });

  it("ignores punctuation an owner adds", () => {
    expect(productKey("Savon Alpha (grand)")).toBe(productKey("savon alpha grand"));
  });
});

describe("finding duplicates", () => {
  it("groups the same product entered twice", () => {
    const groups = findDuplicates([
      product(2, "Savon Alpha", 120, 10),
      product(3, "savon alpha ", 120, 5),
      product(4, "Crème Béta", 200, 3),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].rows.map((row) => row.row)).toEqual([2, 3]);
    expect(groups[0].samePrice).toBe(true);
  });

  it("does not group two strengths of the same range", () => {
    const groups = findDuplicates([
      product(2, "Sirop Alpha 500"),
      product(3, "Sirop Alpha 1000"),
    ]);
    expect(groups).toHaveLength(0);
  });

  it("says when the two lines disagree on price", () => {
    const groups = findDuplicates([
      product(2, "Savon Alpha", 120),
      product(3, "Savon Alpha", 150),
    ]);
    expect(groups[0].samePrice).toBe(false);
  });
});

describe("what he chose to do about them", () => {
  const rows = [
    product(2, "Savon Alpha", 120, 10),
    product(3, "savon alpha", 120, 5),
    product(4, "Crème Béta", 200, 3),
  ];
  const group = findDuplicates(rows)[0];

  it("keeps both when he says they are different", () => {
    expect(resolve(rows, group, "keep_all")).toHaveLength(3);
  });

  it("keeps the first when he says it is the same", () => {
    const out = resolve(rows, group, "keep_first");
    expect(out.map((row) => row.row)).toEqual([2, 4]);
    expect(out[0].quantity).toBe(10);
  });

  it("adds the quantities together when he says they are one product in two places", () => {
    const out = resolve(rows, group, "merge_quantities");
    expect(out).toHaveLength(2);
    expect(out[0].quantity).toBe(15);
  });

  it("keeps the merged row where the first one was", () => {
    const out = resolve(rows, group, "merge_quantities");
    expect(out[0].name).toBe("Savon Alpha");
    expect(out[1].name).toBe("Crème Béta");
  });
});
