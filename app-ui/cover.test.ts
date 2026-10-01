import { describe, expect, it } from "vitest";
import {
  configurationSchema,
  coverPayers,
  defaultConfiguration,
  insurancePayers,
  type Configuration,
  type PharmacyFeatures,
} from "./config";
import { coverFor, customerPays } from "./cover";
import { formatPercent } from "./format";
import { clampShare, coveredPart, toMinor } from "./money";

/*
 * Health cover: a fund pays part of a sale, the customer pays the rest, and
 * the pharmacy claims the fund's part later. Three people count that money
 * (the cashier, the owner, the fund), so the two parts have to add up to the
 * sale to the last unit, every time.
 */

/** A named pharmacy with this insurance block, or with none at all when it is undefined. */
function pharmacy(insurance: PharmacyFeatures["insurance"]): Configuration {
  const base = defaultConfiguration("pharmacy", "fr");
  const features = { ...base.features.pharmacy! };
  if (insurance === undefined) delete features.insurance;
  else features.insurance = insurance;
  return { ...base, business: { nameLatin: "Test" }, features: { pharmacy: features } };
}

describe("which funds the till offers", () => {
  it("offers none to a pharmacy that is not conventionnée", () => {
    expect(coverPayers(pharmacy({ enabled: false, payers: ["cnam"] }))).toEqual([]);
  });

  it("offers none to a pharmacy built before the question existed", () => {
    const old = pharmacy(undefined);
    expect(old.features.pharmacy).not.toHaveProperty("insurance");
    expect(configurationSchema.safeParse(old).success).toBe(true);
    expect(coverPayers(old)).toEqual([]);
  });

  it("offers exactly the funds the owner named", () => {
    const config = pharmacy({ enabled: true, payers: ["cnam", "cnass"] });
    expect(configurationSchema.safeParse(config).success).toBe(true);
    expect(coverPayers(config)).toEqual(["cnam", "cnass"]);
  });

  it("offers a fund once even if it was named twice", () => {
    expect(coverPayers(pharmacy({ enabled: true, payers: ["cnam", "cnam"] }))).toEqual(["cnam"]);
  });

  it("offers none to any other trade", () => {
    for (const pack of ["bakery", "restaurant", "shop"] as const) {
      expect(coverPayers(defaultConfiguration(pack, "fr"))).toEqual([]);
    }
  });

  it("refuses a fund the app does not know", () => {
    const config = pharmacy({ enabled: true, payers: ["cnam"] });
    const parsed = configurationSchema.safeParse({
      ...config,
      features: { pharmacy: { ...config.features.pharmacy, insurance: { enabled: true, payers: ["cnss"] } } },
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses insurance switched on with no fund at all", () => {
    const config = pharmacy({ enabled: true, payers: ["cnam"] });
    const parsed = configurationSchema.safeParse({
      ...config,
      features: { pharmacy: { ...config.features.pharmacy, insurance: { enabled: true, payers: [] } } },
    });
    expect(parsed.success).toBe(false);
  });

  it("starts every new pharmacy not conventionnée", () => {
    expect(defaultConfiguration("pharmacy", "fr").features.pharmacy?.insurance?.enabled).toBe(false);
  });
});

describe("splitting a sale between the fund and the customer", () => {
  it("gives the fund its share and the customer the rest", () => {
    const cover = coverFor(toMinor(640), "cnam", "10482731", 67);
    expect(cover.covered).toBe(toMinor(428.8));
    expect(customerPays(toMinor(640), cover)).toBe(toMinor(211.2));
  });

  it("always adds up to the sale, to the last unit", () => {
    for (let total = 0; total <= 5000; total += 37) {
      for (const share of [0, 1, 33, 50, 67, 85, 99, 100]) {
        const covered = coveredPart(total, share);
        expect(Number.isInteger(covered)).toBe(true);
        expect(covered + customerPays(total, coverFor(total, "cnam", "1", share))).toBe(total);
      }
    }
  });

  it("never lets the fund pay more than the sale, nor less than nothing", () => {
    expect(coveredPart(toMinor(100), 150)).toBe(toMinor(100));
    expect(coveredPart(toMinor(100), -20)).toBe(0);
    expect(coveredPart(toMinor(100), Number.NaN)).toBe(0);
  });

  it("keeps a typed share to a whole percent between 0 and 100", () => {
    expect(clampShare(66.6)).toBe(67);
    expect(clampShare(250)).toBe(100);
    expect(clampShare(-5)).toBe(0);
  });

  it("charges the whole total when nobody else pays", () => {
    expect(customerPays(toMinor(640), null)).toBe(toMinor(640));
  });

  it("keeps the member number without the spaces around it", () => {
    expect(coverFor(100, "cnass", "  2093 1157 ", 90).memberNumber).toBe("2093 1157");
  });
});

describe("the words for it", () => {
  it("writes a share the way each language does", () => {
    /* A no-break space, so "67" and "%" never land on two lines of a receipt. */
    expect(formatPercent(67, "fr")).toBe("67\u00a0%");
    expect(formatPercent(67, "en")).toBe("67%");
    expect(formatPercent(67, "ar")).toMatch(/^67/);
  });

  it("knows the three kinds of fund", () => {
    expect([...insurancePayers]).toEqual(["cnam", "cnass", "other"]);
  });
});
