/*
 * What state a shop's licence is in, worked out from its dates rather than
 * from a column somebody remembered to update.
 *
 * A stored status goes stale the moment a day passes with nobody looking at
 * it. The row holds the plan and the dates, which are facts, and the status
 * is derived from them every time it is asked for. The one exception is
 * `suspended`, which is a decision rather than a date.
 *
 * not-a-rule-file: this decides shape, never how long anything lasts. Every
 * duration arrives as an argument, read from settings.
 */

export const licencePlans = ["trial", "annual", "perpetual", "extra_device"] as const;
export type LicencePlan = (typeof licencePlans)[number];

export const licenceStatuses = [
  "trial",
  "active",
  "expired_trial",
  "renewal_due",
  "expired",
  "suspended",
] as const;
export type LicenceStatus = (typeof licenceStatuses)[number];

export type Licence = {
  plan: LicencePlan;
  /** Set at the first activation of a desktop device, not at account creation. */
  startsAt: Date | null;
  endsAt: Date | null;
  /** True only when a person decided so. Nothing derives it. */
  suspended?: boolean;
};

const MS_IN_A_DAY = 86_400_000;

/**
 * The state the dates say it is in.
 *
 * A trial that has not started yet is still a trial: the owner has his
 * software and has not run it anywhere, which is not something to punish.
 */
export function statusOf(licence: Licence, now: Date): LicenceStatus {
  if (licence.suspended) return "suspended";

  if (licence.plan === "perpetual") return "active";

  if (licence.plan === "trial") {
    if (!licence.endsAt) return "trial";
    return now < licence.endsAt ? "trial" : "expired_trial";
  }

  // annual, and the extra device that follows it
  if (!licence.endsAt) return "active";
  /*
   * Tacite reconduction: the day it ends it is due for renewal, not dead. The
   * shop keeps working and the owner is asked to pay, which is the difference
   * between a business relationship and a locked till.
   */
  return now < licence.endsAt ? "active" : "renewal_due";
}

/** Whole days from now until the end, never negative. Null when there is no end. */
export function daysLeft(licence: Licence, now: Date): number | null {
  if (!licence.endsAt) return null;
  const left = Math.ceil((licence.endsAt.getTime() - now.getTime()) / MS_IN_A_DAY);
  return Math.max(0, left);
}

/** The trial's end, counted from the first activation. */
export function trialEnd(startsAt: Date, trialDays: number): Date {
  return new Date(startsAt.getTime() + trialDays * MS_IN_A_DAY);
}

/** Whether the software may still be written to, as opposed to read. */
export function canStillWork(status: LicenceStatus): boolean {
  return status === "trial" || status === "active" || status === "renewal_due";
}
