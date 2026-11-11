import { describe, expect, it, vi } from "vitest";
import { shopDownloaded } from "./nearby";

vi.mock("server-only", () => ({}));
const { claimNearbyToken, forgetDownloadsOf } = await import("./activation-token");

/*
 * Which shop a computer was downloaded for. The case that started this: a
 * Mac running a wash, its owner builds a transport company and downloads it,
 * and the software kept opening the wash without a word.
 */

const WASH = "wash-shop";
const TRANSPORT = "transport-shop";
const HOTEL = "hotel-shop";

describe("the shop a download was meant for", () => {
  it("is the only one waiting, whatever the computer runs", () => {
    expect(shopDownloaded([TRANSPORT], { open: WASH, held: [WASH] }, false)).toBe(TRANSPORT);
    expect(shopDownloaded([WASH, WASH], { open: null, held: [] }, false)).toBe(WASH);
    expect(shopDownloaded([], { open: WASH, held: [] }, false)).toBe("none");
  });

  it("is the new one, when the other is the shop this computer has open", () => {
    expect(shopDownloaded([TRANSPORT, WASH], { open: WASH, held: [] }, false)).toBe(TRANSPORT);
  });

  it("is the new one for a fresh folder too, since this computer is already a device of the other", () => {
    expect(shopDownloaded([TRANSPORT, WASH], { open: null, held: [WASH] }, false)).toBe(TRANSPORT);
  });

  it("is nobody's between two shops this computer has never seen", () => {
    expect(shopDownloaded([TRANSPORT, HOTEL], { open: null, held: [] }, false)).toBe("ambiguous");
    expect(shopDownloaded([TRANSPORT, HOTEL, WASH], { open: WASH, held: [WASH] }, false)).toBe("ambiguous");
  });

  it("is the last one built, on one of OUAQT's own test devices", () => {
    expect(shopDownloaded([TRANSPORT, HOTEL], { open: null, held: [] }, true)).toBe(TRANSPORT);
    expect(shopDownloaded([HOTEL, TRANSPORT, WASH], { open: WASH, held: [WASH] }, true)).toBe(HOTEL);
  });

  it("brings the open shop up to date when only shops already here were downloaded again", () => {
    expect(shopDownloaded([HOTEL, WASH], { open: WASH, held: [WASH, HOTEL] }, false)).toBe(WASH);
    expect(shopDownloaded([HOTEL, WASH], { open: null, held: [WASH, HOTEL] }, false)).toBe("ambiguous");
  });
});

/* Just enough of the query builder for activation_tokens. */
type Row = Record<string, unknown>;
function fakeTokens(rows: Row[]) {
  const from = () => {
    const filters: ((row: Row) => boolean)[] = [];
    let patch: Row | null = null;
    const run = async () => {
      const kept = rows.filter((row) => filters.every((keep) => keep(row)));
      if (patch) kept.forEach((row) => Object.assign(row, patch));
      return { data: kept.map((row) => ({ ...row })), error: null };
    };
    const builder = {
      select: () => builder,
      update: (value: Row) => ((patch = value), builder),
      eq: (key: string, value: unknown) => (filters.push((row) => row[key] === value), builder),
      is: (key: string, value: unknown) => (filters.push((row) => (row[key] ?? null) === value), builder),
      gt: (key: string, value: string) => (filters.push((row) => String(row[key]) > value), builder),
      or: () => builder,
      order: () => builder,
      maybeSingle: async () => ({ data: (await run()).data[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => run().then(resolve, reject),
    };
    return builder;
  };
  return { from } as never;
}

const now = new Date("2026-11-10T14:00:00.000Z");
const later = "2026-11-11T14:00:00.000Z";
const token = (id: string, shop: string, made: string, place: string | null = "here"): Row => ({
  id,
  business_id: shop,
  place_hash: place,
  platform: null,
  used_at: null,
  used_device: null,
  expires_at: later,
  created_at: made,
});

describe("a computer asking whether it was downloaded from where it stands", () => {
  const asker = (open: string | null, held: string[], tester = false) => ({ open, held: async () => held, newestWins: async () => tester });

  it("takes the new shop's download while it runs the old one, and leaves the old one's alone", async () => {
    const rows = [token("t-new", TRANSPORT, "2026-11-10T13:51:00.000Z"), token("t-old", WASH, "2026-11-10T11:05:00.000Z")];
    const claim = await claimNearbyToken(fakeTokens(rows), "here", "mac", "device-1", 24, now, asker(WASH, [WASH]));
    expect(claim).toEqual({ ok: true, id: "t-new", businessId: TRANSPORT });
    expect(rows[0].used_device).toBe("device-1");
    expect(rows[1].used_at).toBeNull();
  });

  it("still says it cannot tell, to a computer that knows neither shop and to old software that says nothing", async () => {
    const rows = () => [token("a", TRANSPORT, "2026-11-10T13:51:00.000Z"), token("b", HOTEL, "2026-11-10T11:05:00.000Z")];
    expect(await claimNearbyToken(fakeTokens(rows()), "here", "mac", "device-1", 24, now, asker(null, []))).toEqual({ ok: false, reason: "ambiguous" });
    expect(await claimNearbyToken(fakeTokens(rows()), "here", "mac", "device-1", 24, now)).toEqual({ ok: false, reason: "ambiguous" });
  });

  it("gives a test device the last shop built", async () => {
    const rows = [token("a", TRANSPORT, "2026-11-10T13:51:00.000Z"), token("b", HOTEL, "2026-11-10T11:05:00.000Z")];
    expect(await claimNearbyToken(fakeTokens(rows), "here", "mac", "device-1", 24, now, asker(null, [], true))).toMatchObject({ ok: true, businessId: TRANSPORT });
  });

  it("finds nothing from another connection", async () => {
    const rows = [token("a", TRANSPORT, "2026-11-10T13:51:00.000Z", "elsewhere")];
    expect(await claimNearbyToken(fakeTokens(rows), "here", "mac", "device-1", 24, now)).toEqual({ ok: false, reason: "none" });
  });

  it("takes a shop's download marks off once the shop was opened by its serial there", async () => {
    const rows = [token("mine", WASH, "2026-11-10T11:05:00.000Z"), token("other", TRANSPORT, "2026-11-10T13:51:00.000Z")];
    await forgetDownloadsOf(fakeTokens(rows), WASH, "here", "mac");
    expect(rows[0].place_hash).toBeNull();
    expect(rows[1].place_hash).toBe("here");
  });
});
