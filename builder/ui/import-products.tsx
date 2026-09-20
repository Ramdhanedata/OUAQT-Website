"use client";

import { useMemo, useRef, useState } from "react";
import { formatMoney, type AppLanguage } from "@/app-ui";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { importFields, type ColumnMap, type ImportField } from "@/builder/import/columns";
import type { DuplicateChoice, DuplicateGroup } from "@/builder/import/duplicates";
import { resolve } from "@/builder/import/duplicates";
import { downloadTemplate, readWorkbook, UnreadableFile, type Workbook } from "@/builder/import/file";
import { toNewOuguiya } from "@/builder/import/currency";
import {
  parseProducts,
  type ImportedProduct,
  type ProblemCode,
  type RowProblem,
} from "@/builder/import/parse";
import { text } from "@/builder/import/normalise";
import { Button } from "@/components/ui/button";
import { fill, plural } from "@/lib/utils";
import { ChoiceButton, Field, TextInput } from "./fields";

/*
 * Importing the spreadsheet he already has.
 *
 * The parser answers everything it can on its own. What is left is a short
 * series of questions, each asked only when it has to be: which sheet, which
 * column, which money, and what to do about a product entered twice. Between
 * them he sees his own first five products exactly as they will be imported,
 * because that is the moment he can tell whether we have understood his file.
 *
 * Nothing here goes to the AI. His product list is his business.
 */

/** What he told us last time about his own column names. */
const REMEMBERED = "ouaqt.import.columns";

type Stage = "sheet" | "map" | "currency" | "review";

/** Which of his columns is which, kept between imports. */
function remember(pack: Pack, columns: ColumnMap) {
  try {
    const byHeader: Record<string, ImportField> = {};
    for (const field of importFields) {
      const column = columns[field];
      if (column?.header) byHeader[column.header.toLowerCase()] = field;
    }
    window.localStorage.setItem(`${REMEMBERED}.${pack}`, JSON.stringify(byHeader));
  } catch {
    // A full or blocked storage costs him one extra question next time.
  }
}

function recall(pack: Pack): Record<string, ImportField> {
  try {
    const raw = window.localStorage.getItem(`${REMEMBERED}.${pack}`);
    return raw ? (JSON.parse(raw) as Record<string, ImportField>) : {};
  } catch {
    return {};
  }
}

export function ImportProducts({
  copy,
  language,
  pack,
  kept,
  onKeep,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  kept: ImportedProduct[] | null;
  onKeep: (products: ImportedProduct[] | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnMap | undefined>(undefined);
  const [currency, setCurrency] = useState<"new" | "old" | undefined>(undefined);
  const [fixes, setFixes] = useState<Record<number, Partial<Record<ImportField, string>>>>({});
  const [resolved, setResolved] = useState<Record<string, DuplicateChoice>>({});
  const [reading, setReading] = useState(false);
  const [unreadable, setUnreadable] = useState(false);

  /* His corrections are written back into the sheet, then everything is read
     again, so a fixed row goes through exactly the same rules as the rest. */
  const rows = useMemo(() => {
    if (!workbook || !sheet) return null;
    const original = workbook.rows[sheet] ?? [];
    if (Object.keys(fixes).length === 0) return original;

    const copyOfRows = original.map((row) => [...row]);
    const map = columns ?? {};
    for (const [rowNumber, byField] of Object.entries(fixes)) {
      const index = Number(rowNumber) - 1;
      if (!copyOfRows[index]) continue;
      for (const [field, value] of Object.entries(byField)) {
        const column = map[field as ImportField];
        if (column) copyOfRows[index][column.index] = value;
      }
    }
    return copyOfRows;
  }, [workbook, sheet, fixes, columns]);

  const result = useMemo(
    () => (rows ? parseProducts(rows, pack, { columns, currency }) : null),
    [rows, pack, columns, currency]
  );

  async function take(file: File | undefined) {
    if (!file) return;
    setUnreadable(false);
    setReading(true);
    setFixes({});
    setResolved({});
    setCurrency(undefined);
    onKeep(null);

    try {
      const opened = await readWorkbook(file, pack);
      setWorkbook(opened);

      const withRows = opened.sheets.filter((one) => one.rowCount > 0);
      const obvious =
        withRows.length === 1
          ? withRows[0].name
          : withRows.filter((one) => one.score > 0).length === 1
            ? withRows.find((one) => one.score > 0)!.name
            : null;
      setSheet(obvious);

      /* What he told us last time about his own column names. */
      const known = recall(pack);
      if (obvious && Object.keys(known).length > 0) {
        const guessed = guessFromMemory(opened.rows[obvious] ?? [], known, pack);
        if (guessed) setColumns(guessed);
      } else {
        setColumns(undefined);
      }
    } catch (caught) {
      if (caught instanceof UnreadableFile) setUnreadable(true);
      else setUnreadable(true);
      setWorkbook(null);
    } finally {
      setReading(false);
    }
  }

  const stage: Stage | null = !workbook
    ? null
    : !sheet
      ? "sheet"
      : result && result.missingColumns.length > 0 && !columns
        ? "map"
        : result?.currency.ask && currency === undefined
          ? "currency"
          : "review";

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">{copy.products.heading}</h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        {copy.products.help}
      </p>

      <input
        ref={input}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        onChange={(event) => void take(event.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => input.current?.click()}>
          {workbook ? copy.products.another : copy.products.choose}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void downloadTemplate(pack, language, `ouaqt-${pack}.xlsx`)}
        >
          {copy.products.template}
        </Button>
      </div>

      {reading ? (
        <p className="text-base text-muted-foreground">{copy.products.reading}</p>
      ) : null}

      {unreadable ? (
        <p className="text-base leading-relaxed text-destructive">
          {copy.products.unreadable}
        </p>
      ) : null}

      {stage === "sheet" && workbook ? (
        <WhichSheet copy={copy} workbook={workbook} onPick={setSheet} />
      ) : null}

      {stage === "map" && rows && result ? (
        <WhichColumns
          copy={copy}
          rows={rows}
          current={result.columns}
          onDone={(picked) => {
            setColumns(picked);
            remember(pack, picked);
          }}
        />
      ) : null}

      {stage === "currency" && result ? (
        <WhichMoney
          copy={copy}
          language={language}
          samples={result.products.slice(0, 3)}
          onPick={setCurrency}
        />
      ) : null}

      {stage === "review" && result ? (
        <Review
          copy={copy}
          language={language}
          result={result}
          resolved={resolved}
          onResolve={(key, choice) => setResolved((all) => ({ ...all, [key]: choice }))}
          fixes={fixes}
          onFix={(row, field, value) =>
            setFixes((all) => ({ ...all, [row]: { ...all[row], [field]: value } }))
          }
          kept={kept}
          onKeep={onKeep}
        />
      ) : null}
    </section>
  );
}

/** Rebuilds a column map from what he chose last time, if his headers match. */
function guessFromMemory(
  rows: unknown[][],
  known: Record<string, ImportField>,
  pack: Pack
): ColumnMap | null {
  const fromFile = parseProducts(rows, pack);
  const header = rows[fromFile.headerRow - 1];
  if (!header) return null;

  const map: ColumnMap = {};
  header.forEach((cell, index) => {
    const field = known[text(cell).toLowerCase()];
    if (field && !map[field]) map[field] = { index, header: text(cell) };
  });
  return map.name && map.price ? map : null;
}

function WhichSheet({
  copy,
  workbook,
  onPick,
}: {
  copy: BuilderCopy;
  workbook: Workbook;
  onPick: (name: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-foreground">
        {copy.products.whichSheet}
      </h3>
      {workbook.sheets.map((sheet) => (
        <ChoiceButton
          key={sheet.name}
          onClick={() => onPick(sheet.name)}
          note={fill(copy.products.sheetRows as string, { count: sheet.rowCount })}
        >
          <span className="font-medium">{sheet.name}</span>
          <span className="mt-1 block text-base text-muted-foreground">
            {sheet.preview[0]?.filter(Boolean).slice(0, 4).join(" · ")}
          </span>
        </ChoiceButton>
      ))}
    </div>
  );
}

function WhichColumns({
  copy,
  rows,
  current,
  onDone,
}: {
  copy: BuilderCopy;
  rows: unknown[][];
  current: ColumnMap;
  onDone: (columns: ColumnMap) => void;
}) {
  const [picked, setPicked] = useState<ColumnMap>(current);

  /* His own column titles, as they are written in his file. */
  const headerIndex = rows.findIndex((row) => row.some((cell) => text(cell) !== ""));
  const header = rows[headerIndex] ?? [];

  const asked: { field: ImportField; what: string }[] = [
    { field: "name", what: copy.products.columnName as string },
    { field: "price", what: copy.products.columnPrice as string },
    { field: "quantity", what: copy.products.columnQuantity as string },
  ];

  return (
    <div className="space-y-8">
      {asked.map(({ field, what }) => (
        <fieldset key={field}>
          <legend className="text-base font-medium text-foreground">
            {fill(copy.products.whichColumn as string, { what })}
          </legend>
          <div className="mt-3 space-y-2">
            {header.map((cell, index) => {
              const label = text(cell);
              if (label === "") return null;
              return (
                <ChoiceButton
                  key={index}
                  selected={picked[field]?.index === index}
                  onClick={() =>
                    setPicked((all) => ({ ...all, [field]: { index, header: label } }))
                  }
                >
                  {label}
                </ChoiceButton>
              );
            })}
          </div>
        </fieldset>
      ))}

      <Button
        type="button"
        variant="accent"
        disabled={!picked.name || !picked.price}
        onClick={() => onDone(picked)}
      >
        {copy.products.confirm}
      </Button>
    </div>
  );
}

function WhichMoney({
  copy,
  language,
  samples,
  onPick,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  samples: ImportedProduct[];
  onPick: (choice: "new" | "old") => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium leading-relaxed text-foreground">
        {copy.products.currencyQuestion}
      </h3>

      {samples.length > 0 ? (
        <div className="rounded-lg border border-border p-3">
          <p className="text-base text-muted-foreground">
            {copy.products.currencyCheck}
          </p>
          <ul className="mt-2 space-y-1">
            {samples.map((product) => (
              <li key={product.row} className="text-base text-foreground">
                {product.name}{" "}
                <bdi dir="ltr">{formatMoney(toNewOuguiya(product.price), language)}</bdi>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <ChoiceButton onClick={() => onPick("new")}>
          {copy.products.currencyNew}
        </ChoiceButton>
        <ChoiceButton onClick={() => onPick("old")}>
          {copy.products.currencyOld}
        </ChoiceButton>
      </div>
    </div>
  );
}

function Review({
  copy,
  language,
  result,
  resolved,
  onResolve,
  fixes,
  onFix,
  kept,
  onKeep,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  result: ReturnType<typeof parseProducts>;
  resolved: Record<string, DuplicateChoice>;
  onResolve: (key: string, choice: DuplicateChoice) => void;
  fixes: Record<number, Partial<Record<ImportField, string>>>;
  onFix: (row: number, field: ImportField, value: string) => void;
  kept: ImportedProduct[] | null;
  onKeep: (products: ImportedProduct[] | null) => void;
}) {
  const said: Record<ProblemCode, string> = {
    missing_name: copy.products.missingName as string,
    missing_price: copy.products.missingPrice as string,
    bad_price: copy.products.badPrice as string,
    zero_price: copy.products.zeroPrice as string,
    negative_price: copy.products.negativePrice as string,
    bad_quantity: copy.products.badQuantity as string,
    bad_expiry: copy.products.badExpiry as string,
  };

  /* Whatever he decided about each pair of duplicates, applied in order. */
  const products = useMemo(() => {
    let out = result.products;
    for (const group of result.duplicates) {
      const choice = resolved[group.key];
      if (choice) out = resolve(out, group, choice);
    }
    return out;
  }, [result, resolved]);

  const undecided = result.duplicates.filter((group) => !resolved[group.key]);
  const SHOWN = 10; // not-a-rule: how many problem lines fit on a phone
  const PREVIEW = 5; // not-a-rule: the brief asks for five

  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed text-foreground">
        {plural(language, products.length, copy.products.ready)}{" "}
        {result.problems.length > 0
          ? plural(language, result.problems.length, copy.products.toFix)
          : null}
      </p>

      <p className="text-base text-muted-foreground">
        {fill(copy.products.headerFound as string, { row: result.headerRow })}
        {result.totalRows > 0
          ? ` ${fill(
              (result.totalRows === 1
                ? copy.products.totalsSkipped
                : copy.products.totalsSkippedOther) as string,
              { count: result.totalRows }
            )}`
          : ""}
      </p>

      {result.truncated ? (
        <p className="text-base text-muted-foreground">{copy.products.truncated}</p>
      ) : null}

      {undecided.length > 0 ? (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <h3 className="text-base font-medium text-foreground">
            {copy.products.duplicates}
          </h3>
          {undecided.map((group) => (
            <Duplicate
              key={group.key}
              copy={copy}
              language={language}
              group={group}
              onChoose={(choice) => onResolve(group.key, choice)}
            />
          ))}
        </div>
      ) : null}

      {products.length > 0 ? (
        <div>
          <p className="text-base text-muted-foreground">{copy.products.preview}</p>
          <ul className="mt-2 divide-y divide-border">
            {products.slice(0, PREVIEW).map((product) => (
              <li key={product.row} className="flex justify-between gap-4 py-2">
                <span className="text-base text-foreground">{product.name}</span>
                <span className="text-base text-muted-foreground">
                  <bdi dir="ltr">{formatMoney(product.price, language)}</bdi>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.problems.slice(0, SHOWN).map((problem) => (
        <Fixable
          key={`${problem.row}-${problem.code}`}
          copy={copy}
          problem={problem}
          said={said[problem.code]}
          value={fixes[problem.row]?.[fieldOf(problem.code)] ?? ""}
          onFix={(value) => onFix(problem.row, fieldOf(problem.code), value)}
        />
      ))}

      {result.warnings.slice(0, SHOWN).map((warning) => (
        <p
          key={`${warning.row}-${warning.code}`}
          className="text-base leading-relaxed text-muted-foreground"
        >
          {fill(copy.products.pastExpiry as string, {
            row: warning.row,
            found: warning.found ?? "",
          })}
        </p>
      ))}

      {products.length > 0 ? (
        <Button
          type="button"
          variant={kept ? "outline" : "accent"}
          onClick={() => onKeep(kept ? null : products)}
        >
          {copy.products.keep}
        </Button>
      ) : null}
    </div>
  );
}

/** Which cell a problem is about, so his correction goes in the right column. */
function fieldOf(code: ProblemCode): ImportField {
  if (code === "missing_name") return "name";
  if (code === "bad_quantity") return "quantity";
  if (code === "bad_expiry") return "expiry";
  return "price";
}

function Fixable({
  copy,
  problem,
  said,
  value,
  onFix,
}: {
  copy: BuilderCopy;
  problem: RowProblem;
  said: string;
  value: string;
  onFix: (value: string) => void;
}) {
  const [text, setText] = useState(value);

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-base leading-relaxed text-muted-foreground">
        {fill(copy.products.problem as string, {
          row: problem.row,
          what: said,
          column: problem.column,
        })}
        {problem.found ? ` (${problem.found})` : ""}
      </p>
      <div className="mt-2 flex gap-3">
        <TextInput value={text} onChange={setText} />
        <Button
          type="button"
          variant="outline"
          disabled={text.trim() === ""}
          onClick={() => onFix(text.trim())}
        >
          {copy.products.fixRow}
        </Button>
      </div>
    </div>
  );
}

function Duplicate({
  copy,
  language,
  group,
  onChoose,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  group: DuplicateGroup;
  onChoose: (choice: DuplicateChoice) => void;
}) {
  return (
    <div className="space-y-3">
      <ul>
        {group.rows.map((row) => (
          <li key={row.row} className="text-base text-foreground">
            {row.name} · <bdi dir="ltr">{formatMoney(row.price, language)}</bdi> ·{" "}
            {row.quantity}
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <ChoiceButton onClick={() => onChoose("keep_first")}>
          {copy.products.keepFirst}
        </ChoiceButton>
        <ChoiceButton onClick={() => onChoose("merge_quantities")}>
          {copy.products.mergeQuantities}
        </ChoiceButton>
        <ChoiceButton onClick={() => onChoose("keep_all")}>
          {copy.products.keepAll}
        </ChoiceButton>
      </div>
    </div>
  );
}

export { Field };
