"use client";

import { useState } from "react";
import type { Configuration } from "./config";
import { getAppCopy } from "./copy";
import { formatMoney, isRightToLeft } from "./format";

/*
 * The room, as the person carrying the plates sees it.
 *
 * The number of tables comes from the configuration and nothing here assumes
 * it is small. A room of ten fits on one screen; a room of two hundred does
 * not, so past a certain point the tables are grouped into zones of twenty
 * with a heading, which is how staff talk about a room anyway: "table 34" is
 * in the third zone, not the thirty fourth position in a long list.
 *
 * not-a-rule-file: how many tables fit on a screen before grouping helps.
 */

/** Past this many, a flat grid stops being something you can scan. */
const GROUP_ABOVE = 24;
const PER_ZONE = 20;

export type TableState = {
  number: number;
  /** Null when nobody is sitting there. */
  total: number | null;
  since?: string;
};

export function Tables({
  configuration,
  tables,
  onOpen,
}: {
  configuration: Configuration;
  tables: TableState[];
  onOpen?: (table: number) => void;
}) {
  const language = configuration.language.app;
  const copy = getAppCopy(language);
  const rtl = isRightToLeft(language);
  const [open, setOpen] = useState<number | null>(null);

  const zones: { label: string | null; tables: TableState[] }[] =
    tables.length > GROUP_ABOVE
      ? Array.from({ length: Math.ceil(tables.length / PER_ZONE) }, (_, index) => ({
          label: `${copy.tables.zone} ${index + 1}`,
          tables: tables.slice(index * PER_ZONE, (index + 1) * PER_ZONE),
        }))
      : [{ label: null, tables }];

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="flex h-full flex-col bg-background text-black"
    >
      <header className="flex items-center justify-between border-b-2 border-black/10 px-4 py-3">
        <span className="text-lg font-semibold">{copy.tables.title}</span>
        <span className="text-base text-black/60">
          {tables.filter((table) => table.total !== null).length} / {tables.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {zones.map((zone, index) => (
          <section key={index} className={index > 0 ? "mt-5" : undefined}>
            {zone.label ? (
              <h3 className="mb-2 text-base font-medium text-black/70">{zone.label}</h3>
            ) : null}

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {zone.tables.map((table) => {
                const busy = table.total !== null;
                return (
                  <button
                    key={table.number}
                    type="button"
                    onClick={() => {
                      setOpen(table.number);
                      onOpen?.(table.number);
                    }}
                    aria-pressed={open === table.number}
                    className={`flex min-h-[84px] flex-col items-center justify-center rounded-lg border-2 p-2 ${
                      busy ? "border-black bg-black/5" : "border-black/15"
                    }`}
                  >
                    <span className="text-lg font-semibold">{table.number}</span>
                    <span className="mt-1 text-base text-black/60">
                      {busy ? (
                        <bdi dir="ltr">{formatMoney(table.total ?? 0, language)}</bdi>
                      ) : (
                        copy.tables.free
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
