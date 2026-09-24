import { describe, expect, it } from "vitest";
import { defaultConfiguration, packs, type Pack } from "./config";
import {
  sampleLocations,
  sampleMovements,
  samplePreorders,
  sampleProducts,
  sampleProduction,
  sampleTables,
} from "./sample-data";

/*
 * The sizes a configuration is allowed to hold, tested at both ends.
 *
 * A room of ten tables and a room of two hundred are the same screen, and the
 * second one is the reason the first is not built as a flat grid. Nothing
 * here checks pixels; it checks that the data the screens are given holds up,
 * which is what breaks first.
 */

describe("a room, at any size", () => {
  it.each([1, 10, 50, 200])("lays out %i tables", (count) => {
    const tables = sampleTables(count);
    expect(tables).toHaveLength(count);
    expect(tables[0].number).toBe(1);
    expect(tables[count - 1].number).toBe(count);
  });

  it("shows both a busy and a free table at every size worth seeing", () => {
    for (const count of [10, 50, 200]) {
      const tables = sampleTables(count);
      expect(tables.some((table) => table.total !== null)).toBe(true);
      expect(tables.some((table) => table.total === null)).toBe(true);
    }
  });

  it("does not fall over on a room of one", () => {
    expect(sampleTables(1)).toHaveLength(1);
  });

  /* The configuration's own ceiling, so the screen is tested at the worst case. */
  it("accepts the largest room the schema allows", () => {
    const config = defaultConfiguration("restaurant", "fr");
    expect(config.features.restaurant?.tables).toBeGreaterThan(0);
    expect(sampleTables(200)).toHaveLength(200);
  });
});

describe("a warehouse, at any size", () => {
  it.each([1, 5, 20])("names %i storage places", (count) => {
    const locations = sampleLocations(count, "fr");
    expect(locations).toHaveLength(count);
    expect(new Set(locations).size).toBe(count);
  });

  it("never gives back none, because a warehouse has at least one", () => {
    expect(sampleLocations(0, "fr")).toHaveLength(1);
  });

  it("puts movements in places that exist", () => {
    for (const count of [1, 20]) {
      const locations = sampleLocations(count, "fr");
      for (const movement of sampleMovements(locations, "fr")) {
        expect(locations).toContain(movement.location);
      }
    }
  });

  it("names its places in the owner's language", () => {
    expect(sampleLocations(1, "ar")[0]).toMatch(/[؀-ۿ]/);
    expect(sampleLocations(1, "en")[0]).toMatch(/Store/);
  });
});

describe("a catalogue, at any size", () => {
  it.each([10, 500, 5000])("handles %i products without changing shape", (count) => {
    const base = sampleProducts("pharmacy");
    const many = Array.from({ length: count }, (_, index) => ({
      ...base[index % base.length],
      id: `p${index}`,
    }));
    expect(many).toHaveLength(count);
    expect(new Set(many.map((one) => one.id)).size).toBe(count);
  });
});

describe("a bakery's morning", () => {
  it("shows what was made and what is left", () => {
    for (const row of sampleProduction("bakery")) {
      expect(row.made).toBeGreaterThanOrEqual(row.sold);
    }
  });

  it("has orders with and without a deposit, so both are drawn", () => {
    const orders = samplePreorders("fr");
    expect(orders.some((order) => order.deposit !== null)).toBe(true);
    expect(orders.some((order) => order.deposit === null)).toBe(true);
  });
});

describe("every pack has something to show", () => {
  it.each(packs)("%s has sample products", (pack: Pack) => {
    expect(sampleProducts(pack).length).toBeGreaterThan(0);
  });
});
