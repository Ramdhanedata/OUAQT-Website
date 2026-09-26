"use client";

import { useEffect } from "react";
import {
  ArrowLeftRight,
  BedDouble,
  BookOpen,
  Bus,
  CalendarDays,
  ChartNoAxesColumn,
  ClipboardList,
  ConciergeBell,
  Croissant,
  HandCoins,
  LayoutDashboard,
  Package,
  PackageOpen,
  Route,
  Settings as SettingsIcon,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Receipt, type ReceiptLine } from "@/app-ui";
import { cn } from "@/lib/utils";
import { clock, sectionsFor, shopName, type Section } from "./model";
import { usePreview, type Line, type Printing } from "./store";
import { Till } from "./screens/till";
import { Customers, Expenses, Menu, Overview, Stock } from "./screens/shop";
import { Cash, Reports, Settings } from "./screens/day";
import { Rooms, Stays } from "./screens/hotel";
import { Moves, Network, Parcels, Preorders, Production, Trips } from "./screens/trade";

/*
 * The app window, drawn at the size of the laptop it will run on.
 *
 * It is laid out at 1200 by 750 and never anything else; the frame around it
 * scales the whole window to the space the page has. That is the difference
 * with the old preview, whose screens reflowed to the width of a side panel
 * and came out as a column of clipped letters: here the product grid, the
 * ticket and the side menu keep the proportions they will have on the day.
 */

export const APP_WIDTH = 1200; // not-a-rule: the app's own layout width, a 1280 laptop less its window edges
export const APP_HEIGHT = 750; // not-a-rule: the app's layout height, under the window's title bar
export const TITLE_HEIGHT = 40; // not-a-rule: the window's title bar

const icons: Record<Section, LucideIcon> = {
  dashboard: LayoutDashboard,
  sale: ShoppingCart,
  counter: ShoppingCart,
  overview: LayoutDashboard,
  menu: BookOpen,
  production: Croissant,
  preorders: ClipboardList,
  moves: ArrowLeftRight,
  rooms: BedDouble,
  stays: CalendarDays,
  extras: ConciergeBell,
  trips: Bus,
  parcels: PackageOpen,
  network: Route,
  stock: Package,
  expenses: HandCoins,
  customers: Users,
  cash: Wallet,
  reports: ChartNoAxesColumn,
  settings: SettingsIcon,
};

export function AppWindow({
  section,
  onSection,
  glow,
}: {
  section: Section;
  onSection: (section: Section) => void;
  glow: { id: number; section: Section } | null;
}) {
  const { configuration, language, words, day, update } = usePreview();
  const sections = sectionsFor(configuration);
  const rtl = language === "ar";
  const name = shopName(configuration, words.shopPlaceholder);

  /* A note says what just happened, then gets out of the way. */
  useEffect(() => {
    if (!day.note) return;
    const id = day.note.id;
    const timer = setTimeout(() => update((current) => (current.note?.id === id ? { ...current, note: null } : current)), 4200); // not-a-rule: ms a note stays
    return () => clearTimeout(timer);
  }, [day.note, update]);

  return (
    <div
      className="overflow-hidden rounded-[18px] border-2 border-app-strong bg-app-background shadow-[0_30px_60px_-20px_rgba(10,10,10,0.35)]"
      style={{ width: APP_WIDTH, height: APP_HEIGHT + TITLE_HEIGHT }}
    >
      <div className="relative flex items-center border-b border-app-line bg-app-hover px-4" style={{ height: TITLE_HEIGHT }}>
        <span className="flex gap-2" aria-hidden>
          <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
          <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
          <span className="h-3.5 w-3.5 rounded-full bg-app-strong" />
        </span>
        <span className="absolute inset-x-24 truncate text-center text-[16px] text-app-ink2">{name}</span>
      </div>

      <div
        dir={rtl ? "rtl" : "ltr"}
        className={cn("relative flex text-app-ink", rtl ? "font-arabic" : "font-serif")}
        style={{ height: APP_HEIGHT }}
      >
        <nav className="flex w-[216px] shrink-0 flex-col overflow-y-auto border-e-2 border-app-line">
          <button
            type="button"
            onClick={() => onSection(sections[0])}
            className="flex w-full flex-col items-center gap-2 border-b border-app-line px-3 py-4 text-center hover:bg-app-hover"
          >
            {configuration.business.logo ? (
              <span className="flex h-20 w-full items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={configuration.business.logo} alt="" className="max-h-full max-w-full object-contain" />
              </span>
            ) : null}
            <span
              className={cn(
                "w-full break-words leading-snug",
                configuration.business.logo ? "text-[17px] font-semibold" : "text-[21px] font-bold",
                name === words.shopPlaceholder && "font-normal italic text-app-ink3"
              )}
            >
              {name}
            </span>
          </button>
          {sections.map((one) => {
            const Icon = icons[one];
            return (
              <button
                key={`${one}-${glow?.section === one ? glow.id : 0}`}
                type="button"
                onClick={() => onSection(one)}
                aria-current={one === section ? "page" : undefined}
                className={cn(
                  "flex min-h-[54px] items-center gap-3 border-b border-app-line px-5 text-start text-[18px]",
                  one === section ? "bg-app-ink font-semibold text-app-surface" : "text-app-ink2 hover:bg-app-hover",
                  glow?.section === one && "animate-answer-glow"
                )}
              >
                <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={1.75} />
                <span className="min-w-0">{words.nav[one]}</span>
              </button>
            );
          })}
          <div className="mt-auto p-3" aria-live="polite">
            {day.note ? (
              <button
                key={day.note.id}
                type="button"
                onClick={() => update((current) => ({ ...current, note: null }))}
                className="w-full animate-fade-in rounded-lg bg-app-ink p-3 text-start text-[16px] font-medium leading-snug text-app-surface"
              >
                {day.note.text}
              </button>
            ) : null}
          </div>
        </nav>

        <main className="relative min-w-0 flex-1">
          <Screen section={section} />
          {glow?.section === section ? (
            <div key={glow.id} className="pointer-events-none absolute inset-0 z-10 animate-answer-glow" aria-hidden />
          ) : null}
        </main>

        <Slips />
      </div>
    </div>
  );
}

function Screen({ section }: { section: Section }) {
  switch (section) {
    case "sale":
      return <Till key="sale" mode="sale" />;
    case "counter":
      return <Till key="counter" mode="counter" />;
    case "extras":
      return <Till key="extras" mode="extras" />;
    case "stock":
      return <Stock />;
    case "menu":
      return <Menu />;
    case "customers":
      return <Customers />;
    case "overview":
    case "dashboard":
      return <Overview />;
    case "expenses":
      return <Expenses />;
    case "cash":
      return <Cash />;
    case "reports":
      return <Reports />;
    case "settings":
      return <Settings />;
    case "production":
      return <Production />;
    case "preorders":
      return <Preorders />;
    case "moves":
      return <Moves />;
    case "rooms":
      return <Rooms />;
    case "stays":
      return <Stays />;
    case "trips":
      return <Trips />;
    case "parcels":
      return <Parcels />;
    case "network":
      return <Network />;
  }
}

/** A ticket's lines as the receipt prints them, the discount as a line of its own. */
export function receiptLines(lines: Line[], discount: number, discountLabel: string): ReceiptLine[] {
  return [
    ...lines.map((line) => ({
      id: line.key,
      name: line.note ? `${line.name} (${line.note})` : line.name,
      quantity: line.quantity,
      unitPrice: line.price,
    })),
    ...(discount > 0 ? [{ id: "discount", name: discountLabel, quantity: 1, unitPrice: -discount }] : []),
  ];
}

/*
 * What the printers push out: the customer's receipt on the 80mm roll, the
 * kitchen's ticket. They come out at the top of the window, stay long enough
 * to read, and go; a click sends one away sooner.
 */
function Slips() {
  const { day, update } = usePreview();
  const shown = day.slips.slice(-2); // not-a-rule: two printers at most, the till's and the kitchen's
  if (shown.length === 0) return null;
  return (
    <div className="pointer-events-none absolute end-6 top-0 z-20 flex items-start gap-4">
      {shown.map((slip) => (
        <Slip key={slip.id} slip={slip} onGone={() => update((current) => ({ ...current, slips: current.slips.filter((one) => one.id !== slip.id) }))} />
      ))}
    </div>
  );
}

function Slip({ slip, onGone }: { slip: Printing; onGone: () => void }) {
  const { configuration, words } = usePreview();
  useEffect(() => {
    const timer = setTimeout(onGone, 5200); // not-a-rule: ms a printed slip stays on screen
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={onGone}
      className="pointer-events-auto max-h-[700px] w-[280px] animate-print-out overflow-hidden bg-white text-start shadow-[0_18px_40px_-12px_rgba(10,10,10,0.45)]"
    >
      {slip.kind === "receipt" ? (
        <Receipt
          configuration={configuration}
          lines={receiptLines(slip.sale.lines, slip.sale.discount, words.till.discountLine)}
          number={slip.sale.number}
          at={slip.sale.at}
        />
      ) : (
        <div dir={configuration.language.app === "ar" ? "rtl" : "ltr"} className="p-5 font-mono text-[15px] leading-relaxed text-black">
          <div className="text-center text-[20px] font-bold">{words.till.kitchenTicket}</div>
          <div className="flex justify-between border-b-2 border-dashed border-black pb-2 text-[17px] font-bold">
            <span>{slip.label}</span>
            <span>{clock(slip.at)}</span>
          </div>
          {slip.lines.map((line) => (
            <div key={line.key} className="mt-2">
              <div className="text-[18px] font-bold">
                {line.quantity} x {line.name}
              </div>
              {line.note ? <div className="ps-4">{line.note}</div> : null}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
