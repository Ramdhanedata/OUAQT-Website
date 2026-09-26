import { describe, expect, it } from "vitest";
import { coversDevice, coversMachine, encodePayload, peek, sameMachine, verifyLicence, type LicencePayload } from "./licence-file";

/*
 * The verifier is what stands between a shop and a licence somebody edited in
 * a text editor, so it is tested with a real key pair rather than a stub.
 */

const payload: LicencePayload = {
  version: 1,
  businessId: "11111111-1111-1111-1111-111111111111",
  businessName: "Test Shop",
  plan: "annual",
  status: "active",
  startsAt: "2026-09-20T00:00:00.000Z",
  endsAt: "2027-09-20T00:00:00.000Z",
  updatesUntil: null,
  maxDevices: 2,
  renewalGraceDays: 30,
  clockGraceDays: 2,
  trialSummaryDays: 5,
  deviceReleasesPerYear: 2,
  devices: [
    { deviceId: "device-one", role: "main" },
    { deviceId: "device-two", role: "secondary" },
  ],
  renewalSecret: "a-licence-secret",
  issuedAt: "2026-09-20T00:00:00.000Z",
  refreshAfter: "2026-09-27T00:00:00.000Z",
};

function base64url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function signed(over: LicencePayload = payload) {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const body = encodePayload(over);
  const signature = await crypto.subtle.sign(
    { name: "Ed25519" },
    pair.privateKey,
    new TextEncoder().encode(body)
  );
  return {
    licence: `${body}.${base64url(signature)}`,
    publicKey: base64url(await crypto.subtle.exportKey("spki", pair.publicKey)),
  };
}

describe("a signed licence", () => {
  it("verifies with the key that signed it", async () => {
    const { licence, publicKey } = await signed();
    const read = await verifyLicence(licence, publicKey);
    expect(read?.businessName).toBe("Test Shop");
    expect(read?.renewalGraceDays).toBe(30);
    expect(read?.clockGraceDays).toBe(2);
  });

  it("does not verify with anyone else's key", async () => {
    const { licence } = await signed();
    const other = await signed();
    expect(await verifyLicence(licence, other.publicKey)).toBeNull();
  });

  it("does not verify once a single character is changed", async () => {
    const { licence, publicKey } = await signed();
    const edited = licence.replace(/^(.{30})./, "$1A");
    expect(await verifyLicence(edited, publicKey)).toBeNull();
  });

  it("does not verify when the end date is stretched by a year", async () => {
    const { publicKey } = await signed();
    const forged = { ...payload, endsAt: "2030-09-20T00:00:00.000Z" };
    const { licence } = await signed(forged);
    // Signed by a different pair, so it fails against the real public key.
    expect(await verifyLicence(licence, publicKey)).toBeNull();
  });

  it("refuses something that is not a licence at all", async () => {
    const { publicKey } = await signed();
    expect(await verifyLicence("rubbish", publicKey)).toBeNull();
    expect(await verifyLicence("", publicKey)).toBeNull();
    expect(await verifyLicence("a.b", publicKey)).toBeNull();
  });

  it("carries every rule the app needs with no network", async () => {
    const { licence, publicKey } = await signed();
    const read = await verifyLicence(licence, publicKey);
    for (const rule of [
      "maxDevices",
      "renewalGraceDays",
      "clockGraceDays",
      "deviceReleasesPerYear",
    ] as const) {
      expect(read?.[rule]).toBeTypeOf("number");
    }
  });
});

describe("reading a licence without checking it", () => {
  it("is possible, and says so in its name", async () => {
    const { licence } = await signed();
    expect(peek(licence)?.businessName).toBe("Test Shop");
  });

  it("gives nothing for rubbish", () => {
    expect(peek("not-a-licence")).toBeNull();
  });
});

describe("which computers a licence covers", () => {
  it("knows its own", () => {
    expect(coversDevice(payload, "device-one")).toBe(true);
    expect(coversDevice(payload, "device-two")).toBe(true);
  });

  it("does not cover a third machine the file was copied onto", () => {
    expect(coversDevice(payload, "device-three")).toBe(false);
  });
});

describe("the machine a device runs on", () => {
  const office = { board: "b1", disk: "d1", machine: "m1" };

  it("is the same computer when two parts agree", () => {
    expect(sameMachine(office, { board: "b1", disk: "d2", machine: "m1" })).toBe(true);
    expect(sameMachine(office, { board: "b1", disk: "d2", machine: "m2" })).toBe(false);
  });

  it("compares only the parts both readings have", () => {
    expect(sameMachine(office, { board: null, disk: "d1", machine: "m1" })).toBe(true);
    expect(sameMachine(office, { board: null, disk: null, machine: "m1" })).toBe(true);
    expect(sameMachine(office, { board: null, disk: null, machine: "m2" })).toBe(false);
    expect(sameMachine(office, { board: null, disk: null, machine: null })).toBe(true);
  });

  it("covers a copied data folder only on the computer it was activated on", () => {
    const payload = { devices: [{ deviceId: "dev-1", role: "main", machine: office }] } as unknown as LicencePayload;
    expect(coversMachine(payload, "dev-1", office)).toBe(true);
    expect(coversMachine(payload, "dev-1", { board: "b9", disk: "d9", machine: "m9" })).toBe(false);
    expect(coversMachine(payload, "dev-2", office)).toBe(false);
  });

  it("covers the device id alone in a licence from before machines were kept", () => {
    const payload = { devices: [{ deviceId: "dev-1", role: "main" }] } as unknown as LicencePayload;
    expect(coversMachine(payload, "dev-1", { board: "b9", disk: "d9", machine: "m9" })).toBe(true);
  });
});
