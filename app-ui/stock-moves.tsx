"use client";

import { useState } from "react";
import type { Configuration } from "./config";
import { getAppCopy } from "./copy";
import { formatQuantity, isRightToLeft } from "./format";

/*
 * The warehouse's day: what came in, what went out, and from which place.
 *
 * The number of storage places comes from the configuration. One is the
 * common case and the filter then has nothing to do, so it is not shown at
 * all: a screen that makes somebody choose between one option is a screen
 * that wastes his morning twice a day.
 */

export type Movement = {
  id: string;
  direction: "in" | "out";
  product: string;
  quantity: number;
  unit: string;
  /** A supplier for an entry, a destination for an exit. */
  party: string;
  location: string;
  at: string;
};

export function StockMoves({
  configuration,
  locations,
  movements,
}: {
  configuration: Configuration;
  locations: string[];
  movements: Movement[];
}) {
  const language = configuration.language.app;
  const copy = getAppCopy(language);
  const rtl = isRightToLeft(language);
  const [place, setPlace] = useState<string | null>(null);

  const shown = place
    ? movements.filter((movement) => movement.location === place)
    : movements;

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="flex h-full flex-col bg-background text-black">
      <header className="border-b-2 border-black/10 px-4 py-3">
        <span className="text-lg font-semibold">{copy.stockMoves.title}</span>
      </header>

      {locations.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b-2 border-black/10 px-3 py-2">
          <Place label={copy.stockMoves.allLocations} on={place === null} onClick={() => setPlace(null)} />
          {locations.map((one) => (
            <Place key={one} label={one} on={place === one} onClick={() => setPlace(one)} />
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {shown.length === 0 ? (
          <p className="py-6 text-base leading-relaxed text-black/60">
            {copy.stockMoves.none}
          </p>
        ) : (
          <ul className="divide-y divide-black/10">
            {shown.map((movement) => (
              <li key={movement.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-medium">{movement.product}</span>
                  <span className="text-lg font-semibold">
                    <bdi dir="ltr">
                      {movement.direction === "in" ? "+" : "-"}
                      {formatQuantity(movement.quantity, language)}
                    </bdi>{" "}
                    {movement.unit}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-base text-black/60">
                  <span>
                    {movement.direction === "in" ? copy.stockMoves.from : copy.stockMoves.to}{" "}
                    {movement.party}
                  </span>
                  {locations.length > 1 ? <span>{movement.location}</span> : null}
                  <span>{movement.at}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Place({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[48px] shrink-0 rounded-lg border-2 px-4 text-base ${
        on ? "border-black bg-black/5 font-medium" : "border-black/15"
      }`}
    >
      {label}
    </button>
  );
}
