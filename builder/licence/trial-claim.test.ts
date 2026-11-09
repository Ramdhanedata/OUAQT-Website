import { describe, expect, it, vi } from "vitest";

/* The module is server-only; the small reader it holds is tested here without a server. */
vi.mock("server-only", () => ({}));

const { packOfRow } = await import("./trial-claim");

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
