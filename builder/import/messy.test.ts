import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { bestSheet, describeSheet } from "./table";
import { parseProducts } from "./parse";

/*
 * The files owners actually send.
 *
 * Each of these is built here as a real workbook and read back through
 * SheetJS exactly as the browser reads one, so the test covers the decoding
 * as well as the parsing. Every product name and price is invented.
 */

function rowsFrom(aoa: unknown[][]): unknown[][] {
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Feuille1");
  const written = XLSX.write(book, { type: "array", bookType: "xlsx" });
  const read = XLSX.read(written, { cellDates: false });
  return XLSX.utils.sheet_to_json(read.Sheets[read.SheetNames[0]], {
    header: 1,
    blankrows: true,
    defval: "",
  });
}

function rowsFromCsv(csv: string): unknown[][] {
  /* raw, exactly as builder/import/file.ts reads one. */
  const read = XLSX.read(csv, { type: "string", cellDates: false, raw: true });
  return XLSX.utils.sheet_to_json(read.Sheets[read.SheetNames[0]], {
    header: 1,
    blankrows: true,
    defval: "",
  });
}

describe("a file with a title above the table", () => {
  const rows = rowsFrom([
    ["Pharmacie Essai"],
    ["Inventaire du 12/09/2026"],
    [],
    ["Désignation", "Prix de vente", "Qté", "DLC", "Lot"],
    ["Savon Alpha", "120", "24", "12/2026", "A12"],
    ["Crème Béta", "250", "12", "06/2027", "B03"],
    [],
    ["TOTAL", "", "36", "", ""],
  ]);

  it("finds the table, skips the title and the total", () => {
    const result = parseProducts(rows, "pharmacy", { now: new Date("2026-09-20") });
    expect(result.headerRow).toBe(4);
    expect(result.products.map((p) => p.name)).toEqual(["Savon Alpha", "Crème Béta"]);
    expect(result.totalRows).toBe(1);
    expect(result.problems).toEqual([]);
  });

  it("counts rows the way his spreadsheet does", () => {
    const result = parseProducts(rows, "pharmacy");
    expect(result.products[0].row).toBe(5);
  });
});

describe("a workbook with several sheets", () => {
  it("points at the one that holds products", () => {
    const notes = rowsFrom([["Remarques"], ["Rappeler le fournisseur lundi"]]);
    const stock = rowsFrom([
      ["Nom", "Prix", "Qté"],
      ["Savon Alpha", "120", "24"],
    ]);

    const summaries = [
      describeSheet("Notes", notes, "pharmacy"),
      describeSheet("Stock 2026", stock, "pharmacy"),
    ];
    expect(bestSheet(summaries)).toBe("Stock 2026");
    expect(summaries[1].preview[0]).toEqual(["Nom", "Prix", "Qté"]);
  });
});

describe("a file written in Arabic", () => {
  const rows = rowsFrom([
    ["قائمة المنتجات"],
    [],
    ["الاسم", "السعر", "الكمية", "تاريخ الانتهاء"],
    ["صابون ألفا", "١٢٠", "٢٤", "١٢/٢٠٢٦"],
    ["كريم بيتا", "٢٥٠", "١٢", "06/2027"],
    ["المجموع", "", "٣٦", ""],
  ]);

  it("reads Arabic headers, Arabic-Indic digits and skips the total", () => {
    const result = parseProducts(rows, "pharmacy", { now: new Date("2026-09-20") });
    expect(result.products).toHaveLength(2);
    expect(result.products[0]).toMatchObject({
      name: "صابون ألفا",
      price: 120,
      quantity: 24,
      expiry: "2026-12-31",
    });
    expect(result.totalRows).toBe(1);
  });
});

describe("prices that might be old ouguiyas", () => {
  it("asks when a pharmacy's prices are ten times too high", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Qté"],
      ["Savon Alpha", "12000", "24"],
      ["Crème Béta", "25000", "12"],
    ]);
    const result = parseProducts(rows, "pharmacy");
    expect(result.currency).toMatchObject({ ask: true, why: "prices_high" });
  });

  it("asks when the column says UM", () => {
    const rows = rowsFrom([
      ["Nom", "Prix UM", "Qté"],
      ["Savon Alpha", "120", "24"],
    ]);
    expect(parseProducts(rows, "pharmacy").currency).toMatchObject({
      ask: true,
      why: "said_um",
    });
  });

  it("divides by ten once he has said they are old, and stops asking", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Qté"],
      ["Savon Alpha", "12000", "24"],
    ]);
    const result = parseProducts(rows, "pharmacy", { currency: "old" });
    expect(result.products[0].price).toBe(1200);
    expect(result.currency.ask).toBe(false);
  });
});

describe("codes that must stay as written", () => {
  it("keeps the leading zeros on a barcode", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Code"],
      ["Savon Alpha", "120", "0012345678905"],
    ]);
    expect(parseProducts(rows, "pharmacy").products[0].barcode).toBe("0012345678905");
  });

  it("keeps a batch number that looks like a number", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Lot"],
      ["Savon Alpha", "120", "00473"],
    ]);
    expect(parseProducts(rows, "pharmacy").products[0].batch).toBe("00473");
  });
});

describe("quantities written in shop words", () => {
  it("keeps the number and offers the word as the unit", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Quantité"],
      ["Savon Alpha", "120", "12 boîtes"],
      ["Crème Béta", "250", "5 cartons"],
    ]);
    const result = parseProducts(rows, "pharmacy");
    expect(result.products[0]).toMatchObject({ quantity: 12, quantityUnit: "boîtes" });
    expect(result.products[1]).toMatchObject({ quantity: 5, quantityUnit: "cartons" });
  });
});

describe("dates", () => {
  it("takes MM/YY and MM/YYYY as the end of that month", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Péremption"],
      ["Savon Alpha", "120", "02/27"],
      ["Crème Béta", "250", "12/2026"],
    ]);
    const result = parseProducts(rows, "pharmacy", { now: new Date("2026-01-01") });
    expect(result.products[0].expiry).toBe("2027-02-28");
    expect(result.products[1].expiry).toBe("2026-12-31");
  });

  it("flags a date already past without refusing the row", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Péremption"],
      ["Savon Alpha", "120", "01/2020"],
    ]);
    const result = parseProducts(rows, "pharmacy", { now: new Date("2026-09-20") });
    expect(result.products).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ code: "past_expiry", row: 2 });
  });
});

describe("duplicates in the file", () => {
  it("groups the same product typed twice and leaves two strengths alone", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Qté"],
      ["Savon Alpha", "120", "10"],
      ["savon alpha ", "120", "5"],
      ["Sirop Gamma 500", "300", "4"],
      ["Sirop Gamma 1000", "450", "2"],
    ]);
    const result = parseProducts(rows, "pharmacy");
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].rows.map((row) => row.row)).toEqual([2, 3]);
  });
});

describe("dates that SheetJS would guess at", () => {
  /*
   * "06/27" on a box means June 2027. Read by SheetJS's own date detection it
   * came back as the serial number for June 2001, and a quarter century old
   * expiry date would have been imported as fact.
   */
  it("reads a month and a year as the end of that month, not as a guess", () => {
    const rows = rowsFromCsv(["Nom;Prix;DLC", "Crème Béta;250;06/27"].join("\n"));
    const result = parseProducts(rows, "pharmacy", { now: new Date("2026-09-20") });
    expect(result.products[0].expiry).toBe("2027-06-30");
    expect(result.warnings).toEqual([]);
  });
});

describe("a csv separated by semicolons", () => {
  it("reads it the same as a comma one", () => {
    const rows = rowsFromCsv(
      ["Nom;Prix;Quantité", "Savon Alpha;120;24", "Crème Béta;250;12"].join("\n")
    );
    const result = parseProducts(rows, "pharmacy");
    expect(result.products).toHaveLength(2);
    expect(result.products[0]).toMatchObject({ name: "Savon Alpha", price: 120 });
  });
});

describe("each trade's own columns", () => {
  it("reads a bakery file that says how each product is sold", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Quantité", "Vendu par"],
      ["Pain Alpha", "20", "200", "Pièce"],
      ["Gâteau Béta", "150", "12", "Poids"],
    ]);
    const result = parseProducts(rows, "bakery");
    expect(result.products[0]).toMatchObject({ name: "Pain Alpha", soldBy: "Pièce" });
    expect(result.products[1].soldBy).toBe("Poids");
  });

  it("reads a restaurant file, which has no stock to speak of", () => {
    const rows = rowsFrom([
      ["Désignation", "Prix"],
      ["Thé Alpha", "50"],
      ["Sandwich Béta", "250"],
    ]);
    const result = parseProducts(rows, "restaurant");
    expect(result.products).toHaveLength(2);
    expect(result.products[0].quantity).toBe(0);
  });

  it("reads a warehouse file with units and places", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Quantité", "Unité", "Emplacement"],
      ["Sac de riz Alpha", "12000", "60", "Sac", "Dépôt 1"],
      ["Carton d'huile Béta", "9000", "45", "Carton", "Dépôt 2"],
    ]);
    const result = parseProducts(rows, "warehouse");
    expect(result.products[0]).toMatchObject({ unit: "Sac", location: "Dépôt 1" });
    expect(result.products[1]).toMatchObject({ unit: "Carton", location: "Dépôt 2" });
  });

  it("ignores a column a trade has no use for", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Péremption"],
      ["Thé Alpha", "50", "12/2026"],
    ]);
    /* A restaurant has no expiry column, so the date is left where it was. */
    const result = parseProducts(rows, "restaurant");
    expect(result.products[0].expiry).toBeUndefined();
    expect(result.problems).toEqual([]);
  });
});

describe("rows with holes in them", () => {
  it("names the row and the column for each, and keeps the good ones", () => {
    const rows = rowsFrom([
      ["Nom", "Prix", "Qté"],
      ["Savon Alpha", "120", "24"],
      ["", "300", "5"],
      ["Crème Béta", "", "10"],
      ["Gel Delta", "0", "8"],
      ["Huile Epsilon", "-20", "3"],
    ]);
    const result = parseProducts(rows, "pharmacy");
    expect(result.products.map((p) => p.name)).toEqual(["Savon Alpha"]);
    expect(result.problems.map((p) => p.code)).toEqual([
      "missing_name",
      "missing_price",
      "zero_price",
      "negative_price",
    ]);
    expect(result.problems.every((p) => p.row > 0 && p.column !== "")).toBe(true);
  });
});
