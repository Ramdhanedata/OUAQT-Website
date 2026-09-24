import type { Pack } from "@/app-ui/packs";
import { fieldsFor, findColumns } from "./columns";
import { isBlankRow, text } from "./normalise";

/*
 * Finding the table inside the file.
 *
 * An owner's spreadsheet rarely starts with its own header. Above it there is
 * the shop's name, a date, sometimes a merged title across five columns and
 * two blank rows for good measure. Below it there is a TOTAL. None of that is
 * a mistake on his part, so none of it is an error on ours: the table is
 * found rather than assumed to be at the top.
 *
 * not-a-rule-file: how far to look and how much to show, not anything anybody
 * administers.
 */

/** How many rows down to look for the header before giving up. */
const LOOK_DOWN = 25;

/*
 * A row that adds the column up rather than describing a product.
 *
 * The boundary at the end is a Unicode one, not \b. JavaScript's \b is
 * defined on ASCII word characters, so after an Arabic letter there is never
 * a boundary and "المجموع" matched nothing at all. This says instead: not
 * followed by another letter or digit, which is what was meant, and still
 * leaves "Totalisateur" alone.
 */
const TOTAL_WORDS =
  /^(?:total|totaux|total\s+g[ée]n[ée]ral|sous[-\s]?total|somme|cumul|المجموع|مجموع|الإجمالي|الاجمالي|الجملة)(?![\p{L}\p{N}])/iu;

export function isTotalRow(row: unknown[]): boolean {
  return row.some((cell) => TOTAL_WORDS.test(text(cell)));
}

/**
 * How well a row reads as a header: how many of this pack's columns it names.
 *
 * A row of products scores nothing, because "Savon antiseptique" is not the
 * name of a column. That is what separates the two.
 */
export function headerScore(row: unknown[], pack: Pack): number {
  const found = findColumns(row, pack);
  return Object.keys(found).length;
}

export type HeaderGuess = {
  /** Index into the rows given, or -1 when nothing looked like a header. */
  index: number;
  score: number;
  /** True when the name and the price were both found. */
  confident: boolean;
};

export function findHeaderRow(rows: unknown[][], pack: Pack): HeaderGuess {
  let best: HeaderGuess = { index: -1, score: 0, confident: false };

  rows.slice(0, LOOK_DOWN).forEach((row, index) => {
    if (isBlankRow(row)) return;

    const found = findColumns(row, pack);
    const score = Object.keys(found).length;
    const confident = Boolean(found.name && found.price);

    /*
     * A better row wins; an equal row does not. The first row that names its
     * columns is the header, and anything further down that scores the same
     * is more likely to be a second table or a repeated heading.
     */
    if (score > best.score || (confident && !best.confident)) {
      best = { index, score, confident };
    }
  });

  return best.score > 0 ? best : { index: -1, score: 0, confident: false };
}

export type SheetSummary = {
  name: string;
  rowCount: number;
  /** The first few rows, for showing him which sheet is which. */
  preview: string[][];
  /** How well this sheet looks like a product list. */
  score: number;
};

/** Enough about each sheet for an owner to point at the right one. */
export function describeSheet(
  name: string,
  rows: unknown[][],
  pack: Pack
): SheetSummary {
  const PREVIEW_ROWS = 4;
  const PREVIEW_COLUMNS = 6;
  const header = findHeaderRow(rows, pack);

  return {
    name,
    rowCount: rows.filter((row) => !isBlankRow(row)).length,
    preview: rows
      .slice(0, PREVIEW_ROWS)
      .map((row) => row.slice(0, PREVIEW_COLUMNS).map((cell) => text(cell))),
    score: header.score,
  };
}

/** The sheet most likely to hold his products: the one that names the most columns. */
export function bestSheet(sheets: SheetSummary[]): string | null {
  const ranked = [...sheets].sort((a, b) => b.score - a.score || b.rowCount - a.rowCount);
  return ranked[0]?.score > 0 ? ranked[0].name : null;
}

export { fieldsFor };
