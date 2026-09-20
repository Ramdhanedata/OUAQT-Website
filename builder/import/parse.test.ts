import { describe, expect, it } from "vitest";
import { findColumns, simplify } from "./columns";
import { MAX_ROWS, parseProducts } from "./parse";

const header = ["Nom", "Prix", "Quantité", "Péremption", "Lot"];

describe("finding the columns", () => {
  it("ignores accents and case", () => {
    expect(simplify("Désignation")).toBe("designation");
    expect(simplify("QUANTITÉ ")).toBe("quantite");
  });

  it("reads the template's own headers", () => {
    const columns = findColumns(header, "pharmacy");
    expect(columns.name?.index).toBe(0);
    expect(columns.price?.index).toBe(1);
    expect(columns.expiry?.index).toBe(3);
  });

  it("reads a file written in Arabic", () => {
    const columns = findColumns(["الاسم", "السعر", "الكمية"], "pharmacy");
    expect(columns.name?.index).toBe(0);
    expect(columns.price?.index).toBe(1);
    expect(columns.quantity?.index).toBe(2);
  });

  it("prefers the exact header over one that merely contains it", () => {
    const columns = findColumns(["Prix d'achat", "Prix", "Nom"], "pharmacy");
    expect(columns.price?.index).toBe(1);
  });

  it("keeps the owner's own spelling, for the error message", () => {
    expect(findColumns(["Désignation", "Prix"], "pharmacy").name?.header).toBe(
      "Désignation"
    );
  });

  it("does not look for columns a pack has no use for", () => {
    expect(findColumns(header, "restaurant").expiry).toBeUndefined();
  });
});

describe("reading a file", () => {
  it("takes the good rows and names the bad ones", () => {
    const result = parseProducts(
      [
        header,
        ["Savon antiseptique", "1 200,50 MRU", "24", "12/2026", "A12"],
        ["", "300", "5", "", ""],
        ["Coton", "", "10", "", ""],
        ["Gants", "à voir", "8", "", ""],
        ["", "", "", "", ""],
        ["Masques", "200", "40", "13/2026", ""],
      ],
      "pharmacy"
    );

    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      row: 2,
      name: "Savon antiseptique",
      price: 1200.5,
      quantity: 24,
      expiry: "2026-12-31",
      batch: "A12",
    });

    expect(result.problems).toEqual([
      { row: 3, column: "Nom", code: "missing_name" },
      { row: 4, column: "Prix", code: "missing_price" },
      { row: 5, column: "Prix", code: "bad_price" },
      { row: 7, column: "Péremption", code: "bad_expiry" },
    ]);
    expect(result.blankRows).toBe(1);
  });

  it("counts rows the way the owner's spreadsheet does", () => {
    const result = parseProducts(
      [[], header, ["Pain", "20", "100"]],
      "bakery"
    );
    // Blank first line, header on line 2, so the product is on line 3.
    expect(result.products[0].row).toBe(3);
  });

  it("treats a missing quantity as none in stock rather than an error", () => {
    const result = parseProducts([header, ["Pain", "20", "", "", ""]], "bakery");
    expect(result.problems).toHaveLength(0);
    expect(result.products[0].quantity).toBe(0);
  });

  it("accepts a price of zero", () => {
    const result = parseProducts([header, ["Sachet", "0", "10"]], "bakery");
    expect(result.products[0].price).toBe(0);
    expect(result.problems).toHaveLength(0);
  });

  it("refuses a negative price", () => {
    const result = parseProducts([header, ["Sachet", "-5", "10"]], "bakery");
    expect(result.problems[0].code).toBe("bad_price");
  });

  it("says which columns it could not find at all", () => {
    const result = parseProducts([["Machin", "Truc"], ["a", "b"]], "pharmacy");
    expect(result.missingColumns).toEqual(["name", "price"]);
    expect(result.products).toHaveLength(0);
  });

  it("stops at ten thousand rows and says so", () => {
    const rows: unknown[][] = [header];
    for (let i = 0; i < MAX_ROWS + 20; i += 1) rows.push([`Produit ${i}`, "10", "1"]);

    const result = parseProducts(rows, "pharmacy");
    expect(result.products).toHaveLength(MAX_ROWS);
    expect(result.truncated).toBe(true);
  });

  it("survives a file with nothing in it", () => {
    const result = parseProducts([[], ["", ""]], "pharmacy");
    expect(result.products).toHaveLength(0);
    expect(result.missingColumns.length).toBeGreaterThan(0);
  });

  it("keeps the extra columns a pack understands", () => {
    const result = parseProducts(
      [
        ["Nom", "Prix", "Unité", "Emplacement"],
        ["Sac de riz", "12000", "Sac", "Dépôt 1"],
      ],
      "warehouse"
    );
    expect(result.products[0]).toMatchObject({ unit: "Sac", location: "Dépôt 1" });
  });
});
