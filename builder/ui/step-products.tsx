"use client";

import { useState } from "react";
import type { AppLanguage } from "@/app-ui/config";
import type { Pack } from "@/app-ui/packs";
import type { BuilderCopy } from "@/builder/copy";
import type { ImportedProduct } from "@/builder/import/parse";
import { Button } from "@/components/ui/button";
import { ImportProducts } from "./import-products";
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
  kept,
  onKeep,
  staff,
  onStaff,
}: {
  copy: BuilderCopy;
  language: AppLanguage;
  pack: Pack;
  kept: ImportedProduct[] | null;
  onKeep: (products: ImportedProduct[] | null) => void;
  staff: StaffMember[];
  onStaff: (staff: StaffMember[]) => void;
}) {
  return (
    <div className="space-y-12">
      <ImportProducts
        copy={copy}
        language={language}
        pack={pack}
        kept={kept}
        onKeep={onKeep}
      />
      <Staff copy={copy} staff={staff} onStaff={onStaff} />
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
