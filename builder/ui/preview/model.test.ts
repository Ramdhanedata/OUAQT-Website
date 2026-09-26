import { describe, expect, it } from "vitest";
import { defaultConfiguration, packs, type Configuration } from "@/app-ui/config";
import { changedPaths, focusFor, sectionsFor, tracksStock } from "./model";
import { fr, ar, en } from "./words";

/*
 * The preview's rules: which sections a shop's software has, and which of
 * them an answer changed.
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
  it("opens the till when the number of tables changes", () => {
    const configuration = defaultConfiguration("restaurant", "fr");
    expect(focusFor("features.restaurant.tables", configuration)).toEqual({ section: "counter" });
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

describe("what is counted", () => {
  it("counts nothing for a restaurant, a hotel or a transport company", () => {
    for (const pack of ["restaurant", "hotel", "transport"] as const) {
      expect(tracksStock(defaultConfiguration(pack, "fr"))).toBe(false);
    }
  });

  it("counts a general business's stock only when it sells products and keeps count", () => {
    const base = defaultConfiguration("general", "fr");
    expect(tracksStock(base)).toBe(true);
    const services = with_(base, (draft) => {
      draft.features.general!.sells = ["services"];
    });
    expect(tracksStock(services)).toBe(false);
  });
});
