import type { AppLanguage, Configuration } from "@/app-ui";
import type { ImportedProduct } from "@/builder/import/parse";
import { sampleItems } from "./samples";

/*
 * What the preview works out from a configuration: which sections the app
 * has, what is on its shelves, and where to look when an answer changes.
 *
 * The sections follow the desktop app's own rule (src/shell.tsx there), so
 * the side of the preview is the side of the software, section for section.
 * When one changes, the other has to.
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

export type Item = {
  id: string;
  name: string;
  price: number;
  stock: number | null;
  category?: string;
  expiry?: Date;
  batch?: string;
  supplier?: string;
  weighed?: boolean;
  hasOptions?: boolean;
};

/* An imported list can hold thousands of rows; the screen only ever shows a page of them. */
const SHOWN_AT_MOST = 60;

/*
 * The shelves: the owner's own products once imported, the samples until
 * then. Either way the answers decide what each product shows: a shop that
 * does not sell by weight has no price per kilo, a restaurant that takes no
 * options has no options.
 */
export function catalogueFor(
  configuration: Configuration,
  imported: ImportedProduct[] | null | undefined
): Item[] {
  const language = configuration.language.app;
  const counted = tracksStock(configuration);
  const sellBy =
    configuration.features.bakery?.sellBy ?? configuration.features.shop?.sellBy ?? ["piece"];
  const onlyWeight = !sellBy.includes("piece");
  const byWeight = sellBy.includes("weight");
  const options = configuration.features.restaurant?.options === true;

  if (imported && imported.length > 0) {
    return imported.slice(0, SHOWN_AT_MOST).map((product) => {
      const expiry = product.expiry ? new Date(product.expiry) : undefined;
      return {
        id: `own-${product.row}`,
        name: product.name,
        price: product.price,
        stock: counted ? product.quantity : null,
        expiry: expiry && !Number.isNaN(expiry.getTime()) ? expiry : undefined,
        batch: product.batch,
        weighed: onlyWeight,
      };
    });
  }

  const today = new Date();
  return sampleItems(configuration.pack).map((item) => ({
    id: item.id,
    name: item.name[language],
    price: item.price,
    stock: counted ? item.stock : null,
    category: item.category?.[language],
    expiry:
      item.expiresInMonths === undefined
        ? undefined
        : new Date(today.getFullYear(), today.getMonth() + item.expiresInMonths, 4 + (item.price % 20)), // not-a-rule: a sample date, its day varied by the item
    batch: item.batch,
    supplier: item.supplier,
    weighed: onlyWeight || (byWeight && item.weighed === true),
    hasOptions: options && item.hasOptions === true,
  }));
}

/*
 * Where an answer shows. When the owner changes one, the preview moves to
 * the screen it changed, so they see the effect rather than hunt for it.
 * Null means "stay where you are": a name, a phone number, a logo show on
 * every screen already.
 */
export type Focus = { section: Section; detail?: "tables" };

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

  if (path === "features.restaurant.tables") return { section: "counter", detail: "tables" };
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

/** The shop's name as the staff will see it: Arabic on an Arabic screen when there is one. */
export function shopName(configuration: Configuration, fallback: string): string {
  const { business } = configuration;
  return (configuration.language.app === "ar" && business.nameArabic) || business.nameLatin || fallback;
}

/** A date the way the app writes it: day first, digits only. */
export function shortDate(date: Date, language: AppLanguage): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return language === "en"
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function clock(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Whole months from today to a date; negative once it is past. */
export function monthsUntil(date: Date): number {
  const now = new Date();
  return (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth()); // not-a-rule: months in a year
}
