import type { AppLanguage } from "./config";

/*
 * Numbers and money, written the way each language writes them.
 *
 * Arabic gets Western digits on purpose. Shop staff read prices off invoices,
 * calculators and phone screens that all use them, and the receipt printer has
 * no Arabic-Indic glyphs anyway.
 */

const numberLocale: Record<AppLanguage, string> = {
  fr: "fr-FR",
  ar: "fr-FR",
  en: "en-US",
};

const DECIMALS = 2; // not-a-rule: MRU is written with two decimals

export function formatAmount(value: number, language: AppLanguage): string {
  return new Intl.NumberFormat(numberLocale[language], {
    minimumFractionDigits: DECIMALS,
    maximumFractionDigits: DECIMALS,
  }).format(value);
}

/** An amount with its currency, as it appears on a receipt or a total. */
export function formatMoney(
  value: number,
  language: AppLanguage,
  currency = "MRU"
): string {
  return `${formatAmount(value, language)} ${currency}`;
}

export function formatQuantity(value: number, language: AppLanguage): string {
  return new Intl.NumberFormat(numberLocale[language], {
    maximumFractionDigits: 3,
  }).format(value);
}

/** Date and time as a receipt shows them: short, unambiguous, no month names. */
export function formatDateTime(date: Date, language: AppLanguage): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return language === "en"
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`
    : `${day} ${time}`;
}

export function isRightToLeft(language: AppLanguage): boolean {
  return language === "ar";
}
