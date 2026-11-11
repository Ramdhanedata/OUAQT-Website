/*
 * What each setting is, so the settings page can show it as what it is: a
 * price in ouguiyas, a number of days, a switch, a phone number, an address.
 *
 * The table stores every value as JSON under a code name, and for a long
 * time the page showed exactly that. A price is kept in hundredths, so the
 * year at 18 000 MRU read 1800000, and typing 19000 into that box would
 * have put the year on sale for 190 MRU. Here every key gets a group, a
 * kind and a unit, and the two functions at the bottom turn what is stored
 * into what is shown and what is typed back into what is stored.
 *
 * A key nobody has described here still shows, under "other", as the kind
 * of value it holds: adding a setting to the database never hides it.
 */

export const SETTING_GROUPS = ["prices", "trial", "payments", "licence", "downloads", "offers", "ai", "contact", "other"] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];

/* whole: an integer. number: decimals allowed. json: typed as it is stored. */
export type SettingKind = "money" | "whole" | "number" | "switch" | "text" | "json";
export type SettingUnit = "mru" | "days" | "hours" | "percent" | "months" | "years";
export type SettingShape = { group: SettingGroup; kind: SettingKind; unit: SettingUnit | null; nullable: boolean };

type Known = [group: SettingGroup, kind: SettingKind, unit: SettingUnit | null, nullable?: boolean];

const KNOWN: Record<string, Known> = {
  trial_days: ["trial", "whole", "days"],
  trial_summary_days: ["trial", "whole", "days"],
  trial_one_per_fingerprint: ["trial", "switch", null],
  trial_one_per_phone: ["trial", "switch", null],
  trial_require_fingerprint: ["trial", "switch", null],
  trial_fingerprint_parts_to_match: ["trial", "whole", null],
  trial_similarity_percent: ["trial", "whole", "percent"],

  payment_auto_confirm: ["payments", "switch", null],
  payment_max_age_days: ["payments", "whole", "days"],
  bankily_number: ["payments", "text", null],
  masrvi_number: ["payments", "text", null],
  bimbank_number: ["payments", "text", null],
  sedad_number: ["payments", "text", null],
  click_number: ["payments", "text", null],

  max_devices: ["licence", "whole", null],
  renewal_grace_days: ["licence", "whole", "days"],
  clock_grace_days: ["licence", "whole", "days"],
  device_releases_per_year: ["licence", "whole", null],
  activation_token_hours: ["licence", "whole", "hours"],
  activation_nearby_hours: ["licence", "whole", "hours"],

  tutorial_video_windows_url: ["downloads", "text", null],
  tutorial_video_mac_url: ["downloads", "text", null],

  launch_clients_limit: ["offers", "whole", null, true],
  launch_price_freeze_years: ["offers", "whole", "years", true],
  referral_free_months: ["offers", "whole", "months", true],
  bespoke_maintenance_percent: ["offers", "number", "percent", true],
  bespoke_maintenance_from_month: ["offers", "whole", null, true],

  ai_calls_per_day: ["ai", "whole", null],
  support_whatsapp: ["contact", "text", null],
};

/* Where a setting comes in its group: the order they are written in above, then anything else by name. */
const ORDER = Object.keys(KNOWN);
export function byPlace(a: string, b: string): number {
  const place = (key: string) => (ORDER.includes(key) ? ORDER.indexOf(key) : ORDER.length);
  return place(a) - place(b) || a.localeCompare(b);
}

const PRICE = /^price_[a-z_]+_mru$/;
const INSTALLER = /^installer_url_(windows|mac)_([a-z]+)$/;

export function shapeOf(key: string, value: unknown): SettingShape {
  /* Every price may be empty: that is how "not offered" and "pays the standard price" are said. */
  if (PRICE.test(key)) return { group: "prices", kind: "money", unit: "mru", nullable: true };
  if (INSTALLER.test(key)) return { group: "downloads", kind: "text", unit: null, nullable: false };
  const known = KNOWN[key];
  if (known) return { group: known[0], kind: known[1], unit: known[2], nullable: known[3] ?? false };
  const kind: SettingKind = typeof value === "boolean" ? "switch" : typeof value === "number" ? "number" : typeof value === "string" ? "text" : "json";
  return { group: "other", kind, unit: null, nullable: false };
}

/* The lengths and extras that have a standard price and a launch price, in the order of the price table. */
export const PRICE_ROWS = ["monthly", "bimonthly", "quarterly", "semiannual", "annual", "perpetual", "extra_device", "installation"] as const;
export const PRICE_TIERS = ["standard", "launch"] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

/** Where a price sits in the table, or null for one that stands alone. */
export function priceCell(key: string): { row: string; tier: PriceTier } | null {
  const found = /^price_([a-z_]+)_(standard|launch)_mru$/.exec(key);
  if (!found || !(PRICE_ROWS as readonly string[]).includes(found[1])) return null;
  return { row: found[1], tier: found[2] as PriceTier }; // not-a-rule: the parts of the key's name, not amounts
}

/** The system and the trade an installer address is for. */
export function installerOf(key: string): { platform: "windows" | "mac"; pack: string } | null {
  const found = INSTALLER.exec(key);
  return found ? { platform: found[1] as "windows" | "mac", pack: found[2] } : null;
}

const HUNDREDTHS = 100; // not-a-rule: an amount is stored in hundredths of an ouguiya

/** What the field shows for what is stored. A switch is not text and never comes here. */
export function shownValue(kind: SettingKind, value: unknown): string {
  if (value === null || value === undefined) return kind === "json" ? "null" : "";
  if (kind === "json") return JSON.stringify(value);
  if (kind === "money") return typeof value === "number" ? String(value / HUNDREDTHS) : "";
  return String(value);
}

export type Typed = { ok: true; value: unknown } | { ok: false; error: "invalid" | "whole" | "needed" };

/*
 * What is stored for what was typed. "18 000", "18000" and "18 000,50" are
 * all amounts; an empty box is "nothing" where the setting may be empty and
 * a mistake where it may not.
 */
export function typedValue(shape: Pick<SettingShape, "kind" | "nullable">, text: string): Typed {
  const typed = text.trim();
  if (shape.kind === "text") return { ok: true, value: typed };
  if (shape.kind === "json") {
    try {
      return { ok: true, value: JSON.parse(typed) };
    } catch {
      return { ok: false, error: "invalid" };
    }
  }
  if (shape.kind === "switch") return typed === "true" || typed === "false" ? { ok: true, value: typed === "true" } : { ok: false, error: "invalid" };

  if (typed === "") return shape.nullable ? { ok: true, value: null } : { ok: false, error: "needed" };
  /* Spaces of every width group thousands; a comma is a decimal point. */
  const plain = typed.replace(/[\s  ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(plain)) return { ok: false, error: "invalid" };
  const value = Number(plain);
  if (!Number.isFinite(value)) return { ok: false, error: "invalid" };
  if (shape.kind === "whole") return Number.isInteger(value) ? { ok: true, value } : { ok: false, error: "whole" };
  if (shape.kind === "money") return { ok: true, value: Math.round(value * HUNDREDTHS) };
  return { ok: true, value };
}
