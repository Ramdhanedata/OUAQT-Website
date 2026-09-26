"use client";

import { useState } from "react";
import { sum, formatQuantity } from "@/app-ui";
import { cn } from "@/lib/utils";
import { monthsUntil, shortDate, tracksStock, type Item } from "../model";
import { DELIVERY_SIZE, LOW_STOCK_AT, sampleCustomers, sampleExpenses } from "../samples";
import { onHand, usePreview } from "../store";
import { Button, Empty, Money, Screen, Stat, Table, Tag } from "../ui";
import { fill, labelled } from "../words";

/*
 * The shelves and the people: the stock, the menu of a restaurant or a
 * service business, the customers who buy on credit, the front page of a
 * pharmacy or a general business, and the month's expenses.
 */

export function Stock() {
  const { configuration, language, words, items: all, day, update, say } = usePreview();
  const w = words.stock;
  /* A service has no shelf: only what is counted is listed. */
  const items = all.filter((item) => item.stock !== null);
  const pharmacy = configuration.features.pharmacy;
  const alert = configuration.common.lowStockAlert;
  const low = items.filter((item) => {
    const hand = onHand(item, day);
    return hand !== null && hand <= LOW_STOCK_AT;
  });

  const head = [
    w.product,
    ...(pharmacy?.batchNumbers ? [w.batch] : []),
    ...(pharmacy?.trackExpiry ? [w.expiry] : []),
    ...(pharmacy?.trackSuppliers ? [w.supplier] : []),
    w.quantity,
    w.price,
  ];
  const columns = [
    "2.4fr",
    ...(pharmacy?.batchNumbers ? ["1fr"] : []),
    ...(pharmacy?.trackExpiry ? ["1.5fr"] : []),
    ...(pharmacy?.trackSuppliers ? ["1.5fr"] : []),
    "1.3fr",
    "1.3fr",
  ].join(" ");

  return (
    <Screen
      title={w.title}
      aside={
        <Button
          disabled={low.length === 0}
          onClick={() => {
            update((current) => {
              const received = { ...current.received };
              for (const item of low) received[item.id] = (received[item.id] ?? 0) + DELIVERY_SIZE;
              return { ...current, received };
            });
            say(words.notes.received);
          }}
        >
          {w.receive}
        </Button>
      }
    >
      <Table
        columns={columns}
        head={head}
        rows={items.map((item) => {
          const hand = onHand(item, day) ?? 0;
          const soon = pharmacy?.trackExpiry && item.expiry && monthsUntil(item.expiry) < pharmacy.expiryAlertMonths;
          return {
            key: item.id,
            cells: [
              <span key="n" className="font-semibold">
                {item.name}
              </span>,
              ...(pharmacy?.batchNumbers ? [item.batch ?? ""] : []),
              ...(pharmacy?.trackExpiry
                ? [
                    item.expiry ? (
                      soon ? (
                        <Tag key="e" tone="warning">
                          {shortDate(item.expiry, language)}
                        </Tag>
                      ) : (
                        shortDate(item.expiry, language)
                      )
                    ) : (
                      ""
                    ),
                  ]
                : []),
              ...(pharmacy?.trackSuppliers ? [<span key="s" className="text-app-ink2">{item.supplier ?? ""}</span>] : []),
              <span key="q" className="flex items-center gap-2 tabular-nums">
                {formatQuantity(hand, language)}
                {item.weighed ? ` ${words.moves.kilo}` : ""}
                {alert && hand <= LOW_STOCK_AT ? <Tag tone="warning">{words.till.lowStock}</Tag> : null}
              </span>,
              <span key="p">
                <Money value={item.price} language={language} />
                {item.weighed ? <span className="text-app-ink3"> {words.till.perKg}</span> : null}
              </span>,
            ],
          };
        })}
      />
    </Screen>
  );
}

/* A restaurant's menu, or what a service business sells: grouped, priced, switched on and off. */
export function Menu() {
  const { configuration, language, words, items } = usePreview();
  const [off, setOff] = useState<string[]>([]);
  const groups = [...new Set(items.map((item) => item.category ?? ""))];
  const title = configuration.pack === "restaurant" ? words.nav.menu : words.stock.services;

  return (
    <Screen title={title}>
      <div className="space-y-6 p-7">
        {groups.map((group) => (
          <section key={group || "all"}>
            {group ? <h2 className="mb-2 text-[18px] font-semibold text-app-ink2">{group}</h2> : null}
            <ul className="divide-y divide-app-line rounded-xl border border-app-line bg-app-raised">
              {items
                .filter((item) => (item.category ?? "") === group)
                .map((item) => {
                  const available = !off.includes(item.id);
                  return (
                    <li key={item.id} className="flex min-h-[64px] items-center justify-between gap-4 px-5">
                      <span className={cn("text-[18px] font-semibold", !available && "text-app-ink3 line-through")}>{item.name}</span>
                      <span className="flex items-center gap-5">
                        <Money value={item.price} language={language} className="text-[18px] font-bold text-app-gold-ink" />
                        <button
                          type="button"
                          role="switch"
                          aria-checked={available}
                          onClick={() => setOff((current) => (available ? [...current, item.id] : current.filter((one) => one !== item.id)))}
                          className="flex min-h-[48px] items-center gap-3 text-[16px] text-app-ink2"
                        >
                          <span className={cn("relative h-7 w-12 rounded-full transition-colors", available ? "bg-app-success" : "bg-app-strong")}>
                            <span
                              className={cn(
                                "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                                available ? "start-6" : "start-1"
                              )}
                            />
                          </span>
                          {words.stock.available}
                        </button>
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </Screen>
  );
}

export function Customers() {
  const { configuration, language, words, day } = usePreview();
  const w = words.customers;
  const limited = configuration.common.credit.limitPerCustomer;
  const rows = sampleCustomers.map((customer) => ({ ...customer, owes: customer.owes + (day.owed[customer.id] ?? 0) }));

  return (
    <Screen title={w.title}>
      <div className="grid grid-cols-3 gap-4 px-7 pt-6">
        <Stat label={w.total} value={<Money value={sum(rows.map((row) => row.owes))} language={language} />} />
      </div>
      <Table
        columns={limited ? "2fr 1.4fr 1.4fr" : "2fr 1.4fr"}
        head={limited ? [w.name, w.limit, w.owes] : [w.name, w.owes]}
        rows={rows.map((row) => ({
          key: row.id,
          strong: row.owes > 0,
          cells: [
            row.name,
            ...(limited ? [<Money key="l" value={row.limit} language={language} className="text-app-ink2" />] : []),
            row.owes > 0 ? (
              <span key="o" className="inline-flex items-center gap-2">
                {limited && row.owes > row.limit ? <Tag tone="danger">{words.till.overLimit}</Tag> : null}
                <Money value={row.owes} language={language} />
              </span>
            ) : (
              <span key="o" className="text-app-ink3">
                {w.nothing}
              </span>
            ),
          ],
        }))}
      />
    </Screen>
  );
}

/* The first screen of a pharmacy or a general business: the day, and what needs looking at. */
export function Overview() {
  const { configuration, language, words, items, day, go } = usePreview();
  const w = words.overview;
  const pharmacy = configuration.features.pharmacy;
  const counted = tracksStock(configuration);
  const low = counted && configuration.common.lowStockAlert
    ? items.filter((item) => (onHand(item, day) ?? Infinity) <= LOW_STOCK_AT)
    : [];
  const expiring = pharmacy?.trackExpiry
    ? items.filter((item) => item.expiry && monthsUntil(item.expiry) < pharmacy.expiryAlertMonths)
    : [];
  const owed = sum(sampleCustomers.map((customer) => customer.owes + (day.owed[customer.id] ?? 0)));
  const expenses = configuration.features.general?.expenses !== false && configuration.pack === "general";

  const flagged: { item: Item; tag: React.ReactNode }[] = [
    ...expiring.map((item) => ({
      item,
      tag: <Tag tone="warning">{words.till.expiresSoon} {item.expiry ? shortDate(item.expiry, language) : ""}</Tag>,
    })),
    ...low.map((item) => ({
      item,
      tag: <Tag tone="warning">{labelled(language, words.till.lowStock, onHand(item, day) ?? 0)}</Tag>,
    })),
  ];

  return (
    <Screen title={configuration.pack === "pharmacy" ? words.nav.overview : words.nav.dashboard}>
      <div className="grid grid-cols-3 gap-4 px-7 pt-6">
        <Stat label={w.salesToday} value={<Money value={sum(day.sales.map((sale) => sale.total))} language={language} />} />
        {counted && configuration.common.lowStockAlert ? <Stat label={w.lowStock} value={low.length} tone={low.length > 0 ? "warning" : undefined} /> : null}
        {pharmacy?.trackExpiry ? (
          <Stat label={fill(w.expiring, pharmacy.expiryAlertMonths)} value={expiring.length} tone={expiring.length > 0 ? "warning" : undefined} />
        ) : null}
        {configuration.common.credit.enabled ? <Stat label={w.credit} value={<Money value={owed} language={language} />} /> : null}
        {expenses ? (
          <Stat
            label={w.expensesMonth}
            value={<Money value={sum(sampleExpenses(language).map((one) => one.amount))} language={language} />}
          />
        ) : null}
      </div>
      {flagged.length > 0 ? (
        <ul className="mx-7 my-6 divide-y divide-app-line rounded-xl border border-app-line bg-app-raised">
          {flagged.map(({ item, tag }, index) => (
            <li key={`${item.id}-${index}`}>
              <button
                type="button"
                onClick={() => go("stock")}
                className="flex min-h-[60px] w-full items-center justify-between gap-4 px-5 text-start text-[18px] hover:bg-app-hover"
              >
                <span className="font-semibold">{item.name}</span>
                {tag}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Screen>
  );
}

export function Expenses() {
  const { language, words, day, update, say } = usePreview();
  const w = words.expenses;
  const base = sampleExpenses(language);
  const added = Array.from({ length: day.expenses }, (_, index) => ({ ...base[index % base.length], id: `x${index}`, day: new Date().getDate() }));
  const rows = [...base, ...added];
  const month = new Date();

  return (
    <Screen
      title={w.title}
      aside={
        <Button
          kind="primary"
          onClick={() => {
            update((current) => ({ ...current, expenses: current.expenses + 1 }));
            say(words.notes.expenseAdded);
          }}
        >
          {w.newExpense}
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-4 px-7 pt-6">
        <Stat label={w.month} value={<Money value={sum(rows.map((row) => row.amount))} language={language} />} />
      </div>
      {rows.length === 0 ? (
        <Empty>{w.month}</Empty>
      ) : (
        <Table
          columns="2fr 1.2fr 1.3fr"
          head={[w.what, w.when, w.amount]}
          rows={rows.map((row) => ({
            key: row.id,
            cells: [
              row.what,
              shortDate(new Date(month.getFullYear(), month.getMonth(), row.day), language),
              <Money key="a" value={row.amount} language={language} className="font-semibold" />,
            ],
          }))}
        />
      )}
    </Screen>
  );
}
