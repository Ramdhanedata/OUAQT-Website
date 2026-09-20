"use client";

import type { Pack } from "@/app-ui/packs";
import type { AppLanguage } from "@/app-ui/config";
import { fieldsFor, type ImportField } from "./columns";
import { parseProducts, type ImportResult } from "./parse";

/*
 * The file itself: reading the one he sends, and writing the one we offer.
 *
 * Both happen in his browser. His product list is his business and there is
 * no reason for it to travel to us before he has decided to save it, and on a
 * phone connection reading it locally is the difference between instant and a
 * minute of waiting.
 *
 * The parsing rules live in parse.ts, with no knowledge of files, so they can
 * be tested without one.
 */

/** Headers for the template, in the owner's language. */
const headers: Record<ImportField, Record<AppLanguage, string>> = {
  name: { fr: "Nom", ar: "الاسم", en: "Name" },
  price: { fr: "Prix", ar: "السعر", en: "Price" },
  quantity: { fr: "Quantité", ar: "الكمية", en: "Quantity" },
  barcode: { fr: "Code-barres", ar: "الباركود", en: "Barcode" },
  expiry: { fr: "Péremption", ar: "تاريخ الانتهاء", en: "Expiry" },
  batch: { fr: "Lot", ar: "رقم التشغيلة", en: "Batch" },
  unit: { fr: "Unité", ar: "الوحدة", en: "Unit" },
  location: { fr: "Emplacement", ar: "الموقع", en: "Location" },
  soldBy: { fr: "Vendu par", ar: "طريقة البيع", en: "Sold by" },
};

/* Two rows so the shape is obvious. Invented, like all sample data. */
const examples: Record<Pack, Record<ImportField, string>[]> = {
  pharmacy: [
    { name: "Savon antiseptique", price: "120", quantity: "24", barcode: "", expiry: "12/2027", batch: "A12", unit: "", location: "", soldBy: "" },
    { name: "Coton hydrophile", price: "150", quantity: "30", barcode: "", expiry: "06/2028", batch: "B03", unit: "", location: "", soldBy: "" },
  ],
  bakery: [
    { name: "Pain", price: "20", quantity: "200", barcode: "", expiry: "", batch: "", unit: "", location: "", soldBy: "Pièce" },
    { name: "Gâteau", price: "150", quantity: "20", barcode: "", expiry: "", batch: "", unit: "", location: "", soldBy: "Poids" },
  ],
  restaurant: [
    { name: "Thé", price: "50", quantity: "0", barcode: "", expiry: "", batch: "", unit: "", location: "", soldBy: "" },
    { name: "Sandwich", price: "250", quantity: "0", barcode: "", expiry: "", batch: "", unit: "", location: "", soldBy: "" },
  ],
  warehouse: [
    { name: "Sac de riz, 50 kg", price: "12000", quantity: "60", barcode: "", expiry: "", batch: "", unit: "Sac", location: "Dépôt 1", soldBy: "" },
    { name: "Carton d'huile", price: "9000", quantity: "45", barcode: "", expiry: "", batch: "", unit: "Carton", location: "Dépôt 1", soldBy: "" },
  ],
};

/** Reads whatever he chose, in his browser, and hands back rows and problems. */
export async function readProductFile(
  file: File,
  pack: Pack
): Promise<ImportResult> {
  const { read, utils } = await import("xlsx");

  /*
   * A .csv is text and is decoded here, as UTF-8, before SheetJS sees it.
   *
   * Left to itself SheetJS reads a csv as Latin-1, so a file whose header
   * says "Péremption" arrives as "PÃ©remption", no column matches it, and
   * every expiry date in the file goes unchecked. Asking for codepage 65001
   * does not help either: the browser build ships without the codepage
   * tables and says so in the console. Handing it a string sidesteps both.
   *
   * A .xlsx carries its own encoding, so it goes through as bytes.
   */
  const isText = /\.(csv|txt|tsv)$/i.test(file.name) || file.type.startsWith("text/");
  const workbook = isText
    ? read(await file.text(), { type: "string", cellDates: false })
    : read(await file.arrayBuffer(), { cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return {
      products: [],
      problems: [],
      missingColumns: ["name", "price"],
      blankRows: 0,
      truncated: false,
    };
  }

  const rows = utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: true,
    defval: "",
  });
  return parseProducts(rows, pack);
}

/** Builds the template for this pack and hands it to the browser to save. */
export async function downloadTemplate(
  pack: Pack,
  language: AppLanguage,
  filename: string
): Promise<void> {
  const { utils, writeFile } = await import("xlsx");
  const fields = fieldsFor(pack);

  const rows = [
    fields.map((field) => headers[field][language]),
    ...examples[pack].map((row) => fields.map((field) => row[field])),
  ];

  const sheet = utils.aoa_to_sheet(rows);
  sheet["!cols"] = fields.map(() => ({ wch: 22 })); // not-a-rule: column width
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, "Produits");
  writeFile(workbook, filename, { compression: true });
}
