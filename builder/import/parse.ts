import type { Pack } from "@/app-ui/packs";
import { findColumns, type ColumnMap, type ImportField } from "./columns";
import { isBlankRow, parseExpiry, parseNumber, text } from "./normalise";

/*
 * Turning a spreadsheet into products, and saying plainly what could not be
 * turned into one.
 *
 * Nothing here throws. A file with four hundred good rows and seven bad ones
 * is four hundred products and seven things to fix, not a failure. The owner
 * saves what worked and comes back to the rest.
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
  | "bad_quantity"
  | "bad_expiry";

export type RowProblem = {
  /** The line number the owner sees in his spreadsheet, header included. */
  row: number;
  column: string;
  code: ProblemCode;
};

export type ImportResult = {
  products: ImportedProduct[];
  problems: RowProblem[];
  /** Columns we could not find at all, by field. */
  missingColumns: ImportField[];
  blankRows: number;
  truncated: boolean;
};

export function parseProducts(rows: unknown[][], pack: Pack): ImportResult {
  const problems: RowProblem[] = [];
  const products: ImportedProduct[] = [];
  let blankRows = 0;

  const headerIndex = rows.findIndex((row) => !isBlankRow(row));
  if (headerIndex < 0) {
    return { products, problems, missingColumns: ["name", "price"], blankRows, truncated: false };
  }

  const columns = findColumns(rows[headerIndex], pack);
  const missingColumns = (["name", "price"] as ImportField[]).filter(
    (field) => !columns[field]
  );
  if (missingColumns.length > 0) {
    return { products, problems, missingColumns, blankRows, truncated: false };
  }

  const body = rows.slice(headerIndex + 1);
  const truncated = body.length > MAX_ROWS;

  body.slice(0, MAX_ROWS).forEach((row, offset) => {
    // The number he will look for in his own file: one for the header, one
    // because spreadsheets start at 1.
    const number = headerIndex + offset + 2;

    if (isBlankRow(row)) {
      blankRows += 1;
      return;
    }

    const name = text(cell(row, columns, "name"));
    const rawPrice = cell(row, columns, "price");
    const price = parseNumber(rawPrice);

    if (name === "") {
      problems.push({ row: number, column: label(columns, "name"), code: "missing_name" });
      return;
    }
    if (rawPrice === undefined || String(rawPrice ?? "").trim() === "") {
      problems.push({ row: number, column: label(columns, "price"), code: "missing_price" });
      return;
    }
    if (price === null || price < 0) {
      problems.push({ row: number, column: label(columns, "price"), code: "bad_price" });
      return;
    }

    const rawQuantity = cell(row, columns, "quantity");
    const quantity = parseNumber(rawQuantity);
    if (rawQuantity !== undefined && String(rawQuantity ?? "").trim() !== "" && quantity === null) {
      problems.push({ row: number, column: label(columns, "quantity"), code: "bad_quantity" });
      return;
    }

    const rawExpiry = cell(row, columns, "expiry");
    const expiry = parseExpiry(rawExpiry);
    if (rawExpiry !== undefined && String(rawExpiry ?? "").trim() !== "" && expiry === null) {
      problems.push({ row: number, column: label(columns, "expiry"), code: "bad_expiry" });
      return;
    }

    products.push({
      row: number,
      name,
      price,
      quantity: quantity ?? 0,
      ...optional("barcode", text(cell(row, columns, "barcode"))),
      ...(expiry ? { expiry } : {}),
      ...optional("batch", text(cell(row, columns, "batch"))),
      ...optional("unit", text(cell(row, columns, "unit"))),
      ...optional("location", text(cell(row, columns, "location"))),
      ...optional("soldBy", text(cell(row, columns, "soldBy"))),
    });
  });

  return { products, problems, missingColumns, blankRows, truncated };
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
