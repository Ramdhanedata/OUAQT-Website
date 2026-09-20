/*
 * Reading what people actually typed into a spreadsheet.
 *
 * The file an owner sends is not the template we gave him. It has prices
 * written "1 200,50 MRU", quantities with a stray apostrophe, dates as
 * 12/2026 because the box only shows a month and a year, and a dozen empty
 * rows at the bottom where somebody pressed Enter. None of that is a mistake
 * on his part, so none of it should be an error on ours.
 *
 * not-a-rule-file: what follows is arithmetic about text, not a rule anybody
 * administers.
 */

/** A cell that holds nothing worth reading. */
export function isBlank(cell: unknown): boolean {
  return cell === null || cell === undefined || String(cell).trim() === "";
}

export function isBlankRow(cells: unknown[]): boolean {
  return cells.every(isBlank);
}

export function text(cell: unknown): string {
  return String(cell ?? "").trim();
}

/*
 * A price or a quantity, whichever way it was written.
 *
 * French writes 1 200,50 and English 1,200.50, and the same file often has
 * both because two people filled it in. The rule used here is the last
 * separator wins: whichever of . or , comes last is the decimal point, and
 * everything before it is grouping.
 */
export function parseNumber(cell: unknown): number | null {
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;
  if (isBlank(cell)) return null;

  let raw = text(cell)
    /*
     * The currency, at either end, with or without a space before it. Not
     * anywhere in the middle: "350mru" is a price, but a cell that happens to
     * contain those letters elsewhere is not one to start editing.
     */
    .replace(/^(MRU|UM|MRO)\s*/i, "")
    .replace(/\s*(MRU|UM|MRO)$/i, "")
    // Spaces used for grouping, including the narrow ones Excel inserts.
    .replace(/[\s  ']/g, "")
    .trim();

  if (raw === "") return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? "," : ".";
    const grouping = decimal === "," ? "." : ",";
    raw = raw.split(grouping).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    raw = raw.replace(",", ".");
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/*
 * An expiry date.
 *
 * Accepts a month and a year, because that is what is printed on a box, and
 * a full date when there is one. A month alone means the end of that month:
 * a box marked 12/2026 is good until the last day of December.
 *
 * Excel hands over a serial number when the cell was formatted as a date,
 * counting days from 1900 with its own famous mistake about that year.
 */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const MS_IN_A_DAY = 86_400_000;

export function parseExpiry(cell: unknown): string | null {
  if (isBlank(cell)) return null;

  if (typeof cell === "number" && cell > 0) {
    const date = new Date(EXCEL_EPOCH + cell * MS_IN_A_DAY);
    return Number.isFinite(date.getTime()) ? iso(date) : null;
  }

  const raw = text(cell);

  const monthYear = raw.match(/^(\d{1,2})\s*[/\-.]\s*(\d{2}|\d{4})$/);
  if (monthYear) {
    const month = Number(monthYear[1]);
    const year = fullYear(Number(monthYear[2]));
    if (month < 1 || month > 12) return null;
    return iso(new Date(Date.UTC(year, month, 0)));
  }

  const dayMonthYear = raw.match(
    /^(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{2}|\d{4})$/
  );
  if (dayMonthYear) {
    const day = Number(dayMonthYear[1]);
    const month = Number(dayMonthYear[2]);
    const year = fullYear(Number(dayMonthYear[3]));
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return iso(new Date(Date.UTC(year, month - 1, day)));
  }

  const isoLike = raw.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (isoLike) {
    const year = Number(isoLike[1]);
    const month = Number(isoLike[2]);
    if (month < 1 || month > 12) return null;
    const day = isoLike[3] ? Number(isoLike[3]) : 0;
    return iso(
      day > 0
        ? new Date(Date.UTC(year, month - 1, day))
        : new Date(Date.UTC(year, month, 0))
    );
  }

  return null;
}

function fullYear(value: number): number {
  return value < 100 ? 2000 + value : value;
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
