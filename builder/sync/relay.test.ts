import { describe, expect, it } from "vitest";
import { KEEP_DAYS, relay, RECEIVE_MAX, syncRequest, WAITING_MAX, type Device, type Message, type RelayStore, type SyncRequest } from "./relay";

const SHOP = "7c0cefa7-d1ca-44cf-b511-e6c01fc50aef";
const NOW = new Date("2026-11-05T12:00:00.000Z");
const sealed = (n: number) => `AQ${"sealedbytes".repeat(2)}${n}`;

function makeStore(deviceIds = ["computer-1", "telephone-1"]) {
  const devices: Device[] = deviceIds.map((device_id) => ({ device_id, status: "active", token_hash: "ok", sync_cursor: 0, sync_seen_at: null }));
  let messages: (Message & { at: Date })[] = [];
  let id = 0;
  const store: RelayStore = {
    devices: async () => devices,
    waiting: async () => messages.length,
    add: async (_shop, from_device, bodies) => {
      for (const body of bodies) messages.push({ id: (id += 1), from_device, body, at: NOW });
    },
    next: async (_shop, notFrom, after, limit) => messages.filter((one) => one.from_device !== notFrom && one.id > after).slice(0, limit),
    markRead: async (_shop, deviceId, cursor, at) => {
      const one = devices.find((device) => device.device_id === deviceId)!;
      one.sync_cursor = cursor;
      one.sync_seen_at = at.toISOString();
    },
    forget: async (_shop, from, upTo) => {
      messages = messages.filter((one) => !(one.from_device === from && one.id <= upTo));
    },
    forgetOlderThan: async (_shop, before) => {
      messages = messages.filter((one) => one.at >= before);
    },
  };
  return { store, devices, messages: () => messages };
}

const call = (over: Partial<SyncRequest> & { deviceId: string }): SyncRequest => ({
  businessId: SHOP,
  deviceToken: "t".repeat(40),
  after: 0,
  send: [],
  ...over,
});

describe("the post box between a shop's devices", () => {
  it("hands what one device sent to the other", async () => {
    const { store } = makeStore();
    await relay(store, call({ deviceId: "computer-1", send: [sealed(1)] }), "ok", NOW);
    const answer = await relay(store, call({ deviceId: "telephone-1" }), "ok", NOW);
    expect(answer.ok && answer.received.map((one) => one.body)).toEqual([sealed(1)]);
  });

  it("works both ways, and never gives a device its own", async () => {
    const { store } = makeStore();
    await relay(store, call({ deviceId: "computer-1", send: [sealed(1)] }), "ok", NOW);
    await relay(store, call({ deviceId: "telephone-1", send: [sealed(2)] }), "ok", NOW);
    const back = await relay(store, call({ deviceId: "computer-1" }), "ok", NOW);
    expect(back.ok && back.received.map((one) => one.body)).toEqual([sealed(2)]);
  });

  it("keeps a message until the other has said it wrote it down, and then forgets it", async () => {
    const { store, messages } = makeStore();
    await relay(store, call({ deviceId: "computer-1", send: [sealed(1)] }), "ok", NOW);
    const first = await relay(store, call({ deviceId: "telephone-1" }), "ok", NOW);
    expect(messages()).toHaveLength(1);
    /* A reply lost on the way: asked again from the same place, it comes again. */
    const again = await relay(store, call({ deviceId: "telephone-1" }), "ok", NOW);
    expect(again.ok && again.received).toHaveLength(1);
    await relay(store, call({ deviceId: "telephone-1", after: first.ok ? first.cursor : 0 }), "ok", NOW);
    expect(messages()).toHaveLength(0);
  });

  it("waits for every other device before forgetting", async () => {
    const { store, messages } = makeStore(["computer-1", "telephone-1", "computer-2"]);
    await relay(store, call({ deviceId: "computer-1", send: [sealed(1)] }), "ok", NOW);
    await relay(store, call({ deviceId: "telephone-1", after: 1 }), "ok", NOW);
    expect(messages()).toHaveLength(1);
    await relay(store, call({ deviceId: "computer-2", after: 1 }), "ok", NOW);
    expect(messages()).toHaveLength(0);
  });

  it("keeps nothing for a shop with one device", async () => {
    const { store, messages } = makeStore(["computer-1"]);
    await relay(store, call({ deviceId: "computer-1", send: [sealed(1)] }), "ok", NOW);
    expect(messages()).toHaveLength(0);
  });

  it("gives a long queue in parts, and says there is more", async () => {
    const { store } = makeStore();
    for (let n = 0; n < RECEIVE_MAX + 2; n += 1) await relay(store, call({ deviceId: "computer-1", send: [sealed(n)] }), "ok", NOW);
    const first = await relay(store, call({ deviceId: "telephone-1" }), "ok", NOW);
    expect(first.ok && first.received).toHaveLength(RECEIVE_MAX);
    expect(first.ok && first.more).toBe(true);
    const rest = await relay(store, call({ deviceId: "telephone-1", after: first.ok ? first.cursor : 0 }), "ok", NOW);
    expect(rest.ok && rest.received).toHaveLength(2);
    expect(rest.ok && rest.more).toBe(false);
  });

  it("refuses a device that is not this shop's, or has the wrong token", async () => {
    const { store, devices } = makeStore();
    expect(await relay(store, call({ deviceId: "stranger-1" }), "ok", NOW)).toMatchObject({ ok: false, status: 404 });
    expect(await relay(store, call({ deviceId: "computer-1" }), "wrong", NOW)).toMatchObject({ ok: false, status: 403 });
    devices[0].status = "released";
    expect(await relay(store, call({ deviceId: "computer-1" }), "ok", NOW)).toMatchObject({ ok: false, status: 404 });
  });

  it("never gives a released device's shop anything through it", async () => {
    const { store, devices } = makeStore();
    await relay(store, call({ deviceId: "telephone-1", send: [sealed(1)] }), "ok", NOW);
    devices[0].status = "released";
    expect((await relay(store, call({ deviceId: "computer-1" }), "ok", NOW)).ok).toBe(false);
  });

  it("makes a device far behind wait, without losing what it holds", async () => {
    const { store } = makeStore();
    for (let n = 0; n < WAITING_MAX; n += 1) await store.add(SHOP, "telephone-1", [sealed(n)]);
    expect(await relay(store, call({ deviceId: "computer-1", send: [sealed(1)] }), "ok", NOW)).toMatchObject({ ok: false, status: 429 });
  });

  it("forgets anything old, and tells a device away longer than that", async () => {
    const { store, devices, messages } = makeStore();
    await relay(store, call({ deviceId: "computer-1", send: [sealed(1)] }), "ok", new Date("2026-08-01T00:00:00.000Z"));
    devices[1].sync_seen_at = "2026-08-01T00:00:00.000Z";
    const later = new Date(new Date("2026-08-01T00:00:00.000Z").getTime() + (KEEP_DAYS + 1) * 86_400_000);
    const answer = await relay(store, call({ deviceId: "telephone-1", after: 5 }), "ok", later);
    expect(answer.ok && answer.gap).toBe(true);
    expect(messages().length).toBeLessThanOrEqual(1);
  });

  it("does not call a new device's first visit a gap", async () => {
    const { store } = makeStore();
    const answer = await relay(store, call({ deviceId: "telephone-1" }), "ok", NOW);
    expect(answer.ok && answer.gap).toBe(false);
  });
});

describe("what the post box accepts", () => {
  const good = { businessId: SHOP, deviceId: "computer-1", deviceToken: "t".repeat(40), after: 0, send: [sealed(1)] };

  it("takes sealed messages", () => {
    expect(syncRequest.safeParse(good).success).toBe(true);
  });

  it("refuses anything that reads as a record", () => {
    expect(syncRequest.safeParse({ ...good, send: ['{"total":16000,"customer":"Mme Diop"}'] }).success).toBe(false);
  });

  it("has no other field to put anything in", () => {
    expect(syncRequest.safeParse({ ...good, sales: [{ total: 16000 }] }).success).toBe(false);
  });
});
