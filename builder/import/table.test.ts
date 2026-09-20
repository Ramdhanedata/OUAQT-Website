import { describe, expect, it } from "vitest";
import { bestSheet, describeSheet, findHeaderRow, headerScore, isTotalRow } from "./table";

describe("finding the header row", () => {
  it("looks past a title and a date", () => {
    const rows = [
      ["Pharmacie du Marché"],
      ["Inventaire au 12/09/2026"],
      [],
      ["Désignation", "Prix de vente", "Qté", "DLC"],
      ["Savon", "120", "24", "12/2026"],
    ];
    const found = findHeaderRow(rows, "pharmacy");
    expect(found.index).toBe(3);
    expect(found.confident).toBe(true);
  });

  it("takes the first header when a heading is repeated further down", () => {
    const rows = [
      ["Nom", "Prix"],
      ["Savon", "120"],
      ["Nom", "Prix"],
      ["Coton", "150"],
    ];
    expect(findHeaderRow(rows, "pharmacy").index).toBe(0);
  });

  it("does not mistake a row of products for a header", () => {
    expect(headerScore(["Savon antiseptique", "120", "24"], "pharmacy")).toBe(0);
  });

  it("says so when nothing looks like a header", () => {
    const found = findHeaderRow([["a", "b"], ["c", "d"]], "pharmacy");
    expect(found.index).toBe(-1);
  });

  it("finds a header written in Arabic", () => {
    const rows = [["قائمة المنتجات"], [], ["الاسم", "السعر", "الكمية"], ["صابون", "120", "24"]];
    const found = findHeaderRow(rows, "pharmacy");
    expect(found.index).toBe(2);
    expect(found.confident).toBe(true);
  });
});

describe("total rows", () => {
  it("knows the ones that add a column up", () => {
    expect(isTotalRow(["TOTAL", "", "4 500"])).toBe(true);
    expect(isTotalRow(["Total général", "", "4 500"])).toBe(true);
    expect(isTotalRow(["", "", "المجموع", "4 500"])).toBe(true);
    expect(isTotalRow(["Sous-total", "900"])).toBe(true);
  });

  it("leaves a product alone even when its name starts with the same letters", () => {
    expect(isTotalRow(["Totalisateur électrique", "1200"])).toBe(false);
  });
});

describe("choosing between sheets", () => {
  const products = [
    ["Nom", "Prix", "Qté"],
    ["Savon", "120", "24"],
    ["Coton", "150", "30"],
  ];
  const notes = [["Remarques"], ["Rappeler le fournisseur"]];

  it("scores the sheet that names its columns", () => {
    const sheets = [
      describeSheet("Notes", notes, "pharmacy"),
      describeSheet("Stock", products, "pharmacy"),
    ];
    expect(bestSheet(sheets)).toBe("Stock");
  });

  it("gives back enough of each sheet to recognise it", () => {
    const summary = describeSheet("Stock", products, "pharmacy");
    expect(summary.rowCount).toBe(3);
    expect(summary.preview[0]).toEqual(["Nom", "Prix", "Qté"]);
  });

  it("says nothing rather than guessing when no sheet looks like products", () => {
    expect(bestSheet([describeSheet("Notes", notes, "pharmacy")])).toBeNull();
  });
});
