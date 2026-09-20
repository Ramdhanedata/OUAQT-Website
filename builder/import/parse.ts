import type { Pack } from "@/app-ui/packs";
import { findColumns, type ColumnMap, type ImportField } from "./columns";
import { currencyDoubt, toNewOuguiya, type CurrencyDoubt } from "./currency";
import { findDuplicates, type DuplicateGroup } from "./duplicates";
import {
  code,
  isBlankRow,
  parseExpiry,
  parseNumber,
  parseQuantity,
  text,
} from "./normalise";
import { findHeaderRow, isTotalRow } from "./table";

/*
 * Turning a spreadsheet into products, and saying plainly what could not be
 * turned into one.
 *
 * Nothing here throws. A file with four hundred good rows and seven bad ones
 * is four hundred products and seven things to fix, not a failure. The owner
 * saves what worked and comes back to the rest.
 *
 * Two kinds of complaint, and the difference matters to him:
 *
 *   problems  the row cannot be imported as it stands. A missing name, a
 *             price that is not a number, a price of zero.
 *   warnings  the row is imported and is worth a look. A date already past
 *             is the common one, and it is usually true rather than wrong.
 *
 * not-a-rule-file: the row ceiling is a size, not a commercial limit.
 */

/** As many rows as a shop's whole catalogue, and no more. */
export const MAX_ROWS = 10_000;

export type ImportedProduct = {
  row: number;
  name: string;
  price: number;
  quantity: number;
  /** The word he wrote beside a quantity: "boîtes", "cartons". */
  quantityUnit?: string;
  barcode?: string;
  expiry?: string;
  batch?: string;
  unit?: string;
  location?: string;
  soldBy?: string;
};

export type ProblemCode =
  | "missing_name"
  | "missing_price"
  | "bad_price"
  | "zero_price"
  | "negative_price"
  | "bad_quantity"
  | "bad_expiry";

export type WarningCode = "past_expiry";

export type RowProblem = {
  /** The line number he will look for in his own file. */
  row: number;
  column: string;
  code: ProblemCode;
  /** What was in the cell, so he can see what we saw. */
  found?: string;
};

export type RowWarning = { row: number; column: string; code: WarningCode; found?: string };

export type ImportResult = {
  products: ImportedProduct[];
  problems: RowProblem[];
  warnings: RowWarning[];
  /** Columns that could not be matched at all, by field. */
  missingColumns: ImportField[];
  columns: ColumnMap;
  /** Where the table turned out to start, as a line number in his file. */
  headerRow: number;
  blankRows: number;
  totalRows: number;
  truncated: boolean;
  currency: CurrencyDoubt;
  duplicates: DuplicateGroup[];
};

export type ParseOptions = {
  /** His own answers to "which column is the price", when we had to ask. */
  columns?: ColumnMap;
  /** Set once he has told us which money his prices are in. */
  currency?: "new" | "old";
  /** For deciding whether a date is in the past. */
  now?: Date;
};

const empty = (pack: Pack): ImportResult => ({
  products: [],
  problems: [],
  warnings: [],
  missingColumns: ["name", "price"],
  columns: {},
  headerRow: 0,
  blankRows: 0,
  totalRows: 0,
  truncated: false,
  currency: currencyDoubt({ pack, priceHeader: "", priceCells: [], prices: [] }),
  duplicates: [],
});

export function parseProducts(
  rows: unknown[][],
  pack: Pack,
  options: ParseOptions = {}
): ImportResult {
  const header = findHeaderRow(rows, pack);
  const headerIndex = options.columns
    ? Math.max(0, header.index)
    : header.index;

  if (headerIndex < 0) return empty(pack);

  const columns = options.columns ?? findColumns(rows[headerIndex], pack);
  const missingColumns = (["name", "price"] as ImportField[]).filter(
    (field) => !columns[field]
  );
  if (missingColumns.length > 0) {
    return { ...empty(pack), columns, missingColumns, headerRow: headerIndex + 1 };
  }

  const problems: RowProblem[] = [];
  const warnings: RowWarning[] = [];
  const products: ImportedProduct[] = [];
  const priceCells: unknown[] = [];
  let blankRows = 0;
  let totalRows = 0;

  const body = rows.slice(headerIndex + 1);
  const truncated = body.length > MAX_ROWS;
  const now = options.now ?? new Date();
  const today = now.toISOString().slice(0, 10);

  body.slice(0, MAX_ROWS).forEach((row, offset) => {
    // One for the header, one because spreadsheets start counting at 1.
    const number = headerIndex + offset + 2;

    if (isBlankRow(row)) {
      blankRows += 1;
      return;
    }

    /* A row that adds the column up is not a product. */
    if (isTotalRow(row)) {
      totalRows += 1;
      return;
    }

    const name = text(cell(row, columns, "name"));
    const rawPrice = cell(row, columns, "price");
    priceCells.push(rawPrice);

    if (name === "") {
      problems.push({ row: number, column: label(columns, "name"), code: "missing_name" });
      return;
    }

    if (rawPrice === undefined || text(rawPrice) === "") {
      problems.push({ row: number, column: label(columns, "price"), code: "missing_price" });
      return;
    }

    const read = parseNumber(rawPrice);
    if (read === null) {
      problems.push({
        row: number,
        column: label(columns, "price"),
        code: "bad_price",
        found: text(rawPrice),
      });
      return;
    }

    if (read < 0) {
      problems.push({
        row: number,
        column: label(columns, "price"),
        code: "negative_price",
        found: text(rawPrice),
      });
      return;
    }

    /*
     * A price of zero is not refused because it is impossible; it is refused
     * because it is nearly always a blank cell that Excel filled in, and a
     * product that rings up as free is a bad morning.
     */
    if (read === 0) {
      problems.push({ row: number, column: label(columns, "price"), code: "zero_price" });
      return;
    }

    const price = options.currency === "old" ? toNewOuguiya(read) : read;

    const rawQuantity = cell(row, columns, "quantity");
    const counted = parseQuantity(rawQuantity);
    if (rawQuantity !== undefined && text(rawQuantity) !== "" && counted.value === null) {
      problems.push({
        row: number,
        column: label(columns, "quantity"),
        code: "bad_quantity",
        found: text(rawQuantity),
      });
      return;
    }

    const rawExpiry = cell(row, columns, "expiry");
    const expiry = parseExpiry(rawExpiry);
    if (rawExpiry !== undefined && text(rawExpiry) !== "" && expiry === null) {
      problems.push({
        row: number,
        column: label(columns, "expiry"),
        code: "bad_expiry",
        found: text(rawExpiry),
      });
      return;
    }

    /*
     * A date already past is flagged, never refused. It is usually true: the
     * box really is out of date and he is about to find out from his own
     * stock list, which is the point.
     */
    if (expiry && expiry < today) {
      warnings.push({
        row: number,
        column: label(columns, "expiry"),
        code: "past_expiry",
        found: expiry,
      });
    }

    products.push({
      row: number,
      name,
      price,
      quantity: counted.value ?? 0,
      ...(counted.unit ? { quantityUnit: counted.unit } : {}),
      ...optional("barcode", code(cell(row, columns, "barcode"))),
      ...(expiry ? { expiry } : {}),
      ...optional("batch", code(cell(row, columns, "batch"))),
      ...optional("unit", text(cell(row, columns, "unit"))),
      ...optional("location", text(cell(row, columns, "location"))),
      ...optional("soldBy", text(cell(row, columns, "soldBy"))),
    });
  });

  return {
    products,
    problems,
    warnings,
    missingColumns,
    columns,
    headerRow: headerIndex + 1,
    blankRows,
    totalRows,
    truncated,
    /* Asked about the prices as written, before any conversion. */
    currency:
      options.currency !== undefined
        ? { ask: false, why: null, median: null }
        : currencyDoubt({
            pack,
            priceHeader: label(columns, "price"),
            priceCells,
            prices: products.map((product) => product.price),
          }),
    duplicates: findDuplicates(products),
  };
}

function cell(row: unknown[], columns: ColumnMap, field: ImportField): unknown {
  const column = columns[field];
  return column ? row[column.index] : undefined;
}

function label(columns: ColumnMap, field: ImportField): string {
  return columns[field]?.header ?? field;
}

function optional(key: string, value: string) {
  return value === "" ? {} : { [key]: value };
}
