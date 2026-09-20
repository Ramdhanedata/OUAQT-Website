"use client";

import type { Configuration } from "./config";
import { getAppCopy } from "./copy";
import { formatMoney, formatQuantity, isRightToLeft } from "./format";
import type { SampleProduct } from "./sample-data";

/*
 * What the bakery made today, and what is promised to somebody.
 *
 * Two things on one screen because a baker asks them together at six in the
 * morning: how much did we bake, and what has to be ready before it can be
 * sold to anyone walking in.
 */

export type ProductionRow = {
  product: SampleProduct;
  made: number;
  sold: number;
};

export type Preorder = {
  id: string;
  customer: string;
  items: string;
  dueAt: string;
  deposit: number | null;
};

export function Production({
  configuration,
  rows,
  preorders,
}: {
  configuration: Configuration;
  rows: ProductionRow[];
  preorders: Preorder[];
}) {
  const language = configuration.language.app;
  const copy = getAppCopy(language);
  const rtl = isRightToLeft(language);
  const showPreorders = configuration.features.bakery?.preorders ?? false;
  const showDeposit = configuration.features.bakery?.deposit ?? false;

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="flex h-full flex-col bg-white text-black">
      <header className="border-b-2 border-black/10 px-4 py-3">
        <span className="text-lg font-semibold">{copy.production.title}</span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {rows.length === 0 ? (
          <p className="py-6 text-base leading-relaxed text-black/60">
            {copy.production.none}
          </p>
        ) : (
          <ul className="divide-y divide-black/10">
            {rows.map((row) => {
              const left = row.made - row.sold;
              return (
                <li key={row.product.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-medium">
                      {row.product.name[language]}
                    </span>
                    <span className="text-lg font-semibold">
                      <bdi dir="ltr">{formatQuantity(left, language)}</bdi>
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-base text-black/60">
                    <span>
                      {copy.production.made}{" "}
                      <bdi dir="ltr">{formatQuantity(row.made, language)}</bdi>
                    </span>
                    <span>
                      {copy.production.sold}{" "}
                      <bdi dir="ltr">{formatQuantity(row.sold, language)}</bdi>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {showPreorders && preorders.length > 0 ? (
          <section className="mt-6">
            <h3 className="text-base font-semibold">{copy.production.preorders}</h3>
            <ul className="mt-2 divide-y divide-black/10">
              {preorders.map((order) => (
                <li key={order.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-medium">{order.customer}</span>
                    <span className="text-base text-black/60">{order.dueAt}</span>
                  </div>
                  <div className="text-base text-black/60">{order.items}</div>
                  {showDeposit && order.deposit !== null ? (
                    <div className="text-base">
                      {copy.production.deposit}{" "}
                      <bdi dir="ltr">{formatMoney(order.deposit, language)}</bdi>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
