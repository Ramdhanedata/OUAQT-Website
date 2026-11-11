import { describe, expect, it } from "vitest";
import { byPlace, installerOf, priceCell, shapeOf, shownValue, typedValue } from "./settings-model";

describe("what each setting is", () => {
  it("knows a price, which may be empty", () => {
    expect(shapeOf("price_annual_standard_mru", 1800000)).toEqual({ group: "prices", kind: "money", unit: "mru", nullable: true });
    expect(shapeOf("price_monthly_launch_mru", null).nullable).toBe(true);
  });

  it("knows a switch, a number of days and a phone number", () => {
    expect(shapeOf("payment_auto_confirm", true)).toMatchObject({ group: "payments", kind: "switch" });
    expect(shapeOf("trial_days", 30)).toMatchObject({ group: "trial", kind: "whole", unit: "days", nullable: false });
    expect(shapeOf("bankily_number", "38087272")).toMatchObject({ group: "payments", kind: "text" });
  });

  it("puts an installer address with the downloads, for its system and its trade", () => {
    expect(shapeOf("installer_url_mac_pharmacy", "").group).toBe("downloads");
    expect(installerOf("installer_url_mac_pharmacy")).toEqual({ platform: "mac", pack: "pharmacy" });
    expect(installerOf("tutorial_video_mac_url")).toBeNull();
  });

  it("still shows a setting nobody described, as the kind of value it holds", () => {
    expect(shapeOf("something_new", 4)).toMatchObject({ group: "other", kind: "number" });
    expect(shapeOf("something_else", ["a"])).toMatchObject({ group: "other", kind: "json" });
  });
});

describe("the order inside a group", () => {
  it("puts the switch that decides how payments are confirmed before the numbers", () => {
    expect(["sedad_number", "bankily_number", "payment_auto_confirm"].sort(byPlace)).toEqual(["payment_auto_confirm", "bankily_number", "sedad_number"]);
  });

  it("puts a setting nobody described after the ones that are, by name", () => {
    expect(["zebra", "trial_days", "alpha"].sort(byPlace)).toEqual(["trial_days", "alpha", "zebra"]);
  });
});

describe("the price table", () => {
  it("places a length under its tier", () => {
    expect(priceCell("price_annual_launch_mru")).toEqual({ row: "annual", tier: "launch" });
    expect(priceCell("price_extra_device_standard_mru")).toEqual({ row: "extra_device", tier: "standard" });
  });

  it("leaves a price with no tier to stand alone", () => {
    expect(priceCell("price_setup_visit_mru")).toBeNull();
    expect(priceCell("price_installation_builder_mru")).toBeNull();
  });
});

describe("a price is shown in ouguiyas and stored in hundredths", () => {
  it("shows 1800000 as 18000", () => {
    expect(shownValue("money", 1800000)).toBe("18000");
    expect(shownValue("money", null)).toBe("");
  });

  it("stores 18 000 typed any of the usual ways", () => {
    const money = { kind: "money" as const, nullable: true };
    expect(typedValue(money, "18000")).toEqual({ ok: true, value: 1800000 });
    expect(typedValue(money, "18 000")).toEqual({ ok: true, value: 1800000 });
    expect(typedValue(money, "18 000,50")).toEqual({ ok: true, value: 1800050 });
  });

  it("takes an empty price as no price", () => {
    expect(typedValue({ kind: "money", nullable: true }, "  ")).toEqual({ ok: true, value: null });
  });

  it("refuses letters and a minus sign", () => {
    expect(typedValue({ kind: "money", nullable: true }, "dix-huit")).toEqual({ ok: false, error: "invalid" });
    expect(typedValue({ kind: "money", nullable: true }, "-5")).toEqual({ ok: false, error: "invalid" });
  });
});

describe("a number that may not be empty or cut", () => {
  it("refuses an empty trial length", () => {
    expect(typedValue({ kind: "whole", nullable: false }, "")).toEqual({ ok: false, error: "needed" });
  });

  it("refuses half a day", () => {
    expect(typedValue({ kind: "whole", nullable: false }, "2,5")).toEqual({ ok: false, error: "whole" });
  });

  it("keeps a whole number and a text as they are", () => {
    expect(typedValue({ kind: "whole", nullable: false }, "30")).toEqual({ ok: true, value: 30 });
    expect(typedValue({ kind: "text", nullable: false }, " 38087272 ")).toEqual({ ok: true, value: "38087272" });
  });
});
