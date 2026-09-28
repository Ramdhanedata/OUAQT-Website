import type { Configuration } from "@/app-ui";

/*
 * What the builder works out from a configuration for its preview: which
 * sections the app has, and which of them an answer just changed, so the
 * preview can open that one.
 *
 * The sections follow the desktop app's own rule (src/shell.tsx there). The
 * preview itself is the app, so a drift here does not change what the owner
 * sees; it only sends the window to a section it does not have, which the
 * app ignores.
 */

export type Section =
  | "dashboard"
  | "sale"
  | "counter"
  | "overview"
  | "menu"
  | "production"
  | "preorders"
  | "moves"
  | "rooms"
  | "stays"
  | "extras"
  | "trips"
  | "parcels"
  | "network"
  | "stock"
  | "expenses"
  | "customers"
  | "cash"
  | "reports"
  | "settings";

export function sectionsFor(configuration: Configuration): Section[] {
  const features = configuration.features;
  const own: Section[] = (() => {
    switch (configuration.pack) {
      case "restaurant":
        return ["counter", "menu"];
      case "bakery":
        return [
          "sale",
          ...(features.bakery?.trackProduction !== false ? (["production"] as Section[]) : []),
          ...(features.bakery?.preorders !== false ? (["preorders"] as Section[]) : []),
          "stock",
        ];
      case "warehouse":
        return ["moves", "stock", ...(features.warehouse?.sellsDirect ? (["sale"] as Section[]) : [])];
      case "hotel":
        return ["rooms", "stays", ...(features.hotel?.extras !== false ? (["extras"] as Section[]) : [])];
      case "transport":
        return [
          "trips",
          ...((features.transport?.carries ?? []).includes("parcels") ? (["parcels"] as Section[]) : []),
          "network",
        ];
      case "general":
        return [
          "dashboard",
          "sale",
          ...(tracksStock(configuration) ? (["stock"] as Section[]) : (["menu"] as Section[])),
          ...(features.general?.expenses !== false ? (["expenses"] as Section[]) : []),
        ];
      case "pharmacy":
        return ["sale", "overview", "stock"];
      default:
        return ["sale", "stock"];
    }
  })();

  const sections: Section[] = [...own];
  if (configuration.common.credit?.enabled) sections.push("customers");
  sections.push("cash", "reports", "settings");
  return [...new Set(sections)];
}

/** Whether this shop counts what is on its shelves at all. */
export function tracksStock(configuration: Configuration): boolean {
  switch (configuration.pack) {
    case "restaurant":
    case "hotel":
    case "transport":
      return false;
    case "general": {
      const general = configuration.features.general;
      return general?.trackStock !== false && (general?.sells ?? ["products"]).includes("products");
    }
    default:
      return true;
  }
}

/*
 * Where an answer shows. When the owner changes one, the preview moves to
 * the screen it changed, so they see the effect rather than hunt for it.
 * Null means "stay where you are": a name, a phone number, a logo show on
 * every screen already.
 */
export type Focus = { section: Section };

export function focusFor(path: string, configuration: Configuration): Focus | null {
  const sections = sectionsFor(configuration);
  const main = sections[0];
  const pick = (...wanted: Section[]): Focus => ({
    section: wanted.find((one) => sections.includes(one)) ?? main,
  });

  if (path.startsWith("common.credit")) return pick("customers");
  if (path === "common.cashClose") return pick("cash");
  if (path === "common.devices") return pick("settings");
  if (path === "common.lowStockAlert") return pick("stock");
  if (path.startsWith("common.")) return pick("sale", "counter", "extras");

  if (path.startsWith("features.restaurant")) return pick("counter");

  if (path === "features.bakery.trackProduction" || path === "features.bakery.unsold") return pick("production");
  if (path === "features.bakery.preorders" || path === "features.bakery.deposit") return pick("preorders");

  if (path === "features.warehouse.sellsDirect") return pick("sale", "moves");
  if (path.startsWith("features.warehouse")) return pick("moves");

  if (path === "features.hotel.rooms") return pick("rooms");
  if (path === "features.hotel.extras") return pick("extras", "rooms");
  if (path.startsWith("features.hotel")) return pick("stays");

  if (path === "features.transport.parcelPayer") return pick("parcels");
  if (path.startsWith("features.transport")) return pick("trips");

  if (path === "features.general.trackStock") return pick("stock", "menu");
  if (path === "features.general.expenses") return pick("expenses", "dashboard");

  if (path.startsWith("features.")) return pick("sale");
  return null;
}

/** Every leaf that differs between two configurations, as "common.credit.enabled". */
export function changedPaths(before: Configuration, after: Configuration): string[] {
  const leaves = (value: unknown, prefix: string, into: Map<string, string>) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) leaves(child, `${prefix}.${key}`, into);
    } else {
      into.set(prefix, JSON.stringify(value));
    }
    return into;
  };
  const read = (configuration: Configuration) => {
    const into = new Map<string, string>();
    leaves(configuration.common, "common", into);
    leaves(configuration.features, "features", into);
    return into;
  };

  const was = read(before);
  const now = read(after);
  const keys = new Set([...was.keys(), ...now.keys()]);
  return [...keys].filter((key) => was.get(key) !== now.get(key));
}
