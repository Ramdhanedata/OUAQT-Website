"use client";

import { useEffect, useState } from "react";
import type { Configuration } from "./config";
import { getAppCopy } from "./copy";
import { formatAmount, formatMoney, formatQuantity, isRightToLeft } from "./format";
import { lineTotal, sum } from "./money";
import type { SampleProduct } from "./sample-data";
import type { ReceiptLine } from "./receipt";

/*
 * The screen the shop opens on, and the one it spends the day in.
 *
 * Rules that shaped it, from docs/UI_RULES.md: the daily task first, one
 * obvious main action, nothing under 16px, nothing to tap under 48px, every
 * icon carries its word, and the whole thing fits an old 1366x768 laptop
 * without scrolling.
 */

export function SaleScreen({
  configuration,
  products,
  onTicketChange,
  onCharge,
}: {
  configuration: Configuration;
  products: SampleProduct[];
  onTicketChange?: (lines: ReceiptLine[]) => void;
  /*
   * What happens when the cashier presses the one big button.
   *
   * The builder's preview does not pass it, so there the screen shows what
   * the shop will look like and takes nobody's money. The desktop app passes
   * the real thing. Returning false keeps the ticket on screen: a sale that
   * did not reach the disk must not disappear from in front of the person
   * who rang it up.
   */
  onCharge?: (lines: ReceiptLine[]) => boolean | Promise<boolean>;
}) {
  const language = configuration.language.app;
  const copy = getAppCopy(language);
  const rtl = isRightToLeft(language);
  const [ticket, setTicket] = useState<ReceiptLine[]>([]);
  /* Pressed twice in a hurry must not ring the sale up twice. */
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    onTicketChange?.(ticket);
  }, [ticket, onTicketChange]);

  const add = (product: SampleProduct) =>
    setTicket((lines) => {
      const found = lines.find((l) => l.id === product.id);
      if (found) {
        return lines.map((l) =>
          l.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...lines,
        {
          id: product.id,
          name: product.name[language],
          quantity: 1,
          unitPrice: product.price,
        },
      ];
    });

  const remove = (id: string) =>
    setTicket((lines) => lines.filter((l) => l.id !== id));

  const total = sum(ticket.map((l) => lineTotal(l.quantity, l.unitPrice)));
  const tracksStock = configuration.pack !== "restaurant";

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="flex h-full min-h-[480px] flex-col bg-background text-black"
    >
      <header className="flex items-center justify-between border-b-2 border-black/10 px-4 py-3">
        <span className="truncate text-lg font-semibold">
          {/*
            * His name in the language the till speaks. An Arabic till whose
            * owner gave an Arabic name shows that one; otherwise the Latin.
            */}
          {(language === "ar" && configuration.business.nameArabic) ||
            configuration.business.nameLatin ||
            copy.sale.title}
        </span>
        <button
          type="button"
          className="min-h-[48px] rounded-md border-2 border-black/15 px-4 text-base font-medium"
        >
          {copy.sale.manager}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => add(product)}
                className="flex min-h-[96px] flex-col justify-between rounded-lg border-2 border-black/15 p-3 text-start active:bg-black/5"
              >
                <span className="text-base font-medium leading-snug">
                  {product.name[language]}
                </span>
                <span className="mt-2 block text-lg font-semibold">
                  <bdi dir="ltr">{formatMoney(product.price, language)}</bdi>
                </span>
                {tracksStock ? (
                  <span className="text-base text-black/60">
                    {product.inStock > 0
                      ? `${copy.sale.inStock} ${formatQuantity(product.inStock, language)}`
                      : copy.sale.outOfStock}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col border-black/10 md:w-[340px] md:border-s-2">
          <h2 className="border-y-2 border-black/10 px-4 py-3 text-base font-semibold md:border-t-0">
            {copy.sale.ticket}
          </h2>

          <div className="min-h-0 flex-1 overflow-auto px-4">
            {ticket.length === 0 ? (
              <p className="py-6 text-base leading-relaxed text-black/60">
                {copy.sale.empty}
              </p>
            ) : (
              <ul className="divide-y divide-black/10">
                {ticket.map((line) => (
                  <li key={line.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-base font-medium">{line.name}</span>
                      <span className="text-base font-semibold">
                        <bdi dir="ltr">
                          {formatAmount(lineTotal(line.quantity, line.unitPrice), language)}
                        </bdi>
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-base text-black/60">
                        <bdi dir="ltr">
                          {formatQuantity(line.quantity, language)} x{" "}
                          {formatAmount(line.unitPrice, language)}
                        </bdi>
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(line.id)}
                        className="min-h-[48px] px-2 text-base underline"
                      >
                        {copy.sale.remove}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t-2 border-black/10 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-medium">{copy.sale.total}</span>
              <span className="text-2xl font-bold">
                <bdi dir="ltr">{formatMoney(total, language)}</bdi>
              </span>
            </div>
            <button
              type="button"
              disabled={ticket.length === 0 || charging}
              onClick={async () => {
                if (!onCharge || ticket.length === 0) return;
                setCharging(true);
                try {
                  const kept = await onCharge(ticket);
                  if (kept !== false) setTicket([]);
                } finally {
                  setCharging(false);
                }
              }}
              className="mt-3 min-h-[56px] w-full rounded-lg bg-black text-lg font-semibold text-white disabled:opacity-30"
            >
              {copy.sale.charge}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
