import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/* What the AI reads off the screenshot this time: null when it is busy again. */
const reading = vi.hoisted(() => ({ next: null as Record<string, unknown> | null, calls: 0 }));
const trail = vi.hoisted(() => [] as { subject: string; subjectId: string; action: string; detail?: Record<string, unknown> }[]);
const settings = vi.hoisted(() => ({ autoConfirm: true }));

vi.mock("./read", () => ({
  readReceipt: async () => {
    reading.calls += 1;
    return reading.next;
  },
}));
vi.mock("@/builder/db/audit", () => ({
  audit: async (entry: { subject: string; subjectId: string; action: string; detail?: Record<string, unknown> }) => {
    trail.push(entry);
  },
}));
vi.mock("@/builder/db/settings", () => ({
  getPublicSettings: async () => ({
    price_annual_launch_mru: 1500000,
    price_annual_standard_mru: 1800000,
    price_semiannual_launch_mru: 750000,
    price_semiannual_standard_mru: 900000,
    price_quarterly_launch_mru: null,
    price_quarterly_standard_mru: 450000,
    price_bimonthly_launch_mru: null,
    price_bimonthly_standard_mru: 260000,
    price_monthly_launch_mru: null,
    price_monthly_standard_mru: 130000,
  }),
}));
vi.mock("@/builder/db/private-settings", () => ({
  getPrivateSettings: async () => ({ bankily_number: "38087272", masrvi_number: "38087272", payment_auto_confirm: settings.autoConfirm }),
}));

import type { SupabaseClient } from "@supabase/supabase-js";
import { readAgain, waitBefore } from "./read-again";

const SENT = "2026-11-06T09:00:00.000Z";
const LATER = new Date("2026-11-06T09:02:00.000Z");

type Row = Record<string, unknown>;

/*
 * Just enough of the database for readAgain: payments, the trail, the shop,
 * the licence, and the screenshot in its bucket. Filters are applied for
 * real on payments, so a second claim of the same payment finds nothing.
 */
function fakeDatabase(payment: Row, events: Row[] = [], licence: Row | null = null) {
  const payments: Row[] = [payment];
  const licences: Row[] = licence ? [licence] : [];
  function table(name: string) {
    const filters: ((row: Row) => boolean)[] = [];
    let change: Row | null = null;
    let inserting: Row | null = null;
    const rows = () =>
      name === "payments" ? payments : name === "licences" ? licences : name === "audit_events" ? events : [{ id: "shop", launch_client: true }];
    const matching = () => rows().filter((row) => filters.every((keep) => keep(row)));
    const run = () => {
      if (inserting) {
        const row = { id: "licence-new", ...inserting };
        rows().push(row);
        return [row];
      }
      const found = matching();
      if (change) for (const row of found) Object.assign(row, change);
      /* As a real database does: what comes back is a copy, not the row itself. */
      return found.map((row) => ({ ...row }));
    };
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => (filters.push((row) => row[column] === value), query),
      neq: (column: string, value: unknown) => (filters.push((row) => row[column] !== value), query),
      is: (column: string, value: unknown) => (filters.push((row) => (row[column] ?? null) === value), query),
      gt: (column: string, value: string) => (filters.push((row) => String(row[column]) > value), query),
      order: () => query,
      limit: () => query,
      update: (row: Row) => ((change = row), query),
      insert: (row: Row) => ((inserting = row), query),
      maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
      single: async () => ({ data: run()[0] ?? null, error: null }),
      then: (done: (value: { data: Row[]; error: null }) => void) => done({ data: run(), error: null }),
    };
    return query;
  }
  const client = {
    from: table,
    storage: { from: () => ({ download: async () => ({ data: new Blob([new Uint8Array([1, 2, 3])]), error: null }) }) },
  };
  return { client: client as unknown as SupabaseClient, payments, licences };
}

const waiting = (over: Row = {}): Row => ({
  id: "pay-1",
  business_id: "shop",
  plan: "quarterly",
  app: "bankily",
  expected_amount: 450000,
  screenshot_path: "serial/shop/one.jpg",
  status: "pending_confirmation",
  extracted: null,
  created_at: SENT,
  ...over,
});

const filedAs = (chosen: { plan: boolean; app: boolean }): Row => ({
  subject: "payment",
  subject_id: "pay-1",
  action: "pending_confirmation",
  detail: { chosen },
  created_at: SENT,
});

const ended = { id: "licence-1", business_id: "shop", plan: "trial", status: "trial", starts_at: "2026-10-06T09:00:00.000Z", ends_at: "2026-11-05T09:00:00.000Z" };

/*
 * The day these payments were sent. A licence opened by a payment counts its
 * months from today, so the clock is held on that day or every expected end
 * date would move by one each morning.
 */
afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(LATER);
  reading.next = null;
  reading.calls = 0;
  trail.length = 0;
  settings.autoConfirm = true;
});

describe("a payment the AI could not read when it was sent", () => {
  it("is read again a minute later and, matching, opens the licence for the months chosen", async () => {
    const { client, payments, licences } = fakeDatabase(waiting(), [filedAs({ plan: true, app: true })], { ...ended });
    reading.next = { isReceipt: true, amountMru: 4500, recipient: "38087272", date: "2026-11-06", reference: "BK1" };

    expect(await readAgain(client, "shop", LATER)).toBe("confirmed");
    expect(payments[0]).toMatchObject({ status: "confirmed", auto_confirmed: true, reference: "BK1", plan: "quarterly" });
    expect(payments[0].licence_before).toMatchObject({ id: "licence-1", plan: "trial" });
    /* Three months from the day it was read again, the trial being over. */
    expect(String(licences[0].ends_at).slice(0, 10)).toBe("2027-02-06");
    expect(licences[0].status).toBe("active");
    expect(trail.map((one) => one.action)).toEqual(["read_again", "confirmed_auto", "activated"]);
  });

  it("says the plan from the amount when he chose none, a month for 1 300", async () => {
    const { client, payments, licences } = fakeDatabase(waiting({ plan: "annual", expected_amount: 1500000 }), [filedAs({ plan: false, app: false })], { ...ended });
    reading.next = { isReceipt: true, amountMru: 1300, recipient: "38 08 72 72", date: "2026-11-06", reference: "BK2" };

    expect(await readAgain(client, "shop", LATER)).toBe("confirmed");
    expect(payments[0]).toMatchObject({ plan: "monthly", expected_amount: 130000 });
    expect(String(licences[0].ends_at).slice(0, 10)).toBe("2026-12-06");
  });

  it("measures the date against the day it was sent, not the day it is read again", async () => {
    const { client } = fakeDatabase(waiting({ created_at: "2026-11-06T23:58:00.000Z" }), [filedAs({ plan: true, app: true })], { ...ended });
    reading.next = { isReceipt: true, amountMru: 4500, recipient: "38087272", date: "2026-11-06", reference: "BK3" };
    expect(await readAgain(client, "shop", new Date("2026-11-07T00:05:00.000Z"))).toBe("confirmed");
  });

  it("waits its minute, so a busy AI is not asked every few seconds", async () => {
    const { client } = fakeDatabase(waiting(), [filedAs({ plan: true, app: true })]);
    expect(await readAgain(client, "shop", new Date("2026-11-06T09:00:30.000Z"))).toBe("waiting");
    expect(reading.calls).toBe(0);

    const tried = fakeDatabase(waiting(), [{ subject: "payment", subject_id: "pay-1", action: "read_again", created_at: "2026-11-06T09:01:40.000Z" }, filedAs({ plan: true, app: true })]);
    expect(await readAgain(tried.client, "shop", LATER)).toBe("waiting");
    expect(reading.calls).toBe(0);
  });

  it("stays waiting, and counted, while the AI is still busy", async () => {
    const { client, payments } = fakeDatabase(waiting(), [filedAs({ plan: true, app: true })]);
    expect(await readAgain(client, "shop", LATER)).toBe("waiting");
    expect(reading.calls).toBe(1);
    expect(payments[0]).toMatchObject({ status: "pending_confirmation", extracted: null });
    expect(trail.map((one) => one.action)).toEqual(["read_again"]);
  });

  it("waits longer after each try, an hour at most: a busy minute, then a spent day", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 29].map((tries) => waitBefore(tries) / 60_000)).toEqual([1, 2, 4, 8, 16, 32, 60, 60]);
    /* Thirty tries cover a day, so the next day's allowance is caught. */
    const total = Array.from({ length: 30 }, (_, tries) => waitBefore(tries)).reduce((sum, wait) => sum + wait, 0);
    expect(total / 3_600_000).toBeGreaterThan(24);
  });

  it("gives it to a person after thirty tries", async () => {
    const tries = Array.from({ length: 30 }, () => ({ subject: "payment", subject_id: "pay-1", action: "read_again", created_at: SENT }));
    const { client } = fakeDatabase(waiting(), [...tries, filedAs({ plan: true, app: true })]);
    expect(await readAgain(client, "shop", new Date("2026-11-06T12:00:00.000Z"))).toBe("waiting");
    expect(reading.calls).toBe(0);
  });

  it("keeps what it read and leaves it to a person when it does not match: the wrong amount", async () => {
    const { client, payments, licences } = fakeDatabase(waiting(), [filedAs({ plan: true, app: true })], { ...ended });
    reading.next = { isReceipt: true, amountMru: 2600, recipient: "38087272", date: "2026-11-06", reference: "BK4" };

    expect(await readAgain(client, "shop", LATER)).toBe("for_a_person");
    expect(payments[0].status).toBe("pending_confirmation");
    expect(payments[0].extracted).toMatchObject({ amountMru: 2600 });
    expect(licences[0].ends_at).toBe(ended.ends_at);
    expect(trail.at(-1)?.action).toBe("read_again_unmatched");
  });

  it("confirms once when two devices ask at the same moment", async () => {
    const { client, licences } = fakeDatabase(waiting(), [filedAs({ plan: true, app: true })], { ...ended });
    reading.next = { isReceipt: true, amountMru: 4500, recipient: "38087272", date: "2026-11-06", reference: "BK5" };

    const answers = await Promise.all([readAgain(client, "shop", LATER), readAgain(client, "shop", LATER)]);
    expect(answers.filter((one) => one === "confirmed")).toHaveLength(1);
    expect(String(licences[0].ends_at).slice(0, 10)).toBe("2027-02-06");
  });

  it("does nothing while staff send every payment to a person", async () => {
    settings.autoConfirm = false;
    const { client } = fakeDatabase(waiting(), [filedAs({ plan: true, app: true })]);
    expect(await readAgain(client, "shop", LATER)).toBe("waiting");
    expect(reading.calls).toBe(0);
  });

  it("finds nothing to do for a shop with no unread payment", async () => {
    const { client } = fakeDatabase(waiting({ extracted: { amountMru: 4500 } }));
    expect(await readAgain(client, "shop", LATER)).toBe("none");
  });
});
