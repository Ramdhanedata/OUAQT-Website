"use client";

import { createContext, useContext } from "react";
import type { AppLanguage, Configuration } from "@/app-ui";
import type { Item, Section } from "./model";
import type { Words } from "./words";

/*
 * The preview's day: what the owner has done in it so far.
 *
 * It is a working copy of the app, so what happens on one screen shows on the
 * others. A sale rung up at the till lowers the stock, lands in the report
 * and in the till's count; a sale on credit shows on the customer's account.
 * Nothing leaves the page, and it all starts again when the trade changes.
 */

export type Line = {
  key: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  weighed?: boolean;
  note?: string;
};

export type Sale = {
  number: number;
  lines: Line[];
  discount: number;
  total: number;
  method: "cash" | "credit" | "room";
  who?: string;
  at: Date;
};

export type OpenOrder = { id: string; label: string; table?: number; lines: Line[]; since: Date };

export type Printing =
  | { id: number; kind: "receipt"; sale: Sale }
  | { id: number; kind: "kitchen"; label: string; lines: Line[]; at: Date };

export type Day = {
  /* The ticket being rung up on each till, kept here so it survives enlarging the window. */
  basket: Partial<Record<"sale" | "counter" | "extras", Line[]>>;
  sales: Sale[];
  open: OpenOrder[];
  sold: Record<string, number>;
  received: Record<string, number>;
  owed: Record<string, number>;
  rooms: Record<number, { guest: string; nights: number; advance: number } | "free">;
  roomCharges: Record<number, number>;
  seats: Record<string, number[]>;
  tickets: Record<string, number>;
  parcels: number;
  moves: { id: string; direction: "in" | "out"; itemId: string; quantity: number; party: number; at: string; place: number }[];
  made: Record<string, number>;
  preorders: number;
  expenses: number;
  closed: boolean;
  /* What is coming out of the printers right now: a receipt, a kitchen ticket, or both. */
  slips: Printing[];
  note: { id: number; text: string } | null;
};

export function newDay(open: OpenOrder[] = []): Day {
  return {
    basket: {},
    sales: [],
    open,
    sold: {},
    received: {},
    owed: {},
    rooms: {},
    roomCharges: {},
    seats: {},
    tickets: {},
    parcels: 0,
    moves: [],
    made: {},
    preorders: 0,
    expenses: 0,
    closed: false,
    slips: [],
    note: null,
  };
}

export type Staff = { name: string; role: "manager" | "cashier" };

export type PreviewContext = {
  configuration: Configuration;
  language: AppLanguage;
  words: Words;
  items: Item[];
  staff: Staff[];
  day: Day;
  update: (change: (day: Day) => Day) => void;
  say: (text: string) => void;
  go: (section: Section) => void;
  /* A screen to open inside a section, set by the owner's last answer and then consumed. */
  detail: "tables" | null;
  clearDetail: () => void;
};

export const Preview = createContext<PreviewContext | null>(null);

export function usePreview(): PreviewContext {
  const context = useContext(Preview);
  if (!context) throw new Error("usePreview outside the preview");
  return context;
}

/** What is left of an item once today's sales and deliveries are counted. */
export function onHand(item: Item, day: Day): number | null {
  if (item.stock === null) return null;
  return Math.max(0, item.stock - (day.sold[item.id] ?? 0) + (day.received[item.id] ?? 0));
}

let counter = 0;
/** A fresh id for a note, a slip or a line: only ever compared, never shown. */
export function nextId(): number {
  counter += 1;
  return counter;
}
