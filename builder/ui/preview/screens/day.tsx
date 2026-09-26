"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { sum } from "@/app-ui";
import { cn } from "@/lib/utils";
import { clock, shopName, shortDate } from "../model";
import { OPENING_CASH, pastWeek, sampleCashier } from "../samples";
import { usePreview } from "../store";
import { Button, Dialog, Empty, Money, Screen, Stat, Tag } from "../ui";
import { list } from "../words";

/*
 * The end of the day, and the shop's settings: the till, the reports, and
 * what the owner told us about the business, shown back the way the app
 * keeps it. The till counts what was rung up in the preview, so a sale made
 * a minute ago is in the drawer here.
 */

export function Cash() {
  const { configuration, language, words, staff, day, update, say } = usePreview();
  const w = words.cash;
  const perShift = configuration.common.cashClose === "per_shift";
  const cash = sum(day.sales.filter((sale) => sale.method === "cash").map((sale) => sale.total));
  const credit = sum(day.sales.filter((sale) => sale.method === "credit").map((sale) => sale.total));
  const cashier = staff.find((one) => one.role === "cashier")?.name ?? sampleCashier;

  return (
    <Screen
      title={perShift ? w.shift : w.daily}
      aside={
        day.closed ? (
          <Tag tone="success">{w.closed}</Tag>
        ) : (
          <Button
            kind="primary"
            onClick={() => {
              update((current) => ({ ...current, closed: true }));
              say(perShift ? words.notes.closedShift : words.notes.closedDay);
            }}
          >
            {perShift ? w.closeShift : w.closeDay}
          </Button>
        )
      }
    >
      <div className="grid grid-cols-[1fr_1.1fr] gap-7 p-7">
        <div className="space-y-3">
          {perShift && configuration.common.cashiers === "owner_and_staff" ? (
            <Stat label={words.till.cashier} value={cashier} />
          ) : null}
          <div className="divide-y divide-app-line rounded-xl border border-app-line bg-app-raised">
            <CashRow label={w.float} value={<Money value={OPENING_CASH} language={language} />} />
            <CashRow label={w.cashIn} value={<Money value={cash} language={language} />} />
            {configuration.common.credit.enabled ? <CashRow label={w.creditOut} value={<Money value={credit} language={language} />} /> : null}
            <CashRow strong label={w.expected} value={<Money value={OPENING_CASH + cash} language={language} />} />
          </div>
        </div>
        <div className="rounded-xl border border-app-line bg-app-raised">
          {day.sales.length === 0 ? (
            <Empty>{words.reports.nothing}</Empty>
          ) : (
            <ul className="divide-y divide-app-line">
              {[...day.sales].reverse().map((sale) => (
                <li key={sale.number} className="flex min-h-[60px] items-center justify-between gap-4 px-5 text-[17px]">
                  <span className="text-app-ink3 tabular-nums">
                    {clock(sale.at)} · {String(sale.number).padStart(4, "0")}
                  </span>
                  <span className="flex items-center gap-3">
                    {sale.method === "credit" ? <Tag tone="gold">{words.till.credit}</Tag> : null}
                    {sale.method === "room" ? <Tag tone="neutral">{words.till.room}</Tag> : null}
                    <Money value={sale.total} language={language} className="font-semibold" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Screen>
  );
}

function CashRow({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex min-h-[64px] items-center justify-between gap-4 px-5", strong ? "text-[21px] font-bold" : "text-[18px]")}>
      <span className={strong ? "leading-snug" : "text-app-ink2"}>{label}</span>
      <span className="shrink-0 whitespace-nowrap font-semibold">{value}</span>
    </div>
  );
}

export function Reports() {
  const { configuration, language, words } = usePreview();
  const w = words.reports;
  const figures = useFigures();
  const [sheet, setSheet] = useState(false);
  const labels = list(w.days);
  const today = (new Date().getDay() + 6) % 7; // not-a-rule: Monday first, the way a shop's week is written
  const week = [...pastWeek, figures.total].map((value, index) => ({
    value,
    label: labels[(today - 6 + index + 7) % 7], // not-a-rule: the seven days of a week
  }));
  const top = Math.max(...week.map((one) => one.value), 1);

  return (
    <Screen
      title={w.title}
      aside={
        <Button onClick={() => setSheet(true)}>
          <Printer className="h-5 w-5" />
          {w.print}
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-4 px-7 pt-6">
        <Stat label={w.total} value={<Money value={figures.total} language={language} />} />
        <Stat label={w.sales} value={figures.count} />
        <Stat label={w.average} value={<Money value={figures.average} language={language} />} />
      </div>
      <div className="grid grid-cols-[1.4fr_1fr] gap-6 p-7">
        <section className="rounded-xl border border-app-line bg-app-raised p-5">
          <h2 className="text-[18px] font-semibold text-app-ink2">{w.week}</h2>
          <div className="mt-4 flex h-[190px] items-end gap-3">
            {week.map((one, index) => (
              <div key={index} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex min-h-0 w-full flex-1 items-end">
                  <div
                    className={cn("w-full rounded-t-md", index === week.length - 1 ? "bg-app-gold" : "bg-app-strong")}
                    style={{ height: `${Math.max(3, (one.value / top) * 100)}%` }}
                  />
                </div>
                <span className={cn("truncate text-[14px]", index === week.length - 1 ? "font-bold text-app-ink" : "text-app-ink3")}>
                  {index === week.length - 1 ? w.today : one.label}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-app-line bg-app-raised p-5">
          <h2 className="text-[18px] font-semibold text-app-ink2">{w.best}</h2>
          {figures.best.length === 0 ? (
            <p className="mt-4 text-[17px] text-app-ink3">{w.nothing}</p>
          ) : (
            <ol className="mt-3 divide-y divide-app-line">
              {figures.best.map((one) => (
                <li key={one.name} className="flex min-h-[48px] items-center justify-between gap-3 text-[17px]">
                  <span className="truncate">{one.name}</span>
                  <span className="font-semibold tabular-nums">{one.quantity}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {sheet ? (
        <Dialog title={w.print} onClose={() => setSheet(false)} wide>
          <div className="mx-auto aspect-[210/297] w-[420px] bg-white p-9 text-[11px] text-black shadow-lg">
            <div className="flex items-start justify-between border-b border-black pb-3">
              <div>
                <div className="text-[16px] font-bold">{shopName(configuration, words.shopPlaceholder)}</div>
                <div>{w.title}</div>
              </div>
              <div className="tabular-nums">{shortDate(new Date(), language)}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div>
                <div className="text-black/60">{w.total}</div>
                <div className="text-[13px] font-bold">
                  <Money value={figures.total} language={language} />
                </div>
              </div>
              <div>
                <div className="text-black/60">{w.sales}</div>
                <div className="text-[13px] font-bold">{figures.count}</div>
              </div>
              <div>
                <div className="text-black/60">{w.average}</div>
                <div className="text-[13px] font-bold">
                  <Money value={figures.average} language={language} />
                </div>
              </div>
            </div>
            <div className="mt-5 font-semibold">{w.best}</div>
            {figures.best.map((one) => (
              <div key={one.name} className="flex justify-between border-b border-black/20 py-1">
                <span>{one.name}</span>
                <span>{one.quantity}</span>
              </div>
            ))}
          </div>
        </Dialog>
      ) : null}
    </Screen>
  );
}

function useFigures() {
  const { day } = usePreview();
  const total = sum(day.sales.map((sale) => sale.total));
  const count = day.sales.length;
  const byName = new Map<string, number>();
  for (const sale of day.sales) {
    for (const line of sale.lines) byName.set(line.name, (byName.get(line.name) ?? 0) + line.quantity);
  }
  const best = [...byName.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  return { total, count, average: count > 0 ? Math.round(total / count) : 0, best };
}

export function Settings() {
  const { configuration, language, words, staff } = usePreview();
  const w = words.settings;
  const { business, common } = configuration;
  const people = common.cashiers === "owner_and_staff" ? (staff.length > 0 ? staff : [{ name: sampleCashier, role: "cashier" as const }]) : [];

  return (
    <Screen title={w.title}>
      <div className="grid grid-cols-2 gap-6 p-7">
        <Card title={w.shop}>
          {business.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo} alt="" className="mb-3 max-h-20 max-w-[200px] object-contain" />
          ) : null}
          <Row label={w.name} value={[business.nameLatin, business.nameArabic].filter(Boolean).join(" · ") || null} />
          <Row label={w.phone} value={business.phone ? <bdi dir="ltr">{business.phone}</bdi> : null} />
          <Row label={w.address} value={business.address || null} />
        </Card>
        <Card title={w.printing}>
          {common.printedReceipt ? (
            <>
              <p className="text-[18px]">{w.receipts}</p>
              <p className="mt-2 text-[18px]">{w.documents}</p>
            </>
          ) : (
            <p className="text-[18px] text-app-ink2">{w.noPrinter}</p>
          )}
        </Card>
        <Card title={w.staff}>
          {people.length === 0 ? (
            <p className="text-[18px]">{w.onlyOwner}</p>
          ) : (
            <ul className="space-y-2">
              {people.map((person) => (
                <li key={person.name} className="flex items-center justify-between text-[18px]">
                  <span>{person.name}</span>
                  <Tag tone="neutral">{person.role === "manager" ? w.manager : w.cashier}</Tag>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <Row label={w.computers} value={String(common.devices)} />
          <Row label={w.language} value={words.languages[language]} />
        </Card>
      </div>
    </Screen>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-app-line bg-app-raised p-5">
      {title ? <h2 className="mb-3 text-[18px] font-semibold text-app-ink2">{title}</h2> : null}
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode | null }) {
  const { words } = usePreview();
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4 border-b border-app-line text-[17px] last:border-b-0">
      <span className="text-app-ink3">{label}</span>
      <span className={cn("text-end font-medium", value === null && "font-normal text-app-ink3")}>{value ?? words.settings.empty}</span>
    </div>
  );
}
