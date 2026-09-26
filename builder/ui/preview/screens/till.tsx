"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { lineTotal, sampleTables, sum, formatQuantity } from "@/app-ui";
import { cn } from "@/lib/utils";
import { monthsUntil, shortDate, clock, type Item } from "../model";
import { DISCOUNT_PERCENT, LOW_STOCK_AT, sampleCashier, sampleCustomers } from "../samples";
import { nextId, onHand, usePreview, type Line, type Sale } from "../store";
import { Button, Chip, Dialog, Money, Tag } from "../ui";
import { fill, labelled, list } from "../words";
import { hotelRooms } from "./hotel";

/*
 * The screen the shop spends its day in, in the three shapes the trades use.
 *
 * "sale" is the counter of a shop, a pharmacy, a bakery: find the product,
 * build the ticket, take the money. "counter" is a restaurant's: the order
 * belongs to a table or leaves with the customer, may go to the kitchen
 * before it is paid, and waits at the bottom until it is. "extras" is a
 * hotel's: the same ticket, charged to a room.
 *
 * Everything the owner answered shows here: how the shelf is searched,
 * whether a product is sold by the kilo, what the expiry and the batch look
 * like, whether a discount, credit or a printed receipt exist at all.
 */

type Mode = "sale" | "counter" | "extras";
type Service = "dine_in" | "takeaway" | "delivery";
type Open =
  | null
  | { kind: "options"; item: Item }
  | { kind: "tables"; thenSend: boolean }
  | { kind: "credit" }
  | { kind: "room" };

export function Till({ mode }: { mode: Mode }) {
  const { configuration, language, words, items, staff, day, update, say, detail, clearDetail } = usePreview();
  const w = words.till;
  const common = configuration.common;
  const restaurant = mode === "counter" ? configuration.features.restaurant : undefined;
  const pharmacy = configuration.features.pharmacy;
  const shop = configuration.features.shop;

  /*
   * A long shelf is searched, a short one is picked by eye. A pharmacy and a
   * wholesaler look things up by name or barcode; a shop that said it wants
   * tiles gets tiles.
   */
  const listed =
    mode === "sale" &&
    (configuration.pack === "pharmacy" ||
      configuration.pack === "warehouse" ||
      (configuration.pack === "shop" && shop?.tiles === false));
  const search = pharmacy?.search ?? shop?.search ?? ["name"];
  const placeholder =
    search.includes("name") && search.includes("barcode")
      ? w.searchBoth
      : search.includes("barcode")
        ? w.searchBarcode
        : w.searchName;

  const lines = day.basket[mode] ?? [];
  const setLines = (next: Line[] | ((current: Line[]) => Line[])) =>
    update((current) => ({
      ...current,
      basket: { ...current.basket, [mode]: typeof next === "function" ? next(current.basket[mode] ?? []) : next },
    }));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [service, setService] = useState<Service>("dine_in");
  const [table, setTable] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [discounted, setDiscounted] = useState(false);
  const [open, setOpen] = useState<Open>(null);

  const services = (restaurant?.service ?? []) as Service[];
  const currentService = services.includes(service) ? service : services[0];

  /* The owner just told us how many tables the room has: show them the room. */
  useEffect(() => {
    if (detail === "tables" && mode === "counter") {
      setOpen({ kind: "tables", thenSend: false });
      clearDetail();
    }
  }, [detail, mode, clearDetail]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean) as string[])],
    [items]
  );
  const shown = items.filter(
    (item) =>
      (category === null || item.category === category) &&
      (query.trim() === "" || item.name.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const inTicket = (id: string) => sum(lines.filter((line) => line.itemId === id).map((line) => line.quantity));
  const left = (item: Item) => {
    const hand = onHand(item, day);
    return hand === null ? null : hand - inTicket(item.id);
  };

  const add = (item: Item, note?: string) => {
    const remaining = left(item);
    if (remaining !== null && remaining <= 0) return;
    const key = `${item.id}|${note ?? ""}`;
    setLines((current) =>
      current.some((line) => line.key === key)
        ? current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + 1 } : line))
        : [...current, { key, itemId: item.id, name: item.name, price: item.price, quantity: 1, weighed: item.weighed, note }]
    );
  };
  const pick = (item: Item) => (item.hasOptions ? setOpen({ kind: "options", item }) : add(item));
  const step = (key: string, by: number) =>
    setLines((current) =>
      current
        .map((line) => {
          if (line.key !== key) return line;
          const item = items.find((one) => one.id === line.itemId);
          const remaining = item ? left(item) : null;
          if (by > 0 && remaining !== null && remaining <= 0) return line;
          return { ...line, quantity: line.quantity + by };
        })
        .filter((line) => line.quantity > 0)
    );

  const subtotal = sum(lines.map((line) => lineTotal(line.quantity, line.price)));
  const discount = common.discounts && discounted ? Math.round((subtotal * DISCOUNT_PERCENT) / 100) : 0; // not-a-rule: a percentage
  const total = subtotal - discount;

  const clear = () => {
    setLines([]);
    setDiscounted(false);
    setLoaded(null);
    setTable(null);
  };

  const cashierName = staff.find((one) => one.role === "cashier")?.name ?? sampleCashier;
  const sendsFirst = restaurant?.openOrders === true && loaded === null;
  const printsKitchen = restaurant?.kitchen === "printed";

  const orderLabel = (at: number | null) =>
    currentService === "dine_in" && at !== null
      ? `${w.table} ${at}`
      : `${currentService === "delivery" ? w.delivery : w.takeaway} ${day.open.length + day.sales.length + 1}`;

  const send = (at: number | null) => {
    if (lines.length === 0) return;
    if (currentService === "dine_in" && at === null) {
      setOpen({ kind: "tables", thenSend: true });
      return;
    }
    const now = new Date();
    const label = orderLabel(at);
    update((current) => ({
      ...current,
      open: [...current.open, { id: `o${nextId()}`, label, table: at ?? undefined, lines, since: now }],
      slips: printsKitchen ? [...current.slips, { id: nextId(), kind: "kitchen", label, lines, at: now }] : current.slips,
    }));
    say(printsKitchen ? words.notes.kitchenPrinted : words.notes.kitchenSpoken);
    clear();
  };

  const charge = (method: Sale["method"], who?: string, room?: number) => {
    if (lines.length === 0) return;
    const sale: Sale = {
      number: day.sales.length + 1,
      lines,
      discount,
      total,
      method,
      who,
      at: new Date(),
    };
    const receipt = common.printedReceipt && method !== "room";
    /* A restaurant that is paid straight away still sends the order to the kitchen. */
    const kitchen = mode === "counter" && !restaurant?.openOrders && printsKitchen;
    const label = orderLabel(table);
    update((current) => {
      const sold = { ...current.sold };
      for (const line of lines) sold[line.itemId] = (sold[line.itemId] ?? 0) + line.quantity;
      const owed = { ...current.owed };
      if (method === "credit" && who) {
        const customer = sampleCustomers.find((one) => one.name === who);
        if (customer) owed[customer.id] = (owed[customer.id] ?? 0) + total;
      }
      const roomCharges = { ...current.roomCharges };
      if (room !== undefined) roomCharges[room] = (roomCharges[room] ?? 0) + total;
      return {
        ...current,
        sales: [...current.sales, sale],
        sold,
        owed,
        roomCharges,
        open: loaded ? current.open.filter((order) => order.id !== loaded) : current.open,
        slips: [
          ...current.slips,
          ...(kitchen ? [{ id: nextId(), kind: "kitchen" as const, label, lines, at: sale.at }] : []),
          ...(receipt ? [{ id: nextId(), kind: "receipt" as const, sale }] : []),
        ],
      };
    });
    say(
      method === "credit" && who
        ? fill(words.notes.credit, who)
        : method === "room" && room !== undefined
          ? fill(words.notes.roomCharged, room)
          : receipt
            ? words.notes.printed
            : words.notes.saved
    );
    clear();
  };

  const takings = sum(day.sales.map((sale) => sale.total));

  return (
    <div className="relative flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b border-app-line px-7">
          {listed ? (
            <label className="flex min-h-[52px] flex-1 items-center gap-3 rounded-lg border-2 border-app-strong bg-app-raised px-4">
              <Search className="h-5 w-5 shrink-0 text-app-ink3" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="min-w-0 flex-1 bg-transparent text-[19px] text-app-ink outline-none placeholder:text-app-ink3"
              />
            </label>
          ) : (
            <h1 className="truncate text-[26px] font-semibold text-app-ink">{words.nav[mode]}</h1>
          )}
          <div className="flex shrink-0 items-stretch overflow-hidden rounded-xl border border-app-line bg-app-raised">
            <HeadFigure label={w.todayTotal} value={<Money value={takings} language={language} />} />
            <HeadFigure label={mode === "counter" ? w.ordersCount : w.salesCount} value={day.sales.length} />
            {common.cashiers === "owner_and_staff" ? <HeadFigure label={w.cashier} value={cashierName} /> : null}
          </div>
        </header>

        {!listed && categories.length > 1 ? (
          <div className="flex shrink-0 gap-3 overflow-x-auto px-7 pt-5">
            <Chip selected={category === null} onClick={() => setCategory(null)}>
              {w.all}
            </Chip>
            {categories.map((one) => (
              <Chip key={one} selected={category === one} onClick={() => setCategory(one)}>
                {one}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          {listed ? (
            <ul>
              {shown.map((item) => (
                <ListRow key={item.id} item={item} left={left(item)} onPick={() => pick(item)} />
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-7">
              {shown.map((item) => (
                <Tile key={item.id} item={item} left={left(item)} onPick={() => pick(item)} />
              ))}
            </div>
          )}
        </div>

        {mode === "counter" && restaurant?.openOrders ? (
          <div className="shrink-0 border-t border-app-line bg-app-surface px-7 py-4">
            <div className="mb-3 flex items-center gap-2 text-[17px] text-app-ink2">
              <span className="h-2.5 w-2.5 rounded-full bg-app-warning" />
              {w.waiting}
            </div>
            {day.open.length === 0 ? (
              <p className="text-[16px] text-app-ink3">{w.noneWaiting}</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto">
                {day.open.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setLines(order.lines);
                      setLoaded(order.id);
                      setTable(order.table ?? null);
                    }}
                    className={cn(
                      "min-w-[190px] shrink-0 rounded-xl border-2 px-4 py-2.5 text-start",
                      loaded === order.id ? "border-app-ink bg-app-hover" : "border-app-warning bg-app-warning-soft"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 text-[17px] font-semibold">
                      <span className="truncate">{order.label}</span>
                      <span className="font-normal text-app-ink3">{clock(order.since)}</span>
                    </div>
                    <div className="mt-1 text-[18px] font-bold">
                      <Money value={sum(order.lines.map((line) => lineTotal(line.quantity, line.price)))} language={language} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <aside className="flex w-[380px] shrink-0 flex-col border-s border-app-line bg-app-surface">
        <div className="border-b border-app-line px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-semibold">
              {loaded ? day.open.find((order) => order.id === loaded)?.label ?? w.ticket : w.ticket}
            </h2>
            {currentService === "dine_in" && mode === "counter" && !loaded ? (
              <Button onClick={() => setOpen({ kind: "tables", thenSend: false })} className="min-h-[44px] px-4 text-[16px]">
                {table !== null ? `${w.table} ${table}` : w.chooseTable}
              </Button>
            ) : null}
          </div>
          {mode === "counter" && services.length > 1 && !loaded ? (
            <div className="mt-3 flex gap-2">
              {services.map((one) => (
                <button
                  key={one}
                  type="button"
                  onClick={() => setService(one)}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-lg border-2 px-2 text-[16px]",
                    currentService === one ? "border-app-ink bg-app-ink font-semibold text-app-surface" : "border-app-strong text-app-ink"
                  )}
                >
                  {one === "dine_in" ? w.dineIn : one === "takeaway" ? w.takeaway : w.delivery}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6">
          {lines.length === 0 ? (
            <p className="py-8 text-[18px] leading-relaxed text-app-ink3">{w.empty}</p>
          ) : (
            <ul className="divide-y divide-app-line">
              {lines.map((line) => (
                <li key={line.key} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[18px] font-semibold leading-snug">{line.name}</div>
                      {line.note ? <div className="text-[16px] text-app-gold-ink">{line.note}</div> : null}
                    </div>
                    <span className="shrink-0 text-[18px] font-semibold">
                      <Money value={lineTotal(line.quantity, line.price)} language={language} />
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Stepper onClick={() => step(line.key, -1)} label="-">
                      {line.quantity === 1 ? <Trash2 className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                    </Stepper>
                    <span className="min-w-[64px] text-center text-[18px] tabular-nums">
                      {formatQuantity(line.quantity, language)}
                      {line.weighed ? ` ${words.moves.kilo}` : ""}
                    </span>
                    <Stepper onClick={() => step(line.key, 1)} label="+">
                      <Plus className="h-5 w-5" />
                    </Stepper>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t-2 border-dashed border-app-line px-6 pb-6 pt-4">
          {common.discounts && lines.length > 0 ? (
            <button
              type="button"
              onClick={() => setDiscounted((value) => !value)}
              className={cn(
                "mb-3 flex min-h-[44px] w-full items-center justify-between rounded-lg border-2 px-4 text-[17px]",
                discounted ? "border-app-gold bg-app-warning-soft font-semibold" : "border-app-strong"
              )}
            >
              <span>{discounted ? w.discountLine : w.discount}</span>
              {discounted ? (
                <span>
                  - <Money value={discount} language={language} />
                </span>
              ) : null}
            </button>
          ) : null}
          <div className="flex items-baseline justify-between">
            <span className="text-[20px] font-medium">{w.total}</span>
            <span className="text-[32px] font-bold">
              <Money value={total} language={language} />
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            {sendsFirst ? (
              <Button kind="primary" disabled={lines.length === 0} onClick={() => send(table)} className="min-h-[60px] flex-1 text-[19px]">
                {printsKitchen ? w.sendPrinted : w.sendSpoken}
              </Button>
            ) : (
              <>
                {common.credit.enabled && mode !== "extras" ? (
                  <Button disabled={lines.length === 0} onClick={() => setOpen({ kind: "credit" })} className="min-h-[60px] px-4">
                    {w.credit}
                  </Button>
                ) : null}
                {mode === "extras" ? (
                  <>
                    <Button disabled={lines.length === 0} onClick={() => charge("cash")} className="min-h-[60px] px-4">
                      {w.charge}
                    </Button>
                    <Button kind="primary" disabled={lines.length === 0} onClick={() => setOpen({ kind: "room" })} className="min-h-[60px] flex-1 text-[18px]">
                      {w.toRoom}
                    </Button>
                  </>
                ) : (
                  <Button kind="primary" disabled={lines.length === 0} onClick={() => charge("cash")} className="min-h-[60px] flex-1 text-[19px]">
                    {w.charge}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {open?.kind === "options" ? (
        <OptionsDialog
          item={open.item}
          onClose={() => setOpen(null)}
          onAdd={(note) => {
            add(open.item, note);
            setOpen(null);
          }}
        />
      ) : null}

      {open?.kind === "tables" ? (
        <TablesDialog
          chosen={table}
          onClose={() => setOpen(null)}
          onChoose={(number) => {
            setTable(number);
            if (currentService !== "dine_in") setService("dine_in");
            const thenSend = open.thenSend;
            setOpen(null);
            if (thenSend) send(number);
          }}
        />
      ) : null}

      {open?.kind === "credit" ? (
        <Dialog title={w.whoOwes} onClose={() => setOpen(null)}>
          <ul className="space-y-2">
            {sampleCustomers.map((customer) => {
              const owes = customer.owes + (day.owed[customer.id] ?? 0);
              const over = common.credit.limitPerCustomer && owes + total > customer.limit;
              return (
                <li key={customer.id}>
                  <button
                    type="button"
                    disabled={over}
                    onClick={() => {
                      setOpen(null);
                      charge("credit", customer.name);
                    }}
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 rounded-xl border-2 border-app-strong px-5 text-start hover:bg-app-hover disabled:opacity-60"
                  >
                    <span className="text-[19px] font-semibold">{customer.name}</span>
                    <span className="text-end text-[16px] text-app-ink2">
                      {over ? (
                        <Tag tone="danger">{w.overLimit}</Tag>
                      ) : (
                        <>
                          {w.owes} <Money value={owes} language={language} />
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Dialog>
      ) : null}

      {open?.kind === "room" ? (
        <Dialog title={w.chooseRoom} onClose={() => setOpen(null)}>
          <div className="grid grid-cols-4 gap-3">
            {hotelRooms(configuration.features.hotel?.rooms ?? 1, day)
              .filter((room) => room.state === "occupied")
              .slice(0, 16)
              .map((room) => (
                <button
                  key={room.number}
                  type="button"
                  onClick={() => {
                    setOpen(null);
                    charge("room", undefined, room.number);
                  }}
                  className="min-h-[72px] rounded-xl border-2 border-app-strong text-[20px] font-semibold hover:bg-app-hover"
                >
                  {room.number}
                </button>
              ))}
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

function HeadFigure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-e border-app-line px-5 py-2 text-end last:border-e-0">
      <div className="whitespace-nowrap text-[15px] text-app-ink3">{label}</div>
      <div className="whitespace-nowrap text-[19px] font-bold">{value}</div>
    </div>
  );
}

function Stepper({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-app-strong text-app-ink hover:bg-app-hover"
    >
      {children}
    </button>
  );
}

/*
 * What a product says about itself: how many are left, and in a pharmacy
 * its batch and expiry. A warning (low, out, expiring) takes the place of
 * the plain count, in colour, because that is the one the cashier must see.
 */
function useShelfFacts(item: Item, left: number | null) {
  const { configuration, language, words } = usePreview();
  const w = words.till;
  const pharmacy = configuration.features.pharmacy;
  const details: string[] = [];
  const warnings: React.ReactNode[] = [];
  let stock: string | null = null;

  if (left !== null) {
    if (left <= 0) warnings.push(<Tag key="out" tone="danger">{w.out}</Tag>);
    else if (configuration.common.lowStockAlert && left <= LOW_STOCK_AT) {
      warnings.push(<Tag key="low" tone="warning">{labelled(language, w.lowStock, left)}</Tag>);
    } else stock = labelled(language, w.stock, formatQuantity(left, language));
  }
  if (pharmacy?.batchNumbers && item.batch) details.push(`${w.batch} ${item.batch}`);
  if (pharmacy?.trackExpiry && item.expiry) {
    if (monthsUntil(item.expiry) < pharmacy.expiryAlertMonths) {
      warnings.push(
        <Tag key="soon" tone="warning">
          {w.expiresSoon} {shortDate(item.expiry, language)}
        </Tag>
      );
    } else {
      details.push(`${w.expires} ${shortDate(item.expiry, language)}`);
    }
  }
  return { stock, details, warnings };
}

function ListRow({ item, left, onPick }: { item: Item; left: number | null; onPick: () => void }) {
  const { configuration, language, words } = usePreview();
  const { stock, details, warnings } = useShelfFacts(item, left);
  const under = [...(configuration.features.pharmacy?.unitSale ? [words.till.retail] : []), ...details];
  return (
    <li className="border-b border-app-line">
      <button
        type="button"
        onClick={onPick}
        disabled={left !== null && left <= 0}
        className="flex min-h-[84px] w-full items-center justify-between gap-6 px-7 py-3 text-start hover:bg-app-hover disabled:opacity-60"
      >
        <span className="min-w-0">
          <span className="block text-[20px] font-semibold leading-snug">{item.name}</span>
          {under.length > 0 ? <span className="mt-0.5 block text-[16px] text-app-ink3">{under.join(" · ")}</span> : null}
        </span>
        <span className="shrink-0 text-end">
          <span className="block text-[20px] font-bold">
            <Money value={item.price} language={language} />
            {item.weighed ? <span className="text-[16px] font-normal text-app-ink3"> {words.till.perKg}</span> : null}
          </span>
          <span className="mt-1 flex items-center justify-end gap-2 text-[16px] text-app-ink3">
            {stock ? <span>{stock}</span> : null}
            {warnings}
          </span>
        </span>
      </button>
    </li>
  );
}

function Tile({ item, left, onPick }: { item: Item; left: number | null; onPick: () => void }) {
  const { language, words } = usePreview();
  const { stock, warnings } = useShelfFacts(item, left);
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={left !== null && left <= 0}
      className="flex min-h-[136px] flex-col justify-between rounded-xl border border-app-line bg-app-raised p-5 text-start shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-app-strong hover:bg-app-surface disabled:opacity-60"
    >
      <span className="text-[19px] font-semibold leading-snug">{item.name}</span>
      <span>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[20px] font-bold text-app-gold-ink">
            <Money value={item.price} language={language} />
            {item.weighed ? <span className="text-[16px] font-normal"> {words.till.perKg}</span> : null}
          </span>
          {item.hasOptions ? <Tag tone="gold">{words.till.options}</Tag> : null}
        </span>
        {warnings.length > 0 ? <span className="mt-1 flex flex-wrap gap-1.5">{warnings}</span> : stock ? <span className="block text-[16px] text-app-ink3">{stock}</span> : null}
      </span>
    </button>
  );
}

function OptionsDialog({ item, onClose, onAdd }: { item: Item; onClose: () => void; onAdd: (note?: string) => void }) {
  const { words } = usePreview();
  const [chosen, setChosen] = useState<string[]>([]);
  const options = list(words.till.optionList);
  return (
    <Dialog title={fill(words.till.optionsFor, item.name)} onClose={onClose}>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <Chip
            key={option}
            selected={chosen.includes(option)}
            onClick={() => setChosen((current) => (current.includes(option) ? current.filter((one) => one !== option) : [...current, option]))}
          >
            {option}
          </Chip>
        ))}
      </div>
      <div className="mt-7 flex justify-end gap-3">
        <Button onClick={onClose}>{words.till.cancel}</Button>
        <Button kind="primary" onClick={() => onAdd(chosen.length > 0 ? chosen.join(", ") : undefined)}>
          {words.till.add}
        </Button>
      </div>
    </Dialog>
  );
}

/* Past this many tables, the room is shown in halls of twenty, the way staff talk about it. */
const GROUP_ABOVE = 24;
const PER_ZONE = 20;

function TablesDialog({ chosen, onClose, onChoose }: { chosen: number | null; onClose: () => void; onChoose: (table: number) => void }) {
  const { configuration, language, words, day } = usePreview();
  const count = configuration.features.restaurant?.tables ?? 1;
  const busy = new Map<number, number>();
  for (const table of sampleTables(count)) if (table.total !== null) busy.set(table.number, table.total);
  for (const order of day.open) {
    if (order.table !== undefined) busy.set(order.table, sum(order.lines.map((line) => lineTotal(line.quantity, line.price))));
  }
  const numbers = Array.from({ length: count }, (_, index) => index + 1);
  const zones =
    count > GROUP_ABOVE
      ? Array.from({ length: Math.ceil(count / PER_ZONE) }, (_, index) => ({
          label: `${words.till.zone} ${index + 1}`,
          numbers: numbers.slice(index * PER_ZONE, (index + 1) * PER_ZONE),
        }))
      : [{ label: null, numbers }];

  return (
    <Dialog title={`${words.till.chooseTable} (${count})`} onClose={onClose} wide>
      <div className="space-y-5">
        {zones.map((zone, index) => (
          <section key={index}>
            {zone.label ? <h3 className="mb-2 text-[17px] font-semibold text-app-ink2">{zone.label}</h3> : null}
            <div className="grid grid-cols-6 gap-3">
              {zone.numbers.map((number) => {
                const total = busy.get(number);
                return (
                  <button
                    key={number}
                    type="button"
                    onClick={() => onChoose(number)}
                    className={cn(
                      "flex min-h-[84px] flex-col items-center justify-center rounded-xl border-2",
                      chosen === number
                        ? "border-app-ink bg-app-ink text-app-surface"
                        : total !== undefined
                          ? "border-app-warning bg-app-warning-soft"
                          : "border-app-strong bg-app-raised hover:bg-app-hover"
                    )}
                  >
                    <span className="text-[22px] font-bold">{number}</span>
                    <span className="text-[15px]">
                      {total !== undefined ? <Money value={total} language={language} /> : words.till.free}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
