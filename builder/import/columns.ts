/*
 * Working out which column is which.
 *
 * The owner may be using the template we gave him, a file his supplier sent,
 * or a sheet he has kept for years. The headers are matched loosely, in the
 * three languages, with accents and case ignored, so "Désignation", "PRODUIT"
 * and "الاسم" all mean the same column.
 */

import type { Pack } from "@/app-ui/packs";

export const importFields = [
  "name",
  "price",
  "quantity",
  "barcode",
  "expiry",
  "batch",
  "unit",
  "location",
  "soldBy",
] as const;

export type ImportField = (typeof importFields)[number];

const aliases: Record<ImportField, string[]> = {
  name: ["nom", "name", "designation", "produit", "article", "libelle", "الاسم", "المنتج", "اسم المنتج"],
  price: ["prix", "price", "prix de vente", "pv", "tarif", "السعر", "سعر البيع"],
  quantity: ["quantite", "qte", "stock", "quantity", "qty", "الكمية", "المخزون"],
  barcode: ["code", "code barres", "code barre", "codebarres", "barcode", "ean", "الباركود", "رمز"],
  expiry: ["peremption", "date de peremption", "expiration", "expiry", "exp", "تاريخ الانتهاء", "الصلاحية"],
  batch: ["lot", "numero de lot", "batch", "رقم التشغيلة", "التشغيلة"],
  unit: ["unite", "unit", "conditionnement", "الوحدة"],
  location: ["lieu", "emplacement", "location", "depot", "magasin", "الموقع", "المخزن"],
  soldBy: ["vendu par", "vente", "sold by", "unite de vente", "طريقة البيع"],
};

/** Which columns a pack can use. Anything else in the file is left alone. */
export function fieldsFor(pack: Pack): ImportField[] {
  const base: ImportField[] = ["name", "price", "quantity", "barcode"];
  if (pack === "pharmacy") return [...base, "expiry", "batch"];
  if (pack === "bakery") return [...base, "soldBy"];
  if (pack === "warehouse") return [...base, "unit", "location"];
  return base;
}

/** Accents off, case down, punctuation out: how two headers are compared. */
export function simplify(header: unknown): string {
  return String(header ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

export type ColumnMap = Partial<Record<ImportField, { index: number; header: string }>>;

/**
 * Matches the header row to the fields this pack understands.
 *
 * An exact match wins over a partial one, so a file with both "Prix" and
 * "Prix d'achat" puts the selling price where it belongs.
 */
export function findColumns(header: unknown[], pack: Pack): ColumnMap {
  const wanted = fieldsFor(pack);
  const simplified = header.map(simplify);
  const map: ColumnMap = {};
  const used = new Set<number>();

  for (const pass of ["exact", "partial"] as const) {
    for (const field of wanted) {
      if (map[field]) continue;

      const index = simplified.findIndex((cell, position) => {
        if (used.has(position) || cell === "") return false;
        return pass === "exact"
          ? aliases[field].includes(cell)
          : aliases[field].some((alias) => cell.includes(alias));
      });

      if (index >= 0) {
        map[field] = { index, header: String(header[index] ?? "").trim() };
        used.add(index);
      }
    }
  }
  return map;
}
