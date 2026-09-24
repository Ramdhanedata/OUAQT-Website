import type { ImportedProduct } from "./parse";

/*
 * The same product entered twice, and the two that only look alike.
 *
 * "Savon Alpha" and "savon alpha " are one product typed twice. "Savon Alpha
 * 500" and "Savon Alpha 1000" are two products, and merging them would put
 * the wrong strength in a customer's hand. Everything here exists to keep
 * that difference: the numbers in a name are part of the name.
 *
 * What is ignored: capitals, accents, repeated spaces, punctuation, and the
 * space between a number and its unit, so "500 mg" and "500mg" are one thing.
 */

export function productKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    /* "500 mg" and "500mg" are the same thing written twice. */
    .replace(/(\d)\s+(?=[\p{L}])/gu, "$1");
}

export type DuplicateGroup = {
  key: string;
  rows: ImportedProduct[];
  /** True when they agree on price, so merging is only about quantity. */
  samePrice: boolean;
};

export function findDuplicates(products: ImportedProduct[]): DuplicateGroup[] {
  const groups = new Map<string, ImportedProduct[]>();

  for (const product of products) {
    const key = productKey(product.name);
    if (key === "") continue;
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }

  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => ({
      key,
      rows,
      samePrice: rows.every((row) => row.price === rows[0].price),
    }));
}

export type DuplicateChoice = "keep_first" | "keep_all" | "merge_quantities";

/**
 * Applies what he chose about one group.
 *
 * Merging adds the quantities together and keeps the first row's price and
 * details, because two lines for one product are nearly always the same
 * product counted in two places.
 */
export function resolve(
  products: ImportedProduct[],
  group: DuplicateGroup,
  choice: DuplicateChoice
): ImportedProduct[] {
  if (choice === "keep_all") return products;

  const ids = new Set(group.rows.map((row) => row.row));
  const first = group.rows[0];
  const merged: ImportedProduct =
    choice === "merge_quantities"
      ? {
          ...first,
          quantity: group.rows.reduce((sum, row) => sum + row.quantity, 0),
        }
      : first;

  const out: ImportedProduct[] = [];
  let placed = false;
  for (const product of products) {
    if (!ids.has(product.row)) {
      out.push(product);
      continue;
    }
    if (!placed) {
      out.push(merged);
      placed = true;
    }
  }
  return out;
}
