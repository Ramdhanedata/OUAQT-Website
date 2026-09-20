"use client";

import { useRef, useState } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import { downloadTemplate, readProductFile } from "@/builder/import/file";
import type { ImportedProduct, ImportResult, ProblemCode } from "@/builder/import/parse";
import { Button } from "@/components/ui/button";
import { fill, plural } from "@/lib/utils";
import { ChoiceButton, Field, TextInput } from "./fields";

/*
 * Step 3: what he sells, and who sells it.
 *
 * Both are optional and both say so. An owner standing in his shop with no
 * spreadsheet to hand should be able to walk past this step and still finish,
 * because the app lets him add products one at a time anyway.
 *
 * The file is read in his browser. His catalogue is his business, and it does
 * not travel to us until he has decided to keep it.
 */

export type StaffMember = { name: string; role: "manager" | "cashier" };

export function StepProducts({
  copy,
  language,
  pack,
  result,
  onResult,
  kept,
  onKeep,
  staff,
  onStaff,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  result: ImportResult | null;
  onResult: (result: ImportResult | null) => void;
  kept: ImportedProduct[] | null;
  onKeep: (products: ImportedProduct[] | null) => void;
  staff: StaffMember[];
  onStaff: (staff: StaffMember[]) => void;
}) {
  return (
    <div className="space-y-12">
      <Products
        copy={copy}
        language={language}
        pack={pack}
        result={result}
        onResult={onResult}
        kept={kept}
        onKeep={onKeep}
      />
      <Staff copy={copy} staff={staff} onStaff={onStaff} />
    </div>
  );
}

function Products({
  copy,
  language,
  pack,
  result,
  onResult,
  kept,
  onKeep,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  result: ImportResult | null;
  onResult: (result: ImportResult | null) => void;
  kept: ImportedProduct[] | null;
  onKeep: (products: ImportedProduct[] | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  async function take(file: File | undefined) {
    if (!file) return;
    setReading(true);
    try {
      onResult(await readProductFile(file, pack));
    } catch {
      onResult({
        products: [],
        problems: [],
        missingColumns: ["name", "price"],
        blankRows: 0,
        truncated: false,
      });
    } finally {
      setReading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        {copy.products.heading}
      </h2>
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
          {result ? copy.products.another : copy.products.choose}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void downloadTemplate(pack, language, `ouaqt-${pack}.xlsx`)
          }
        >
          {copy.products.template}
        </Button>
      </div>

      {reading ? (
        <p className="text-base text-muted-foreground">{copy.products.reading}</p>
      ) : null}

      {result && !reading ? (
        <Outcome
          copy={copy}
          language={language}
          result={result}
          kept={kept}
          onKeep={onKeep}
        />
      ) : null}
    </section>
  );
}

function Outcome({
  copy,
  language,
  result,
  kept,
  onKeep,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  result: ImportResult;
  kept: ImportedProduct[] | null;
  onKeep: (products: ImportedProduct[] | null) => void;
}) {
  if (result.missingColumns.length > 0) {
    return (
      <p className="text-base leading-relaxed text-destructive">
        {copy.products.missingColumns}
      </p>
    );
  }

  const said: Record<ProblemCode, string> = {
    missing_name: copy.products.missingName as string,
    missing_price: copy.products.missingPrice as string,
    bad_price: copy.products.badPrice as string,
    bad_quantity: copy.products.badQuantity as string,
    bad_expiry: copy.products.badExpiry as string,
  };

  /* Ten is enough to see the pattern. The rest are the same three mistakes. */
  const SHOWN = 10; // not-a-rule: how many problem lines fit on a phone
  const shown = result.problems.slice(0, SHOWN);

  return (
    <div className="space-y-4">
      <p className="text-base text-foreground">
        {plural(language, result.products.length, copy.products.ready)}{" "}
        {result.problems.length > 0
          ? plural(language, result.problems.length, copy.products.toFix)
          : null}
      </p>

      {result.truncated ? (
        <p className="text-base text-muted-foreground">{copy.products.truncated}</p>
      ) : null}

      {shown.length > 0 ? (
        <ul className="space-y-2">
          {shown.map((problem) => (
            <li
              key={`${problem.row}-${problem.code}`}
              className="text-base leading-relaxed text-muted-foreground"
            >
              {fill(copy.products.problem as string, {
                row: problem.row,
                what: said[problem.code],
                column: problem.column,
              })}
            </li>
          ))}
        </ul>
      ) : null}

      {result.products.length > 0 ? (
        <Button
          type="button"
          variant={kept ? "outline" : "accent"}
          onClick={() => onKeep(kept ? null : result.products)}
        >
          {copy.products.keep}
        </Button>
      ) : null}
    </div>
  );
}

function Staff({
  copy,
  staff,
  onStaff,
}: {
  copy: BuilderCopy;
  staff: StaffMember[];
  onStaff: (staff: StaffMember[]) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffMember["role"]>("cashier");

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        {copy.staff.heading}
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        {copy.staff.help}
      </p>

      {staff.length === 0 ? (
        <p className="text-base text-muted-foreground">{copy.staff.empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {staff.map((person, index) => (
            <li
              key={`${person.name}-${index}`}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="text-base text-foreground">
                {person.name}
                <span className="text-muted-foreground">
                  {" "}
                  ·{" "}
                  {person.role === "manager"
                    ? copy.staff.manager
                    : copy.staff.cashier}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onStaff(staff.filter((_, i) => i !== index))}
                className="min-h-[48px] text-base text-muted-foreground underline decoration-border underline-offset-4"
              >
                {copy.staff.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Field label={copy.staff.name}>
        <TextInput value={name} onChange={setName} />
      </Field>

      <div className="space-y-3">
        <ChoiceButton
          selected={role === "manager"}
          onClick={() => setRole("manager")}
        >
          {copy.staff.manager}
        </ChoiceButton>
        <ChoiceButton
          selected={role === "cashier"}
          onClick={() => setRole("cashier")}
        >
          {copy.staff.cashier}
        </ChoiceButton>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={name.trim() === ""}
        onClick={() => {
          onStaff([...staff, { name: name.trim(), role }]);
          setName("");
        }}
      >
        {copy.staff.add}
      </Button>
    </section>
  );
}
