import type { AppLanguage } from "@/app-ui";

/*
 * The apps an owner can pay OUAQT from, in the order the page offers them.
 *
 * Each has its receiving number in settings, under `<app>_number`, and an app
 * whose number is empty is not offered. The steps are the same whichever he
 * picks: send the amount to the number, take a screenshot, send it here.
 */

export const PAYMENT_APPS = ["bankily", "masrvi", "bimbank", "sedad", "click"] as const;

export type PaymentApp = (typeof PAYMENT_APPS)[number];

/* As each app writes its own name, and as it is said in Arabic. */
const NAMES: Record<PaymentApp, { latin: string; arabic: string }> = {
  bankily: { latin: "Bankily", arabic: "بنكيلي" },
  masrvi: { latin: "Masrvi", arabic: "مصرفي" },
  bimbank: { latin: "BimBank", arabic: "بيم بنك" },
  sedad: { latin: "SEDAD", arabic: "سداد" },
  click: { latin: "Click", arabic: "كليك" },
};

export function appName(app: PaymentApp, language: AppLanguage): string {
  return language === "ar" ? NAMES[app].arabic : NAMES[app].latin;
}

/** Where to send the money on one app. */
export type PayTo = { app: PaymentApp; number: string };

export type AppNumbers = { [K in PaymentApp as `${K}_number`]?: string };

/** The apps that have a number, each with it. */
export function payToFrom(numbers: AppNumbers): PayTo[] {
  return PAYMENT_APPS.flatMap((app) => {
    const number = (numbers[`${app}_number`] ?? "").trim();
    return number ? [{ app, number }] : [];
  });
}
