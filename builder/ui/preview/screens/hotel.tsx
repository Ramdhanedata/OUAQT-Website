"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { shortDate } from "../model";
import { NIGHT_PRICE, sampleGuests } from "../samples";
import { usePreview, type Day } from "../store";
import { Button, Dialog, Field, Money, Screen, Table, Tag } from "../ui";
import { fill } from "../words";

/*
 * A hotel's two screens: the board of rooms, sized by the owner's own count,
 * and the list of who is staying. Checking a guest in on the board puts them
 * on the list, and a dinner charged from the Extras screen lands on their
 * bill.
 */

const ROOMS_PER_FLOOR = 10;

export type Room = {
  number: number;
  floor: number;
  state: "free" | "occupied" | "cleaning";
  guest?: string;
  nights?: number;
  advance?: number;
  arrival?: Date;
};

export function hotelRooms(count: number, day: Day): Room[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const floor = Math.floor(index / ROOMS_PER_FLOOR) + 1;
    const number = floor * 100 + (index % ROOMS_PER_FLOOR) + 1; // not-a-rule: rooms numbered by floor, 101, 102
    const set = day.rooms[number];
    if (set === "free") return { number, floor, state: "free" };
    if (set) {
      return { number, floor, state: "occupied", guest: set.guest, nights: set.nights, advance: set.advance, arrival: today };
    }
    /* Every third room taken and the odd one waiting for cleaning, so the board shows all three states. */
    if (index % 3 === 0) {
      const arrival = new Date(today);
      arrival.setDate(today.getDate() - ((index / 3) % 3));
      return {
        number,
        floor,
        state: "occupied",
        guest: sampleGuests[(index / 3) % sampleGuests.length],
        nights: 1 + (index % 4),
        advance: index % 2 === 0 ? NIGHT_PRICE : 0, // not-a-rule: every other sample guest paid ahead
        arrival,
      };
    }
    if (index % 7 === 4) return { number, floor, state: "cleaning" };
    return { number, floor, state: "free" };
  });
}

export function Rooms() {
  const { configuration, words, day, update, say, go } = usePreview();
  const w = words.rooms;
  const hotel = configuration.features.hotel;
  const rooms = hotelRooms(hotel?.rooms ?? 1, day);
  const floors = [...new Set(rooms.map((room) => room.floor))];
  const [arriving, setArriving] = useState<number | null>(null);

  return (
    <Screen
      title={`${w.title} (${rooms.length})`}
      aside={
        <>
          <Tag tone="neutral">{fill(w.count, rooms.filter((room) => room.state === "occupied").length)}</Tag>
          <Legend className="bg-app-raised border-app-strong" label={w.free} />
          <Legend className="bg-app-ink border-app-ink" label={w.occupied} />
          <Legend className="bg-app-warning-soft border-app-warning" label={w.cleaning} />
        </>
      }
    >
      <div className="space-y-6 p-7">
        {floors.map((floor) => (
          <section key={floor}>
            {floors.length > 1 ? (
              <h2 className="mb-3 text-[18px] font-semibold text-app-ink2">
                {w.floor} {floor}
              </h2>
            ) : null}
            <div className="grid grid-cols-5 gap-3">
              {rooms
                .filter((room) => room.floor === floor)
                .map((room) => (
                  <button
                    key={room.number}
                    type="button"
                    onClick={() => {
                      if (room.state === "free") setArriving(room.number);
                      else if (room.state === "cleaning") update((current) => ({ ...current, rooms: { ...current.rooms, [room.number]: "free" } }));
                      else go("stays");
                    }}
                    className={cn(
                      "flex min-h-[104px] flex-col justify-between rounded-xl border-2 p-4 text-start",
                      room.state === "free" && "border-app-strong bg-app-raised hover:bg-app-hover",
                      room.state === "occupied" && "border-app-ink bg-app-ink text-app-surface",
                      room.state === "cleaning" && "border-app-warning bg-app-warning-soft text-app-warning"
                    )}
                  >
                    <span className="text-[24px] font-bold">{room.number}</span>
                    <span className="truncate text-[16px]">
                      {room.state === "occupied" ? room.guest : room.state === "cleaning" ? w.cleaning : w.free}
                    </span>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>

      {arriving !== null ? (
        <CheckIn
          room={arriving}
          onClose={() => setArriving(null)}
          onDone={(guest, nights, advance) => {
            update((current) => ({ ...current, rooms: { ...current.rooms, [arriving]: { guest, nights, advance } } }));
            say(fill(words.notes.checkedIn, arriving));
            setArriving(null);
          }}
        />
      ) : null}
    </Screen>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[16px] text-app-ink2">
      <span className={cn("h-4 w-4 rounded border-2", className)} />
      {label}
    </span>
  );
}

function CheckIn({
  room,
  onClose,
  onDone,
}: {
  room: number;
  onClose: () => void;
  onDone: (guest: string, nights: number, advance: number) => void;
}) {
  const { configuration, language, words } = usePreview();
  const w = words.rooms;
  const hotel = configuration.features.hotel;
  const [guest, setGuest] = useState(sampleGuests[room % sampleGuests.length]);
  const [document, setDocument] = useState("");
  const [nights, setNights] = useState(2);
  const [advance, setAdvance] = useState(true);

  return (
    <Dialog title={fill(w.checkIn, room)} onClose={onClose}>
      <div className="space-y-4">
        <Field label={w.guest} value={guest} onChange={setGuest} />
        {hotel?.guestDocument ? <Field label={w.document} value={document} onChange={setDocument} /> : null}
        <div>
          <span className="mb-1.5 block text-[16px] text-app-ink2">{w.nights}</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setNights((value) => Math.max(1, value - 1))} className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-app-strong">
              <Minus className="h-5 w-5" />
            </button>
            <span className="min-w-[48px] text-center text-[22px] font-bold">{nights}</span>
            <button type="button" onClick={() => setNights((value) => value + 1)} className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-app-strong">
              <Plus className="h-5 w-5" />
            </button>
            <span className="ms-auto text-[20px] font-bold">
              <Money value={nights * NIGHT_PRICE} language={language} />
            </span>
          </div>
        </div>
        {hotel?.advances ? (
          <button
            type="button"
            onClick={() => setAdvance((value) => !value)}
            className={cn(
              "flex min-h-[52px] w-full items-center justify-between rounded-lg border-2 px-4 text-[18px]",
              advance ? "border-app-gold bg-app-warning-soft font-semibold" : "border-app-strong"
            )}
          >
            <span className="flex items-center gap-2">
              {advance ? <Check className="h-5 w-5" /> : null}
              {w.advance}
            </span>
            <Money value={NIGHT_PRICE} language={language} />
          </button>
        ) : null}
      </div>
      <div className="mt-7 flex justify-end">
        <Button kind="primary" onClick={() => onDone(guest.trim() || sampleGuests[0], nights, hotel?.advances && advance ? NIGHT_PRICE : 0)}>
          {w.confirm}
        </Button>
      </div>
    </Dialog>
  );
}

export function Stays() {
  const { configuration, language, words, day } = usePreview();
  const w = words.stays;
  const hotel = configuration.features.hotel;
  const staying = hotelRooms(hotel?.rooms ?? 1, day)
    .filter((room) => room.state === "occupied")
    .sort((a, b) => Number(Boolean(day.rooms[b.number])) - Number(Boolean(day.rooms[a.number])))
    .slice(0, 14);

  const head = [w.guest, w.room, w.arrival, w.nights, ...(hotel?.advances ? [w.advance] : []), ...(hotel?.guestDocument ? [w.document] : []), w.balance];
  const columns = ["2fr", "0.8fr", "1.2fr", "0.7fr", ...(hotel?.advances ? ["1.3fr"] : []), ...(hotel?.guestDocument ? ["0.8fr"] : []), "1.4fr"].join(" ");

  return (
    <Screen title={w.title}>
      <Table
        columns={columns}
        head={head}
        rows={staying.map((room) => {
          const owed = (room.nights ?? 1) * NIGHT_PRICE + (day.roomCharges[room.number] ?? 0) - (room.advance ?? 0);
          return {
            key: String(room.number),
            strong: Boolean(day.rooms[room.number]),
            cells: [
              room.guest,
              room.number,
              room.arrival ? shortDate(room.arrival, language) : "",
              room.nights,
              ...(hotel?.advances
                ? [<Money key="a" value={room.advance ?? 0} language={language} className={room.advance ? undefined : "text-app-ink3"} />]
                : []),
              ...(hotel?.guestDocument ? [<Tag key="d" tone="success">{w.checked}</Tag>] : []),
              <Money key="b" value={owed} language={language} className="font-semibold" />,
            ],
          };
        })}
      />
    </Screen>
  );
}
