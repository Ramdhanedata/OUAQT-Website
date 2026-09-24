import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  deviceCodeFor,
  makeRenewalCode,
  normaliseCode,
  verifyRenewalCode,
} from "./codes";

const secret = "a-licence-secret-from-the-database";
const other = "a-different-licence-secret";

describe("the code a computer shows", () => {
  it("is ten characters in two groups", async () => {
    expect(await deviceCodeFor("device-abc")).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
  });

  it("uses no character that gets misread", async () => {
    for (const id of ["a", "b", "c", "device-1", "device-2"]) {
      for (const character of (await deviceCodeFor(id)).replace("-", "")) {
        expect(CODE_ALPHABET).toContain(character);
      }
    }
  });

  it("is the same every time for the same computer", async () => {
    expect(await deviceCodeFor("device-abc")).toBe(await deviceCodeFor("device-abc"));
  });

  it("differs between computers", async () => {
    expect(await deviceCodeFor("device-abc")).not.toBe(await deviceCodeFor("device-abd"));
  });
});

describe("a renewal code", () => {
  const deviceCode = "ABCDE-FGHJK";
  const endsAt = new Date("2027-09-20T00:00:00Z");

  it("is ten characters he can read down the phone", async () => {
    const code = await makeRenewalCode({ deviceCode, endsAt, secret });
    expect(code).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
  });

  it("gives back the date it was made for", async () => {
    const code = await makeRenewalCode({ deviceCode, endsAt, secret });
    const checked = await verifyRenewalCode({ code, deviceCode, secret });
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.endsAt.toISOString().slice(0, 10)).toBe("2027-09-20");
  });

  it("forgives lower case, missing dashes and spaces", async () => {
    const code = await makeRenewalCode({ deviceCode, endsAt, secret });
    const typed = code.toLowerCase().replace("-", " ");
    expect((await verifyRenewalCode({ code: typed, deviceCode, secret })).ok).toBe(true);
  });

  /* The rule that matters: a code for one computer is no use on another. */
  it("fails on a different computer", async () => {
    const code = await makeRenewalCode({ deviceCode, endsAt, secret });
    const checked = await verifyRenewalCode({
      code,
      deviceCode: "ZZZZZ-ZZZZZ",
      secret,
    });
    expect(checked).toEqual({ ok: false, reason: "wrong_code" });
  });

  it("fails for a different shop's licence", async () => {
    const code = await makeRenewalCode({ deviceCode, endsAt, secret });
    const checked = await verifyRenewalCode({ code, deviceCode, secret: other });
    expect(checked).toEqual({ ok: false, reason: "wrong_code" });
  });

  it("fails when a character has been changed", async () => {
    const code = await makeRenewalCode({ deviceCode, endsAt, secret });
    const swapped = code.replace(/.$/, (last) => (last === "Z" ? "Y" : "Z"));
    expect((await verifyRenewalCode({ code: swapped, deviceCode, secret })).ok).toBe(false);
  });

  it("fails when the date has been tampered with to buy an extra year", async () => {
    const code = await makeRenewalCode({ deviceCode, endsAt, secret });
    const body = normaliseCode(code);
    const forged = `ZZZ${body.slice(3)}`;
    expect((await verifyRenewalCode({ code: forged, deviceCode, secret })).ok).toBe(false);
  });

  it("says a code of the wrong length is malformed rather than wrong", async () => {
    const checked = await verifyRenewalCode({ code: "ABC", deviceCode, secret });
    expect(checked).toEqual({ ok: false, reason: "malformed" });
  });

  it("carries dates years apart without collision", async () => {
    const codes = new Set<string>();
    for (let year = 2026; year < 2036; year += 1) {
      codes.add(
        await makeRenewalCode({
          deviceCode,
          endsAt: new Date(Date.UTC(year, 8, 20)),
          secret,
        })
      );
    }
    expect(codes.size).toBe(10);
  });
});
