import { describe, expect, it, vi } from "vitest";

/* The module is server-only; the small reader it holds is tested here without a server. */
vi.mock("server-only", () => ({}));

const { packOfRow, packsOfRow, tradesOfShopRow } = await import("./trial-claim");

/*
 * The trade of an earlier trial, read through its shop. The database answers
 * with one object for a shop; an array is accepted too, since that is how
 * the client library types it.
 */
describe("the trade of an earlier trial", () => {
  it("reads the shop's trade", () => {
    expect(packOfRow({ businesses: { pack: "restaurant" } })).toBe("restaurant");
    expect(packOfRow({ businesses: [{ pack: "pharmacy" }] })).toBe("pharmacy");
  });

  it("says it does not know rather than guessing", () => {
    expect(packOfRow({})).toBeNull();
    expect(packOfRow({ businesses: null })).toBeNull();
    expect(packOfRow({ businesses: { pack: "" } })).toBeNull();
  });
});

describe("the trades an earlier trial covered", () => {
  it("reads what the claim wrote down", () => {
    expect(packsOfRow({ packs: ["pharmacy", "restaurant"], businesses: { pack: "restaurant" } })).toEqual(["pharmacy", "restaurant"]);
  });

  it("falls back on the shop's trade for a claim that wrote none", () => {
    expect(packsOfRow({ packs: [], businesses: { pack: "hotel" } })).toEqual(["hotel"]);
  });

  it("knows nothing rather than inventing a trade", () => {
    expect(packsOfRow({ packs: null })).toEqual([]);
  });
});

describe("every trade a shop ran", () => {
  it("joins its trials' trades and the one it has now", () => {
    const row = { businesses: { pack: "restaurant", trial_claims: [{ packs: ["pharmacy", "restaurant"] }] } };
    expect(tradesOfShopRow(row).sort()).toEqual(["pharmacy", "restaurant"]);
  });

  it("is its trade alone when it never had a trial", () => {
    expect(tradesOfShopRow({ businesses: { pack: "wash", trial_claims: [] } })).toEqual(["wash"]);
  });
});
