import { describe, expect, it } from "vitest";
import {
  appLanguages,
  configurationSchema,
  defaultConfiguration,
  packs,
} from "./config";
import { formatAmount, formatDateTime, formatMoney, formatQuantity } from "./format";
import { sampleProducts, sampleSale } from "./sample-data";

/*
 * Section 21 of the brief: every pack's all-defaults configuration has to
 * validate. An owner who answers "Je ne sais pas" to everything still gets
 * working software, and this is what says so.
 */
describe("the configuration a silent owner gets", () => {
  for (const pack of packs) {
    for (const language of appLanguages) {
      it(`${pack} in ${language} validates with nothing answered`, () => {
        const config = defaultConfiguration(pack, language);
        // The name is the one answer step 1 insists on, so the floor is
        // checked with it filled in the way the builder would.
        const parsed = configurationSchema.safeParse({
          ...config,
          business: { ...config.business, nameLatin: "Test" },
        });
        expect(parsed.success).toBe(true);
      });
    }
  }

  it("refuses a configuration with no name", () => {
    const parsed = configurationSchema.safeParse(
      defaultConfiguration("pharmacy", "fr")
    );
    expect(parsed.success).toBe(false);
  });

  it("refuses a configuration carrying another trade's features", () => {
    const bakery = defaultConfiguration("bakery", "fr");
    const parsed = configurationSchema.safeParse({
      ...bakery,
      business: { nameLatin: "Test" },
      features: { ...bakery.features, pharmacy: { unitSale: true, trackExpiry: false, expiryAlertMonths: 3, batchNumbers: false, trackSuppliers: false, search: ["name"] } },
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses a configuration carrying no features at all", () => {
    const parsed = configurationSchema.safeParse({
      ...defaultConfiguration("restaurant", "fr"),
      business: { nameLatin: "Test" },
      features: {},
    });
    expect(parsed.success).toBe(false);
  });

  it("gives each pack its own features and nobody else's", () => {
    for (const pack of packs) {
      const config = defaultConfiguration(pack, "fr");
      expect(Object.keys(config.features)).toEqual([pack]);
    }
  });

  it("refuses a pack the app does not have", () => {
    const config = defaultConfiguration("pharmacy", "fr");
    const parsed = configurationSchema.safeParse({
      ...config,
      pack: "petrol_station",
      business: { nameLatin: "Test" },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("sample data", () => {
  for (const pack of packs) {
    it(`${pack} has products in all three languages, with no repeated id`, () => {
      const products = sampleProducts(pack);
      expect(products.length).toBeGreaterThan(0);
      for (const product of products) {
        for (const language of appLanguages) {
          expect(product.name[language].trim().length).toBeGreaterThan(0);
        }
      }
      expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
    });

    it(`${pack} has a sample sale to show on the receipt`, () => {
      expect(sampleSale(pack).length).toBeGreaterThan(0);
    });
  }
});

describe("money and counts are written differently", () => {
  it("gives money two decimals and counts none", () => {
    // French groups thousands with a narrow no-break space, U+202F, not the
    // ordinary one. Worth pinning: a thermal printer with a narrow codepage
    // may not have that character, which is a note in docs/ASSUMPTIONS.md
    // for whoever writes the printing side.
    // 123450 of the smallest unit is 1 234,50 MRU.
    expect(formatAmount(123450, "fr")).toBe("1\u202f234,50");
    expect(formatQuantity(24, "fr")).toBe("24");
  });

  it("uses Western digits in Arabic", () => {
    expect(formatMoney(64000, "ar")).toMatch(/^640,00 MRU$/);
  });

  it("writes English amounts the English way", () => {
    expect(formatAmount(123450, "en")).toBe("1,234.50");
  });

  it("writes a date a shopkeeper can read at a glance", () => {
    const at = new Date(2026, 8, 20, 6, 5);
    expect(formatDateTime(at, "fr")).toBe("20/09/2026 06:05");
    expect(formatDateTime(at, "en")).toBe("2026-09-20 06:05");
  });
});
