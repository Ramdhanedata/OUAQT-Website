import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  formatAsTyped,
  isExpired,
  looksComplete,
  makeConfigurationCode,
  normaliseConfigurationCode,
  phoneKey,
  waitAfter,
} from "./code";

describe("the code de configuration", () => {
  it("is OUAQT- then two groups of four, from the spoken-safe alphabet", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = makeConfigurationCode();
      expect(code).toMatch(/^OUAQT-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      for (const character of code.slice(6).replace("-", "")) {
        expect(CODE_ALPHABET).toContain(character);
      }
    }
  });

  it("never uses a character confused when read aloud", () => {
    for (const confusable of ["O", "0", "I", "1", "L", "U"]) {
      expect(CODE_ALPHABET).not.toContain(confusable);
    }
  });

  it("cannot be mistaken for a numéro de série", () => {
    const code = makeConfigurationCode();
    expect(code.startsWith("OUAQT-")).toBe(true);
    expect(code.replace(/-/g, "").length).not.toBe(8);
  });
});

describe("reading what the owner typed", () => {
  const code = "OUAQT-ABCD-EFGH";

  it.each([
    ["the code as printed", "OUAQT-ABCD-EFGH"],
    ["lowercase", "ouaqt-abcd-efgh"],
    ["no hyphens", "OUAQTABCDEFGH"],
    ["spaces around and inside", "  ouaqt abcd efgh  "],
    ["without the prefix", "abcd-efgh"],
    ["without the prefix or hyphens", "abcdefgh"],
    ["pasted from a message", "Votre code de configuration : OUAQT-ABCD-EFGH. Gardez-le."],
    ["pasted as a link", "https://ouaqt.com/fr/creer-mon-logiciel?code=OUAQT-ABCD-EFGH"],
    ["pasted as an encoded link", "https://ouaqt.com/fr/creer-mon-logiciel?code=ouaqt%2Dabcd%2Defgh"],
  ])("%s resolves to the same code", (_what, typed) => {
    expect(normaliseConfigurationCode(typed)).toBe(code);
  });

  it("does not refuse something that is not shaped like a code: the lookup says so", () => {
    expect(normaliseConfigurationCode("abc")).toBe("ABC");
    expect(looksComplete("abc")).toBe(false);
    expect(looksComplete("ouaqt abcd efgh")).toBe(true);
  });
});

describe("the field as it is typed", () => {
  it("adds nothing to what he types, only groups of four", () => {
    expect(formatAsTyped("a")).toBe("A");
    expect(formatAsTyped("abcd")).toBe("ABCD");
    expect(formatAsTyped("abcde")).toBe("ABCD-E");
    expect(formatAsTyped("abcdefgh")).toBe("ABCD-EFGH");
    expect(formatAsTyped("abcdefghij")).toBe("ABCD-EFGH");
  });

  it("leaves a numéro de série as the serial it is", () => {
    expect(formatAsTyped("gm6s funn")).toBe("GM6S-FUNN");
  });

  it("formats a code typed with its prefix", () => {
    expect(formatAsTyped("ouaqtabcdefgh")).toBe("OUAQT-ABCD-EFGH");
    expect(formatAsTyped("ouaqt abcd e")).toBe("OUAQT-ABCD-E");
  });

  it("leaves the prefix alone while it is being typed", () => {
    expect(formatAsTyped("ou")).toBe("OU");
    expect(formatAsTyped("ouaqt")).toBe("OUAQT");
    expect(formatAsTyped("ouaqt-ab")).toBe("OUAQT-AB");
  });

  it("reads a pasted link whole", () => {
    expect(formatAsTyped("https://ouaqt.com/fr/x?code=OUAQT-ABCD-EFGH")).toBe("OUAQT-ABCD-EFGH");
  });

  it("empties to nothing", () => {
    expect(formatAsTyped("  ")).toBe("");
  });
});

describe("lifetime and wrong entries", () => {
  const now = new Date("2026-10-01T12:00:00Z");

  it("expires thirty days after it was last opened, not after it was made", () => {
    expect(isExpired("2026-09-02T12:00:00Z", "2026-01-01T00:00:00Z", now)).toBe(false);
    expect(isExpired("2026-08-31T11:00:00Z", "2026-08-01T00:00:00Z", now)).toBe(true);
    expect(isExpired(null, "2026-09-20T00:00:00Z", now)).toBe(false);
  });

  it("does not slow the first five tries, then waits longer each time, up to five minutes", () => {
    expect([0, 1, 4].map(waitAfter)).toEqual([0, 0, 0]);
    expect(waitAfter(5)).toBe(5);
    expect(waitAfter(6)).toBe(10);
    expect(waitAfter(20)).toBe(300);
  });

  it("matches a phone number whatever its spaces and country code", () => {
    expect(phoneKey("+222 22 33 44 55")).toBe("22334455");
    expect(phoneKey("22334455")).toBe("22334455");
    expect(phoneKey("00222 22334455")).toBe("22334455");
    expect(phoneKey("123")).toBeNull();
    expect(phoneKey(undefined)).toBeNull();
  });
});
