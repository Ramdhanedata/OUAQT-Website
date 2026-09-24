import { describe, expect, it } from "vitest";
import { defaultConfiguration } from "@/app-ui/config";
import { applyPatch } from "./patch";

const base = {
  ...defaultConfiguration("pharmacy", "fr"),
  business: { nameLatin: "Test" },
};

const allowed = ["features.pharmacy.unitSale", "features.pharmacy.search"];

describe("a patch proposed by the AI", () => {
  it("is applied when it stays where the question can reach", () => {
    const result = applyPatch(base, { "features.pharmacy.unitSale": false }, allowed);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.configuration.features.pharmacy?.unitSale).toBe(false);
    }
  });

  it("leaves the original alone", () => {
    applyPatch(base, { "features.pharmacy.unitSale": false }, allowed);
    expect(base.features.pharmacy?.unitSale).toBe(true);
  });

  it("is refused when it reaches for a path the question does not own", () => {
    const result = applyPatch(base, { "business.nameLatin": "Autre" }, allowed);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("forbidden_path");
  });

  it("is refused when it would break the configuration", () => {
    const result = applyPatch(base, { "features.pharmacy.search": [] }, allowed);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_configuration");
  });

  it("is refused when the value is of the wrong kind", () => {
    const result = applyPatch(
      base,
      { "features.pharmacy.unitSale": "oui" },
      allowed
    );
    expect(result.ok).toBe(false);
  });

  it("cannot reach the licence or the prices, whatever it sends", () => {
    for (const path of ["common.devices", "version", "pack"]) {
      const result = applyPatch(base, { [path]: 99 }, allowed);
      expect(result.ok).toBe(false);
    }
  });
});
