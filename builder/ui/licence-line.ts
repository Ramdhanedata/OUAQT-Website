import type { BuilderCopy } from "@/builder/copy";
import type { LicenceStatus } from "@/builder/licence/status";
import type { Locale } from "@/lib/i18n/config";
import { plural } from "@/lib/utils";

export type LicenceShown = {
  status: LicenceStatus;
  endsAt: string | null;
  daysLeft: number | null;
  graceDaysLeft: number | null;
};

/*
 * One sentence that says where he stands, in the order he would ask it:
 * how long he has, or what stopped, and what to do about it. The account
 * page and the payment by numéro de série say it the same way.
 */
export function licenceLine(copy: BuilderCopy, lang: Locale, licence: LicenceShown | null): string {
  if (!licence) return copy.licence.notStarted as string;
  switch (licence.status) {
    case "trial":
      return licence.daysLeft == null ? (copy.licence.notStarted as string) : plural(lang, licence.daysLeft, copy.licence.trial);
    case "expired_trial":
      return copy.licence.trialOver as string;
    case "active":
      return (copy.licence.active as string).replace("{date}", licence.endsAt ? new Date(licence.endsAt).toLocaleDateString(lang) : "");
    case "renewal_due":
      return plural(lang, licence.graceDaysLeft ?? 0, copy.licence.renewalDue);
    case "expired":
      return copy.licence.expired as string;
    case "suspended":
      return copy.licence.suspended as string;
  }
}

/** Whether there is something to pay: a trial, or a licence that ran out. */
export function owes(licence: LicenceShown | null): boolean {
  return !licence || ["trial", "expired_trial", "renewal_due", "expired"].includes(licence.status);
}
