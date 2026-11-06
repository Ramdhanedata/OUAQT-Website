import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, grantLicence } from "./grant";

/*
 * A database with one shop's licence in it, or none, that keeps what was
 * written to it: enough of the client for grantLicence's three calls.
 */
function fakeDatabase(licence: Record<string, unknown> | null) {
  const written: { update?: Record<string, unknown>; insert?: Record<string, unknown> } = {};
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: async () => ({ data: licence }),
  };
  const client = {
    from: () => ({
      ...query,
      update: (row: Record<string, unknown>) => {
        written.update = row;
        return { eq: async () => ({ error: null }) };
      },
      insert: (row: Record<string, unknown>) => {
        written.insert = row;
        return { select: () => ({ single: async () => ({ data: { id: "new" }, error: null }) }) };
      },
    }),
  };
  return { client: client as unknown as SupabaseClient, written };
}

const NOW = new Date("2026-11-06T10:00:00.000Z");

describe("paying for N months", () => {
  it.each([
    ["monthly", "2026-12-06T10:00:00.000Z"],
    ["bimonthly", "2027-01-06T10:00:00.000Z"],
    ["quarterly", "2027-02-06T10:00:00.000Z"],
    ["semiannual", "2027-05-06T10:00:00.000Z"],
    ["annual", "2027-11-06T10:00:00.000Z"],
  ])("%s opens a licence that ends that many months from today", async (plan, end) => {
    const { client, written } = fakeDatabase(null);
    const granted = await grantLicence(client, { business_id: "shop", plan }, NOW);
    expect(granted.ok && granted.endsAt).toBe(end);
    expect(written.insert?.ends_at).toBe(end);
    /* Every length is the same kind of licence; only the dates differ. */
    expect(written.insert?.plan).toBe("annual");
    expect(written.insert?.status).toBe("active");
  });

  it("adds the months to the end he already has, so paying early loses no day", async () => {
    const { client, written } = fakeDatabase({
      id: "licence",
      plan: "annual",
      status: "active",
      starts_at: "2026-01-01T00:00:00.000Z",
      ends_at: "2026-11-20T00:00:00.000Z",
    });
    const granted = await grantLicence(client, { business_id: "shop", plan: "bimonthly" }, NOW);
    expect(granted.ok && granted.endsAt).toBe("2027-01-20T00:00:00.000Z");
    expect(written.update?.ends_at).toBe("2027-01-20T00:00:00.000Z");
    expect(written.update?.plan).toBe("annual");
  });

  it("counts from today when the licence has already ended", async () => {
    const { client } = fakeDatabase({
      id: "licence",
      plan: "annual",
      status: "renewal_due",
      starts_at: "2025-01-01T00:00:00.000Z",
      ends_at: "2026-10-01T00:00:00.000Z",
    });
    const granted = await grantLicence(client, { business_id: "shop", plan: "monthly" }, NOW);
    expect(granted.ok && granted.endsAt).toBe("2026-12-06T10:00:00.000Z");
  });

  it("keeps a suspended licence suspended: time is bought, the decision stays a person's", async () => {
    const { client, written } = fakeDatabase({
      id: "licence",
      plan: "annual",
      status: "suspended",
      starts_at: null,
      ends_at: null,
    });
    await grantLicence(client, { business_id: "shop", plan: "quarterly" }, NOW);
    expect(written.update?.status).toBe("suspended");
  });

  it("gives a perpetual licence no end date", async () => {
    const { client, written } = fakeDatabase(null);
    await grantLicence(client, { business_id: "shop", plan: "perpetual" }, NOW);
    expect(written.insert?.ends_at).toBeNull();
    expect(written.insert?.plan).toBe("perpetual");
  });
});

describe("a month on, by the calendar", () => {
  it("lands on the same day of the month", () => {
    expect(addMonths(new Date("2026-03-15T00:00:00Z"), 1).toISOString()).toBe("2026-04-15T00:00:00.000Z");
    expect(addMonths(new Date("2026-11-15T00:00:00Z"), 2).toISOString()).toBe("2027-01-15T00:00:00.000Z");
  });

  it("rolls a day the month lacks into the next, so no paid day is lost", () => {
    expect(addMonths(new Date("2027-01-31T00:00:00Z"), 1).toISOString()).toBe("2027-03-03T00:00:00.000Z");
  });
});
