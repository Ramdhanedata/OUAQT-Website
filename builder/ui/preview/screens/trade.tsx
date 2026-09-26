"use client";

import { useState } from "react";
import { Plus, Armchair } from "lucide-react";
import { sampleLocations } from "@/app-ui";
import { cn } from "@/lib/utils";
import { clock } from "../model";
import {
  BATCH_SIZE,
  DEPARTURES_A_DAY,
  PARCEL_PRICE,
  sampleGuests,
  sampleItems,
  sampleMoves,
  sampleParcels,
  samplePreorders,
  sampleProduction,
  sampleTrips,
} from "../samples";
import { nextId, usePreview } from "../store";
import { Button, Chip, Money, Screen, Table, Tag } from "../ui";
import { fill } from "../words";

/*
 * The screens only one trade has: a bakery's production and orders, a
 * warehouse's movements, a transport company's departures, parcels and
 * routes. Each is sized and worded by the owner's own answers.
 */

export function Production() {
  const { configuration, words, items, day, update, say } = usePreview();
  const w = words.production;
  const unsold = configuration.features.bakery?.unsold ?? "loss";
  const rows = sampleProduction()
    .map((row, index) => ({ ...row, item: items.find((item) => item.id === row.id) ?? items[index] }))
    .filter((row) => row.item);

  return (
    <Screen title={w.title}>
      <Table
        columns="2.2fr 1fr 1fr 1fr 1.3fr"
        head={[words.stock.product, w.made, w.sold, w.left, ""]}
        rows={rows.map(({ item, made, sold }) => {
          const madeNow = made + (day.made[item.id] ?? 0);
          const soldNow = sold + (day.sold[item.id] ?? 0);
          return {
            key: item.id,
            cells: [
              <span key="n" className="font-semibold">
                {item.name}
              </span>,
              <span key="m" className="tabular-nums">{madeNow}</span>,
              <span key="s" className="tabular-nums">{soldNow}</span>,
              <span key="l" className="font-semibold tabular-nums">{Math.max(0, madeNow - soldNow)}</span>,
              <Button
                key="b"
                className="min-h-[44px] px-4 text-[16px]"
                onClick={() => {
                  update((current) => ({ ...current, made: { ...current.made, [item.id]: (current.made[item.id] ?? 0) + BATCH_SIZE } }));
                  say(words.notes.batchAdded);
                }}
              >
                <Plus className="h-4 w-4" />
                {w.addBatch} {BATCH_SIZE}
              </Button>,
            ],
          };
        })}
      />
      <p className="mx-7 mb-7 rounded-xl border border-app-line bg-app-raised px-5 py-4 text-[18px] text-app-ink2">
        {unsold === "loss" ? w.loss : unsold === "resell" ? w.resell : w.untracked}
      </p>
    </Screen>
  );
}

export function Preorders() {
  const { configuration, language, words, day, update, say } = usePreview();
  const w = words.preorders;
  const deposit = configuration.features.bakery?.deposit !== false;
  const base = samplePreorders(language);
  const added = Array.from({ length: day.preorders }, (_, index) => ({
    ...base[index % base.length],
    id: `n${index}`,
    customer: sampleGuests[index % sampleGuests.length],
    dueToday: false,
  }));
  const rows = [...base, ...added];

  return (
    <Screen
      title={w.title}
      aside={
        <Button
          kind="primary"
          onClick={() => {
            update((current) => ({ ...current, preorders: current.preorders + 1 }));
            say(words.notes.orderAdded);
          }}
        >
          {w.newOrder}
        </Button>
      }
    >
      <Table
        columns={deposit ? "1.4fr 2fr 1.3fr 1.2fr" : "1.4fr 2fr 1.3fr"}
        head={deposit ? [w.customer, w.order, w.due, w.deposit] : [w.customer, w.order, w.due]}
        rows={rows.map((row) => ({
          key: row.id,
          cells: [
            <span key="c" className="font-semibold">
              {row.customer}
            </span>,
            row.order,
            <span key="d">
              {row.dueToday ? <Tag tone="gold">{w.today}</Tag> : w.tomorrow} {row.at}
            </span>,
            ...(deposit
              ? [row.deposit ? <Money key="a" value={row.deposit} language={language} /> : <span key="a" className="text-app-ink3">{w.noDeposit}</span>]
              : []),
          ],
        }))}
      />
    </Screen>
  );
}

export function Moves() {
  const { configuration, language, words, items, day, update, say } = usePreview();
  const w = words.moves;
  const warehouse = configuration.features.warehouse;
  const places = sampleLocations(warehouse?.locations ?? 1, language);
  const destinations = warehouse?.destinations ?? ["customers"];
  const units = warehouse?.units ?? ["piece"];
  const [place, setPlace] = useState<number | null>(null);

  const all = [
    ...sampleMoves().map((move, index) => ({ ...move, itemId: move.item, place: index % places.length })),
    ...day.moves.map((move) => ({ ...move, unitIndex: 0 })),
  ].filter((move) => place === null || move.place === place);

  const record = (direction: "in" | "out") => {
    const item = items[(day.moves.length + 1) % items.length];
    const quantity = direction === "in" ? BATCH_SIZE : BATCH_SIZE / 2;
    update((current) => ({
      ...current,
      moves: [
        ...current.moves,
        { id: `v${nextId()}`, direction, itemId: item.id, quantity, party: current.moves.length, at: clock(new Date()), place: place ?? 0 },
      ],
      sold: direction === "out" ? { ...current.sold, [item.id]: (current.sold[item.id] ?? 0) + quantity } : current.sold,
      received: direction === "in" ? { ...current.received, [item.id]: (current.received[item.id] ?? 0) + quantity } : current.received,
    }));
    say(words.notes.moveAdded);
  };

  return (
    <Screen
      title={w.title}
      aside={
        <>
          {warehouse?.recordEntries !== false ? <Button onClick={() => record("in")}>{w.in}</Button> : null}
          <Button kind="primary" onClick={() => record("out")}>
            {w.out}
          </Button>
        </>
      }
    >
      {places.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto px-7 pt-5">
          <Chip selected={place === null} onClick={() => setPlace(null)}>
            {w.all}
          </Chip>
          {places.map((name, index) => (
            <Chip key={name} selected={place === index} onClick={() => setPlace(index)}>
              {name}
            </Chip>
          ))}
        </div>
      ) : null}
      <Table
        columns={places.length > 1 ? "0.8fr 1fr 2.2fr 1.2fr 1.5fr 1.2fr" : "0.8fr 1fr 2.2fr 1.2fr 1.5fr"}
        head={[w.at, "", w.product, w.quantity, w.party, ...(places.length > 1 ? [w.place] : [])]}
        rows={[...all].reverse().map((move) => {
          const item = items.find((one) => one.id === move.itemId) ?? items[0];
          const unit = units[move.unitIndex % units.length];
          const party = move.party === "supplier" || move.direction === "in" ? w.supplier : w[destinations[Number(move.party) % destinations.length]];
          return {
            key: move.id,
            cells: [
              <span key="t" className="tabular-nums text-app-ink3">{move.at}</span>,
              <Tag key="d" tone={move.direction === "in" ? "success" : "gold"}>
                {move.direction === "in" ? w.in : w.out}
              </Tag>,
              <span key="p" className="font-semibold">{item?.name}</span>,
              <span key="q" className="tabular-nums">
                {move.quantity} {w[unit]}
              </span>,
              party,
              ...(places.length > 1 ? [places[move.place] ?? places[0]] : []),
            ],
          };
        })}
      />
    </Screen>
  );
}

export function Trips() {
  const { configuration, words, day, update, say, go } = usePreview();
  const w = words.trips;
  const transport = configuration.features.transport;
  const passengers = (transport?.carries ?? ["passengers"]).includes("passengers");
  const parcels = (transport?.carries ?? []).includes("parcels");
  const routes = sampleItems("transport");
  const trips = sampleTrips();
  const [chosen, setChosen] = useState(trips[0].id);
  const trip = trips.find((one) => one.id === chosen) ?? trips[0];
  const language = configuration.language.app;
  const routeName = (id: string) => routes.find((route) => route.id === id)?.name[language] ?? "";
  const soldOf = (one: (typeof trips)[number]) =>
    transport?.seatNumbers ? [...one.sold, ...(day.seats[one.id] ?? [])] : one.sold.concat(Array.from({ length: day.tickets[one.id] ?? 0 }, () => 0));
  const sold = soldOf(trip);
  const full = sold.length >= trip.seats;

  return (
    <Screen title={w.title}>
      <div className="grid h-full grid-cols-[380px_1fr]">
        <ul className="divide-y divide-app-line border-e border-app-line">
          {trips.map((one) => (
            <li key={one.id}>
              <button
                type="button"
                onClick={() => setChosen(one.id)}
                className={cn("w-full px-7 py-5 text-start", one.id === chosen ? "bg-app-hover" : "hover:bg-app-hover")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[24px] font-bold tabular-nums">{one.at}</span>
                  {passengers && soldOf(one).length >= one.seats ? <Tag tone="danger">{w.full}</Tag> : null}
                </div>
                <div className="mt-1 text-[18px] font-semibold">{routeName(one.route)}</div>
                <div className="mt-1 flex gap-4 text-[16px] text-app-ink3">
                  {passengers ? (
                    <span>
                      {soldOf(one).length}/{one.seats} {w.seats}
                    </span>
                  ) : null}
                  {parcels ? (
                    <span>
                      {one.parcels} {w.parcels}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="p-7">
          <div className="text-[22px] font-semibold">
            {trip.at} · {routeName(trip.route)}
          </div>
          {!passengers ? (
            <div className="mt-6 flex items-center gap-6">
              <span className="text-[44px] font-bold">{trip.parcels}</span>
              <span className="text-[20px] text-app-ink2">{w.parcels}</span>
              <Button onClick={() => go("parcels")}>{words.nav.parcels}</Button>
            </div>
          ) : transport?.seatNumbers ? (
            <>
              <p className="mt-2 text-[17px] text-app-ink3">{w.chooseSeat}</p>
              <div className="mt-5 w-[330px] rounded-2xl border-2 border-app-strong bg-app-raised p-5">
                <div className="mb-4 flex justify-end">
                  <span className="rounded-lg bg-app-hover px-3 py-1 text-[15px] text-app-ink2">{w.driver}</span>
                </div>
                <div className="grid grid-cols-[1fr_1fr_28px_1fr] gap-3">
                  {Array.from({ length: trip.seats }, (_, index) => index + 1).flatMap((seat) => {
                    const taken = sold.includes(seat);
                    const button = (
                      <button
                        key={seat}
                        type="button"
                        disabled={taken}
                        onClick={() => {
                          update((current) => ({ ...current, seats: { ...current.seats, [trip.id]: [...(current.seats[trip.id] ?? []), seat] } }));
                          say(fill(words.notes.seatSold, seat));
                        }}
                        className={cn(
                          "flex h-[60px] flex-col items-center justify-center rounded-lg border-2 text-[16px] font-semibold",
                          taken ? "border-app-ink bg-app-ink text-app-surface" : "border-app-strong bg-app-surface hover:bg-app-hover"
                        )}
                      >
                        <Armchair className="h-5 w-5" />
                        {seat}
                      </button>
                    );
                    /* Two seats, the aisle, one seat. */
                    return seat % 3 === 2 ? [button, <span key={`aisle-${seat}`} />] : [button];
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 flex items-center gap-8">
              <span className="text-[52px] font-bold tabular-nums">
                {sold.length}/{trip.seats}
              </span>
              <span className="text-[20px] text-app-ink2">{w.seats}</span>
              <Button
                kind="primary"
                disabled={full}
                onClick={() => {
                  update((current) => ({ ...current, tickets: { ...current.tickets, [trip.id]: (current.tickets[trip.id] ?? 0) + 1 } }));
                  say(words.notes.ticketSold);
                }}
              >
                {w.sellTicket}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}

export function Parcels() {
  const { configuration, language, words, day, update, say } = usePreview();
  const w = words.parcels;
  const payer = configuration.features.transport?.parcelPayer ?? "either";
  const routes = sampleItems("transport");
  const added = Array.from({ length: day.parcels }, (_, index) => ({
    id: `k${index + 3}`,
    number: sampleParcels[sampleParcels.length - 1].number + index + 1,
    route: routes[index % routes.length].id,
    sender: sampleGuests[(index + 2) % sampleGuests.length],
    receiver: sampleGuests[(index + 4) % sampleGuests.length],
    paidAtStart: index % 2 === 0,
  }));
  const rows = [...sampleParcels, ...added];
  const paid = (paidAtStart: boolean) => (payer === "sender" ? true : payer === "receiver" ? false : paidAtStart);

  return (
    <Screen
      title={w.title}
      aside={
        <Button
          kind="primary"
          onClick={() => {
            update((current) => ({ ...current, parcels: current.parcels + 1 }));
            say(words.notes.parcelAdded);
          }}
        >
          {w.newParcel}
        </Button>
      }
    >
      <Table
        columns="0.7fr 1.8fr 1.4fr 1.4fr 1.4fr"
        head={[w.number, w.route, w.sender, w.receiver, ""]}
        rows={[...rows].reverse().map((row) => ({
          key: row.id,
          cells: [
            <span key="n" className="tabular-nums text-app-ink3">{row.number}</span>,
            routes.find((route) => route.id === row.route)?.name[language] ?? "",
            row.sender,
            row.receiver,
            paid(row.paidAtStart) ? (
              <Tag key="p" tone="success">{w.paidAtStart}</Tag>
            ) : (
              <Tag key="p" tone="warning">{w.payOnArrival}</Tag>
            ),
          ],
        }))}
      />
    </Screen>
  );
}

export function Network() {
  const { configuration, language, words } = usePreview();
  const w = words.network;
  const parcels = (configuration.features.transport?.carries ?? []).includes("parcels");
  const routes = sampleItems("transport");

  return (
    <Screen title={w.title}>
      <Table
        columns={parcels ? "2.2fr 1.2fr 1.2fr 1fr" : "2.2fr 1.2fr 1fr"}
        head={parcels ? [w.route, w.price, w.parcel, w.departures] : [w.route, w.price, w.departures]}
        rows={routes.map((route, index) => ({
          key: route.id,
          cells: [
            <span key="r" className="font-semibold">
              {route.name[language]}
            </span>,
            <Money key="p" value={route.price} language={language} />,
            ...(parcels ? [<Money key="c" value={PARCEL_PRICE} language={language} />] : []),
            DEPARTURES_A_DAY[index % DEPARTURES_A_DAY.length],
          ],
        }))}
      />
    </Screen>
  );
}
