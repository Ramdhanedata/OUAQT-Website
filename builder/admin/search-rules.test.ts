import { describe, expect, it } from "vitest";
import { matchText, phoneDigits } from "./search-rules";

describe("matching a name", () => {
  it("ignores case, accents and Arabic vowel marks", () => {
    expect(matchText("Épicerie du Port", "epicerie")).toBe(true);
    expect(matchText("صَيْدَلِيَّة النور", "صيدلية")).toBe(true);
    expect(matchText("Pharmacie Essai", "boulangerie")).toBe(false);
    expect(matchText(null, "x")).toBe(false);
  });
});

describe("reading a phone number", () => {
  it("drops the country code and keeps the digits", () => {
    expect(phoneDigits("+222 65 45 67 65")).toBe("65456765");
    expect(phoneDigits("0022265456765")).toBe("65456765");
    expect(phoneDigits("6545")).toBe("6545");
    expect(phoneDigits("+222 65 45")).toBe("6545");
    expect(phoneDigits("22234567")).toBe("22234567");
  });

  it("is not a phone when there are letters, or too few digits", () => {
    expect(phoneDigits("Pharmacie 12")).toBeNull();
    expect(phoneDigits("123")).toBeNull();
  });
});
