import type { Locale } from "@/lib/i18n/config";

/*
 * The OUAQT price book. Every price on the site comes from this file, and the
 * same figures apply to every packaged product. There are deliberately no
 * per-product tables and no size tiers.
 *
 * Retiring the launch offer: set `launchOffer.active` to false. The standard
 * figures then render alone, with no strikethrough and no launch wording,
 * everywhere on the site.
 */

export type PriceLine = {
  /** What every client pays once the launch offer closes. A real price. */
  standard: number;
  /** What the first clients pay while the launch offer is open. */
  launch: number;
};

type PriceBook = {
  currency: "MRU";
  launchOffer: {
    active: boolean;
    /** How many clients the launch offer is open to. */
    clients: number;
    /** Years the launch annual licence price stays frozen. A price freeze, not a contract length. */
    freezeYears: number;
  };
  /** Installation, training and data migration. Paid once. */
  installation: PriceLine;
  /** Renews each year by tacite reconduction, cancellable before renewal. */
  annualLicence: PriceLine;
  /** Per year, for each device beyond `devicesIncluded`. */
  extraDevice: PriceLine;
  /** Paid once, installation included. Service for `perpetualServiceMonths` only. */
  perpetualLicence: PriceLine;
  /** Devices at the same site covered by any licence, replacements included. */
  devicesIncluded: number;
  perpetualServiceMonths: number;
  /** Bespoke builds are quoted on days of work, so only maintenance terms live here. */
  bespoke: {
    maintenancePercent: number;
    maintenanceFromMonth: number;
  };
  /**
   * Sectors named in the "current pricing covers" line that have a case study,
   * so the name links to it. Sectors without one appear as plain text.
   */
  coveredProducts: readonly {
    key: "pharmacy" | "hotel" | "transport" | "restaurant";
    slug: string;
  }[];
};

export const pricing: PriceBook = {
  currency: "MRU",
  launchOffer: {
    active: true,
    clients: 100,
    freezeYears: 3,
  },
  installation: { standard: 30_000, launch: 25_000 },
  annualLicence: { standard: 18_000, launch: 15_000 },
  extraDevice: { standard: 8_000, launch: 6_000 },
  perpetualLicence: { standard: 110_000, launch: 95_000 },
  devicesIncluded: 3,
  perpetualServiceMonths: 12,
  bespoke: {
    maintenancePercent: 18,
    maintenanceFromMonth: 13,
  },
  coveredProducts: [
    { key: "pharmacy", slug: "pharmacy-pos" },
    { key: "hotel", slug: "hotel-operations" },
    { key: "transport", slug: "transport-manifests" },
    { key: "restaurant", slug: "restaurant-pos" },
  ],
};

/*
 * Thousands separators by locale. French uses a space, English a comma, and
 * Arabic keeps Western digits with the comma the Arabic pages already use.
 *
 * The French space is U+00A0, a no-break space, written as an escape so no
 * invisible character sits in the source. It stops "18" and "000 MRU" landing
 * on different lines on a phone. Formatting by hand rather than through Intl
 * keeps the output identical on every server and browser.
 */
const groupSeparator: Record<Locale, string> = {
  fr: " ",
  en: ",",
  ar: ",",
};

const NBSP = " ";

export function formatNumber(value: number, locale: Locale): string {
  return String(Math.round(value)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    groupSeparator[locale]
  );
}

/*
 * How the currency is written. French and English use the ISO code. Arabic
 * spells out the new ouguiya, which is what MRU denotes, so the Arabic pages
 * carry no Latin letters and cannot be read as the old ouguiya.
 */
export const currencyLabel: Record<Locale, string> = {
  fr: pricing.currency,
  en: pricing.currency,
  ar: "أوقية جديدة",
};

export function formatPrice(value: number, locale: Locale): string {
  return `${formatNumber(value, locale)}${NBSP}${currencyLabel[locale]}`;
}

export function formatPercent(value: number, locale: Locale): string {
  return locale === "fr" ? `${value}${NBSP}%` : `${value}%`;
}

/** Values the pricing copy interpolates, so no term is typed into a translation. */
export function pricingTerms(locale: Locale): Record<string, string | number> {
  return {
    clients: pricing.launchOffer.clients,
    years: pricing.launchOffer.freezeYears,
    devices: pricing.devicesIncluded,
    months: pricing.perpetualServiceMonths,
    rate: formatPercent(pricing.bespoke.maintenancePercent, locale),
    month: pricing.bespoke.maintenanceFromMonth,
  };
}
