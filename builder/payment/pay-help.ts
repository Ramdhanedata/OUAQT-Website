import type { PrivateSettings } from "@/builder/db/private-settings";
import type { PublicSettings } from "@/builder/db/settings";
import { appName, payToFrom, type PaymentApp } from "./apps";
import { licenceChoices, type Plan } from "./pricing";

/*
 * How to pay, as the desktop app's end-of-licence window shows it: which
 * apps, to which number, and how much for each length he may pay for.
 *
 * It travels with every licence, like the WhatsApp number, so a new number
 * or a new price reaches every shop at its next refresh with no new
 * installer. It is read from the same settings as the payment page, so the
 * window and the page can never name two different numbers or amounts.
 */

export type PayHelp = {
  payTo: { app: PaymentApp; name: string; nameArabic: string; number: string }[];
  /* Minor units, as everywhere in this API. Only the prices that are set. */
  prices: { plan: Plan; amount: number }[];
};

export function payHelpFor(settings: PublicSettings, secrets: PrivateSettings, launchClient: boolean): PayHelp {
  return {
    payTo: payToFrom(secrets).map(({ app, number }) => ({
      app,
      name: appName(app, "fr"),
      nameArabic: appName(app, "ar"),
      number,
    })),
    prices: licenceChoices(settings, launchClient).flatMap((price) =>
      price.amount == null ? [] : [{ plan: price.plan, amount: price.amount }]
    ),
  };
}
