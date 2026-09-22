/*
 * What state a shop's licence is in, worked out from its dates rather than
 * from a column somebody remembered to update.
 *
 * A stored status goes stale the moment a day passes with nobody looking at
 * it. The row holds the plan and the dates, which are facts, and the status
 * is derived from them every time it is asked for. The one exception is
 * `suspended`, which is a decision rather than a date.
 *
 * What happens when an annual licence runs out:
 *
 *   for renewal_grace_days   `renewal_due`. The software works exactly as
 *                            before and reminds him once a day, with the
 *                            number to pay and the amount.
 *   after that               `expired`. Read-only, like an unpaid trial:
 *                            everything already recorded stays visible, no
 *                            new sales, and paying unlocks it again at once.
 *
 * Nothing is ever deleted, at any point. The grace length is delivered to the
 * desktop app inside its licence file so it behaves the same with no network.
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

/** The durations that shape the answers, all of them read from settings. */
export type LicenceRules = {
  renewalGraceDays: number;
};

const MS_IN_A_DAY = 86_400_000;

/**
 * The state the dates say it is in.
 *
 * A trial that has not started yet is still a trial: the owner has his
 * software and has not run it anywhere, which is not something to punish.
 */
export function statusOf(
  licence: Licence,
  now: Date,
  rules: LicenceRules
): LicenceStatus {
  if (licence.suspended) return "suspended";

  if (licence.plan === "perpetual") return "active";

  if (licence.plan === "trial") {
    if (!licence.endsAt) return "trial";
    return now < licence.endsAt ? "trial" : "expired_trial";
  }

  // annual, and the extra device that follows it
  if (!licence.endsAt) return "active";
  if (now < licence.endsAt) return "active";

  /*
   * Tacite reconduction, with a limit. The day it ends it is due for renewal,
   * not dead: the shop keeps working and the owner is reminded. A month later
   * it goes read-only, which is a stop he has been warned about daily rather
   * than a till that dies at midnight over an unpaid invoice.
   */
  return now < graceEnd(licence.endsAt, rules) ? "renewal_due" : "expired";
}

/** When the grace after an annual licence runs out. */
export function graceEnd(endsAt: Date, rules: LicenceRules): Date {
  return new Date(endsAt.getTime() + rules.renewalGraceDays * MS_IN_A_DAY);
}

/**
 * Days left before the software goes read-only, for the daily reminder.
 * Null when it is not in that state.
 */
export function graceDaysLeft(
  licence: Licence,
  now: Date,
  rules: LicenceRules
): number | null {
  if (statusOf(licence, now, rules) !== "renewal_due" || !licence.endsAt) {
    return null;
  }
  const left = Math.ceil(
    (graceEnd(licence.endsAt, rules).getTime() - now.getTime()) / MS_IN_A_DAY
  );
  return Math.max(0, left);
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

/**
 * Whether the software may still be written to, as opposed to read.
 *
 * Read-only never means hidden. Every sale, every debt and every stock count
 * already recorded stays on screen whatever the licence says, and paying puts
 * the rest back the same minute.
 */
export function canStillWork(status: LicenceStatus): boolean {
  return status === "trial" || status === "active" || status === "renewal_due";
}

/** Whether the owner should be reminded today, and how urgently. */
export function needsReminder(status: LicenceStatus): boolean {
  return status === "renewal_due";
}

/*
 * The clock rule.
 *
 * The app remembers the latest time it has ever seen. If the computer's clock
 * now says it is earlier than that by more than the licence allows, somebody
 * has wound it back, most likely to stretch a trial. A shop PC whose battery
 * has died loses a few hours or a day and gets it back at the next sync, so
 * the allowance is generous and arrives in the licence file rather than being
 * guessed here.
 *
 * What the app does about it is the same as an expired licence: read-only,
 * nothing hidden, nothing deleted, and a refresh from the network sets it
 * right the moment there is one.
 */
export function clockWoundBack(
  now: Date,
  latestSeen: Date,
  clockGraceDays: number
): boolean {
  return latestSeen.getTime() - now.getTime() > clockGraceDays * MS_IN_A_DAY;
}

/**
 * The status the app should act on, from a licence file and this machine's
 * own sense of time.
 */
export function effectiveStatus(
  licence: Licence,
  now: Date,
  latestSeen: Date,
  rules: LicenceRules & { clockGraceDays: number }
): { status: LicenceStatus; clockWrong: boolean } {
  /*
   * Only a licence with an end date has anything to stretch. A perpetual one
   * does not, and locking a paid-up shop over a flat battery would punish the
   * one owner the rule was never about.
   */
  if (licence.endsAt && clockWoundBack(now, latestSeen, rules.clockGraceDays)) {
    /* Judged at the latest honest time we have, never at the wound-back one. */
    if (licence.suspended) return { status: "suspended", clockWrong: true };
    /*
     * Read-only in the words that fit the plan: an unpaid trial and a lapsed
     * annual licence say different things to the owner, and the right one
     * depends on what he has, not on what the dates happened to say.
     */
    return {
      status: licence.plan === "trial" ? "expired_trial" : "expired",
      clockWrong: true,
    };
  }
  return { status: statusOf(licence, now, rules), clockWrong: false };
}
