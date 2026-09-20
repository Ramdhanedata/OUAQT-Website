import { describe, expect, it } from "vitest";
import {
  SERIAL_ALPHABET,
  hashSerial,
  isSerial,
  makeSerial,
  makeUniqueSerial,
  normaliseSerial,
} from "./serial";

describe("a serial", () => {
  it("is eight characters in two groups", () => {
    expect(makeSerial()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  // Generating serials in bulk is slow on purpose: it is real randomness, not
  // a seeded generator. The timeouts are declared so a loaded machine running
  // the whole suite at once does not read slowness as failure.
  it("never uses a character that gets misread", () => {
    const forbidden = ["0", "O", "1", "I", "L"];
    for (let i = 0; i < 2000; i += 1) {
      for (const character of makeSerial().replace("-", "")) {
        expect(SERIAL_ALPHABET).toContain(character);
        expect(forbidden).not.toContain(character);
      }
    }
  }, 20_000);

  it("uses the whole alphabet, not just the start of it", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i += 1) {
      for (const character of makeSerial().replace("-", "")) seen.add(character);
    }
    expect(seen.size).toBe(SERIAL_ALPHABET.length);
  }, 20_000);

  /*
   * A hundred thousand serials from 31^8 possibilities. The birthday maths
   * puts the chance of any collision at about half a percent, so this asserts
   * "essentially unique" rather than "provably unique", and makeUniqueSerial
   * is what handles the half percent.
   */
  it("is essentially unique across a hundred thousand", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100_000; i += 1) seen.add(makeSerial());
    expect(100_000 - seen.size).toBeLessThan(5);
  }, 60_000);

  it("tries again when the one it picked is taken", async () => {
    const used = new Set<string>();
    let asked = 0;
    const serial = await makeUniqueSerial(async (candidate) => {
      asked += 1;
      if (asked === 1) {
        used.add(candidate);
        return true;
      }
      return false;
    });
    expect(asked).toBe(2);
    expect(used.has(serial)).toBe(false);
  });

  it("gives up rather than looping forever", async () => {
    await expect(makeUniqueSerial(async () => true, 3)).rejects.toThrow();
  });
});

describe("a serial typed back in", () => {
  it("forgives lower case, missing dashes and spaces", () => {
    const serial = makeSerial();
    const messy = serial.toLowerCase().replace("-", " ");
    expect(normaliseSerial(messy)).toBe(serial);
  });

  it("refuses a character that is not in the alphabet", () => {
    expect(normaliseSerial("ABCD-EF0H")).toBeNull();
    expect(isSerial("ABCD-EFIH")).toBe(false);
  });

  it("refuses the wrong length", () => {
    expect(normaliseSerial("ABCD-EFG")).toBeNull();
    expect(normaliseSerial("ABCD-EFGHJ")).toBeNull();
  });
});

describe("what the database stores", () => {
  it("is a hash, and the same however the owner typed it", async () => {
    const serial = makeSerial();
    const hash = await hashSerial(serial);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashSerial(serial.toLowerCase().replace("-", ""))).toBe(hash);
  });

  it("differs for different serials", async () => {
    expect(await hashSerial("ABCD-EFGH")).not.toBe(await hashSerial("ABCD-EFGJ"));
  });
});
