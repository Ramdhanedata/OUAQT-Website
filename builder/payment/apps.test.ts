import { describe, expect, it } from "vitest";
import { appName, payToFrom } from "./apps";

describe("the apps an owner can pay from", () => {
  it("offers only the apps that have a number, in order", () => {
    expect(
      payToFrom({ click_number: "38087272", bankily_number: " 38087272 ", masrvi_number: "", sedad_number: "  " })
    ).toEqual([
      { app: "bankily", number: "38087272" },
      { app: "click", number: "38087272" },
    ]);
  });

  it("offers nothing when no number is set", () => {
    expect(payToFrom({})).toEqual([]);
  });

  it("names each app the way it is said in the page's language", () => {
    expect(appName("sedad", "fr")).toBe("SEDAD");
    expect(appName("bankily", "ar")).toBe("بنكيلي");
  });
});
