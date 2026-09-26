import { describe, expect, it } from "vitest";
import { defaultConfiguration, packs, type Configuration } from "@/app-ui/config";
import { catalogueFor, changedPaths, focusFor, sectionsFor, tracksStock } from "./model";
import { fr, ar, en } from "./words";

/*
 * The preview's rules, without drawing anything: which sections a shop's
 * software has, where an answer shows, and what is on the shelves.
 */

function with_(configuration: Configuration, change: (draft: Configuration) => void): Configuration {
  const copy = structuredClone(configuration);
  change(copy);
  return copy;
}

describe("the sections down the side", () => {
  it.each(packs)("%s always ends with the till, the reports and the settings", (pack) => {
    const sections = sectionsFor(defaultConfiguration(pack, "fr"));
    expect(sections.slice(-3)).toEqual(["cash", "reports", "settings"]);
  });

  it("has no customers section for a shop that does not sell on credit", () => {
    const base = defaultConfiguration("shop", "fr");
    expect(sectionsFor(base)).toContain("customers");
    const noCredit = with_(base, (draft) => {
      draft.common.credit.enabled = false;
    });
    expect(sectionsFor(noCredit)).not.toContain("customers");
  });

  it("gives a bakery production and orders only when it keeps them", () => {
    const base = defaultConfiguration("bakery", "fr");
    expect(sectionsFor(base)).toEqual(expect.arrayContaining(["production", "preorders"]));
    const plain = with_(base, (draft) => {
      draft.features.bakery!.trackProduction = false;
      draft.features.bakery!.preorders = false;
    });
    expect(sectionsFor(plain)).not.toContain("production");
    expect(sectionsFor(plain)).not.toContain("preorders");
  });

  it("gives a transport company a parcels section only when it carries parcels", () => {
    const base = defaultConfiguration("transport", "fr");
    const passengers = with_(base, (draft) => {
      draft.features.transport!.carries = ["passengers"];
    });
    expect(sectionsFor(base)).toContain("parcels");
    expect(sectionsFor(passengers)).not.toContain("parcels");
  });

  it("names every section in all three languages", () => {
    for (const pack of packs) {
      for (const section of sectionsFor(defaultConfiguration(pack, "fr"))) {
        for (const words of [fr, ar, en]) expect(words.nav[section]).toBeTruthy();
      }
    }
  });
});

describe("where an answer shows", () => {
  it("opens the room plan when the number of tables changes", () => {
    const configuration = defaultConfiguration("restaurant", "fr");
    expect(focusFor("features.restaurant.tables", configuration)).toEqual({ section: "counter", detail: "tables" });
  });

  it("goes to the customers when credit is switched on, and back to the till when it is switched off", () => {
    const on = defaultConfiguration("pharmacy", "fr");
    expect(focusFor("common.credit.enabled", on)?.section).toBe("customers");
    const off = with_(on, (draft) => {
      draft.common.credit.enabled = false;
    });
    expect(focusFor("common.credit.enabled", off)?.section).toBe("sale");
  });

  it("only ever points at a section the shop has", () => {
    for (const pack of packs) {
      const configuration = defaultConfiguration(pack, "fr");
      const sections = sectionsFor(configuration);
      const paths = changedPaths(defaultConfiguration(pack === "shop" ? "pharmacy" : "shop", "fr"), configuration);
      for (const path of [...paths, "common.cashClose", "common.lowStockAlert", "common.discounts"]) {
        const focus = focusFor(path, configuration);
        if (focus) expect(sections).toContain(focus.section);
      }
    }
  });

  it("finds the one switch that changed", () => {
    const before = defaultConfiguration("hotel", "fr");
    const after = with_(before, (draft) => {
      draft.features.hotel!.rooms = 24;
    });
    expect(changedPaths(before, after)).toEqual(["features.hotel.rooms"]);
    expect(changedPaths(before, structuredClone(before))).toEqual([]);
  });
});

describe("the shelves", () => {
  it("prices a bakery's loaves by the kilo only when it sells by weight", () => {
    const base = defaultConfiguration("bakery", "fr");
    expect(catalogueFor(base, null).some((item) => item.weighed)).toBe(false);
    const both = with_(base, (draft) => {
      draft.features.bakery!.sellBy = ["piece", "weight"];
    });
    const weighed = catalogueFor(both, null).filter((item) => item.weighed);
    expect(weighed.length).toBeGreaterThan(0);
    expect(weighed.length).toBeLessThan(catalogueFor(both, null).length);
  });

  it("offers options on dishes only when the restaurant takes them", () => {
    const base = defaultConfiguration("restaurant", "fr");
    expect(catalogueFor(base, null).some((item) => item.hasOptions)).toBe(false);
    const options = with_(base, (draft) => {
      draft.features.restaurant!.options = true;
    });
    expect(catalogueFor(options, null).some((item) => item.hasOptions)).toBe(true);
  });

  it("counts nothing for a restaurant, a hotel or a transport company", () => {
    for (const pack of ["restaurant", "hotel", "transport"] as const) {
      const configuration = defaultConfiguration(pack, "fr");
      expect(tracksStock(configuration)).toBe(false);
      expect(catalogueFor(configuration, null).every((item) => item.stock === null)).toBe(true);
    }
  });

  it("shows the owner's own products once imported, in place of the samples", () => {
    const configuration = defaultConfiguration("shop", "fr");
    const own = catalogueFor(configuration, [
      { row: 2, name: "Lait concentré", price: 3500, quantity: 12 },
      { row: 3, name: "Biscuits", price: 1000, quantity: 3, expiry: "2027-01-31" },
    ]);
    expect(own.map((item) => item.name)).toEqual(["Lait concentré", "Biscuits"]);
    expect(own[1].stock).toBe(3);
    expect(own[1].expiry?.getFullYear()).toBe(2027);
  });

  it("names the samples in the language the staff will read", () => {
    const arabic = catalogueFor(defaultConfiguration("pharmacy", "ar"), null);
    expect(arabic[0].name).toMatch(/[؀-ۿ]/);
  });
});
