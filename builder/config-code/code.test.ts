import { describe, expect, it } from "vitest";
import { formatAsTyped, isExpired, phoneKey, readNumber, waitAfter } from "./code";

describe("reading the number the owner typed", () => {
  it.each([
    ["as printed", "GM6S-FUNN"],
    ["lowercase", "gm6s-funn"],
    ["no hyphen", "GM6SFUNN"],
    ["spaces around and inside", "  gm6s funn  "],
    ["pasted from the WhatsApp message", "OUAQT. Votre numéro de série : GM6S-FUNN. Tapez-le sur le site."],
    ["pasted as a link", "https://ouaqt.com/fr/creer-mon-logiciel?n=GM6S-FUNN"],
    ["pasted as an encoded link", "https://ouaqt.com/fr/x?n=gm6s%2Dfunn"],
  ])("%s gives the same number", (_what, typed) => {
    expect(readNumber(typed)).toBe("GM6S-FUNN");
  });

  it("finds no number where there is none, and leaves the lookup to say so", () => {
    expect(readNumber("abc")).toBeNull();
    expect(readNumber("GM6S-FUN0")).toBeNull();
  });
});

describe("the field as it is typed", () => {
  it("adds nothing to what he types, only a hyphen after four", () => {
    expect(formatAsTyped("g")).toBe("G");
    expect(formatAsTyped("gm6s")).toBe("GM6S");
    expect(formatAsTyped("gm6sf")).toBe("GM6S-F");
    expect(formatAsTyped("gm6s funn")).toBe("GM6S-FUNN");
  });

  it("reads a pasted message or link whole", () => {
    expect(formatAsTyped("https://ouaqt.com/fr/x?n=GM6S-FUNN")).toBe("GM6S-FUNN");
    expect(formatAsTyped("Votre numéro de série : GM6S-FUNN.")).toBe("GM6S-FUNN");
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
