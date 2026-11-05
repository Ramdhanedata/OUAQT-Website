import { z } from "zod";

/*
 * The post box between a shop's devices.
 *
 * Each device keeps every record itself. What one did goes here, sealed by the
 * device before it left (electron/sync/seal.ts in the desktop repository), and
 * waits for the others. Nothing here can read it, and nothing tries: the only
 * thing checked is that it looks like a sealed message, so this can never
 * quietly become a place where a shop's trade is kept in the clear.
 *
 * Messages go as soon as every other device has them, and after KEEP_DAYS in
 * any case. A device away for longer is told, and asks the others to send
 * everything again from what they hold.
 *
 * The rules are here and the database is behind an interface, so a test can
 * walk them with no database at all.
 */

export const KEEP_DAYS = 45; // not-a-rule: how long a device can be away and still catch up from here
export const MESSAGE_MAX = 400_000; // not-a-rule: a device seals about 270 KB at most in one message
export const SEND_MAX = 5; // not-a-rule: stays well under the 4.5 MB a call may carry
export const RECEIVE_MAX = 8; // not-a-rule: stays well under the 4.5 MB a reply may carry
export const WAITING_MAX = 1_000; // not-a-rule: a shop far behind waits, rather than filling the database

const MS_IN_A_DAY = 86_400_000;

/* Bytes that mean nothing here: base64, and never anything that reads as a record. */
const SEALED = /^[A-Za-z0-9+/]+={0,2}$/;

export const syncRequest = z
  .object({
    businessId: z.string().uuid(),
    deviceId: z.string().min(8).max(200),
    deviceToken: z.string().min(20).max(200),
    /** The last message this device has written down. Everything up to it can go. */
    after: z.number().int().nonnegative(),
    send: z.array(z.string().min(20).max(MESSAGE_MAX).regex(SEALED)).max(SEND_MAX),
  })
  .strict();

export type SyncRequest = z.infer<typeof syncRequest>;

export type Device = { device_id: string; status: string; token_hash: string | null; sync_cursor: number; sync_seen_at: string | null };
export type Message = { id: number; from_device: string; body: string };

export type RelayStore = {
  devices(businessId: string): Promise<Device[]>;
  waiting(businessId: string): Promise<number>;
  add(businessId: string, fromDevice: string, bodies: string[]): Promise<void>;
  /** For this device, oldest first: what the others sent after a place. */
  next(businessId: string, notFrom: string, after: number, limit: number): Promise<Message[]>;
  /** This device has everything up to here. */
  markRead(businessId: string, deviceId: string, cursor: number, at: Date): Promise<void>;
  /** What one device sent, up to a place: every other device has it. */
  forget(businessId: string, fromDevice: string, upTo: number): Promise<void>;
  forgetOlderThan(businessId: string, before: Date): Promise<void>;
};

export type RelayAnswer =
  | { ok: true; received: { id: number; body: string }[]; cursor: number; more: boolean; gap: boolean }
  | { ok: false; status: 403 | 404 | 429; error: string };

export async function relay(
  store: RelayStore,
  input: SyncRequest,
  tokenHash: string,
  now = new Date()
): Promise<RelayAnswer> {
  const devices = await store.devices(input.businessId);
  const me = devices.find((one) => one.device_id === input.deviceId && one.status === "active");
  /* A device that was released says the same as one that never existed. */
  if (!me) return { ok: false, status: 404, error: "unknown_device" };
  if (!me.token_hash || me.token_hash !== tokenHash) return { ok: false, status: 403, error: "wrong_token" };

  const others = devices.filter((one) => one.status === "active" && one.device_id !== input.deviceId);

  /*
   * With no other device, there is nobody to keep anything for. When one
   * joins, it asks, and this one sends everything it holds.
   */
  if (input.send.length > 0 && others.length > 0) {
    if ((await store.waiting(input.businessId)) >= WAITING_MAX) return { ok: false, status: 429, error: "too_much_waiting" };
    await store.add(input.businessId, input.deviceId, input.send);
  }

  /* Away longer than anything is kept: some of it may be gone. */
  const lastSeen = me.sync_seen_at ? new Date(me.sync_seen_at).getTime() : null;
  const gap = input.after > 0 && lastSeen !== null && now.getTime() - lastSeen > KEEP_DAYS * MS_IN_A_DAY;

  const found = await store.next(input.businessId, input.deviceId, input.after, RECEIVE_MAX + 1);
  const received = found.slice(0, RECEIVE_MAX);
  const cursor = received.length > 0 ? received[received.length - 1].id : input.after;

  /* Never backwards, and only what it says it has written down counts as read. */
  const acknowledged = Math.max(input.after, me.sync_cursor);
  await store.markRead(input.businessId, input.deviceId, acknowledged, now);

  /* What every other device has read, sender by sender. */
  const readers = devices
    .filter((one) => one.status === "active")
    .map((one) => (one.device_id === input.deviceId ? { ...one, sync_cursor: acknowledged } : one));
  for (const sender of readers) {
    const rest = readers.filter((one) => one.device_id !== sender.device_id);
    if (rest.length === 0) continue;
    const upTo = Math.min(...rest.map((one) => one.sync_cursor));
    if (upTo > 0) await store.forget(input.businessId, sender.device_id, upTo);
  }
  await store.forgetOlderThan(input.businessId, new Date(now.getTime() - KEEP_DAYS * MS_IN_A_DAY));

  return {
    ok: true,
    received: received.map((one) => ({ id: one.id, body: one.body })),
    cursor,
    more: found.length > RECEIVE_MAX,
    gap,
  };
}
