import { describe, expect, it } from "vitest";
import {
  canStillWork,
  daysLeft,
  graceDaysLeft,
  needsReminder,
  statusOf,
  trialEnd,
} from "./status";

const now = new Date("2026-09-20T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);
/* Whatever settings say. These are the seeded values, passed in, never read here. */
const rules = { renewalGraceDays: 30 };

describe("a trial", () => {
  it("runs from the first activation, not from the account", () => {
    const started = new Date("2026-09-10T08:00:00Z");
    expect(trialEnd(started, 14).toISOString()).toBe("2026-09-24T08:00:00.000Z");
  });

  it("is a trial until its last day", () => {
    expect(statusOf({ plan: "trial", startsAt: days(-13), endsAt: days(1) }, now, rules)).toBe("trial");
  });

  it("expires the moment it ends, with no grace", () => {
    expect(statusOf({ plan: "trial", startsAt: days(-14), endsAt: days(-1) }, now, rules)).toBe("expired_trial");
  });

  it("has not started until a device activates", () => {
    expect(statusOf({ plan: "trial", startsAt: null, endsAt: null }, now, rules)).toBe("trial");
  });

  it("stops the software being written to once it has expired", () => {
    expect(canStillWork("expired_trial")).toBe(false);
    expect(canStillWork("trial")).toBe(true);
  });
});

describe("an annual licence that runs out", () => {
  const lapsed = (daysAgo: number) => ({
    plan: "annual" as const,
    startsAt: days(-365 - daysAgo),
    endsAt: days(-daysAgo),
  });

  it("is active while it runs", () => {
    expect(statusOf({ plan: "annual", startsAt: days(-30), endsAt: days(335) }, now, rules)).toBe("active");
  });

  it("is due for renewal the day after it ends, and the shop works normally", () => {
    expect(statusOf(lapsed(1), now, rules)).toBe("renewal_due");
    expect(canStillWork("renewal_due")).toBe(true);
    expect(needsReminder("renewal_due")).toBe(true);
  });

  it("is still working on the last day of the grace", () => {
    expect(statusOf(lapsed(29), now, rules)).toBe("renewal_due");
  });

  it("goes read-only when the grace runs out", () => {
    expect(statusOf(lapsed(30), now, rules)).toBe("expired");
    expect(canStillWork("expired")).toBe(false);
  });

  it("counts down the days left for the daily reminder", () => {
    expect(graceDaysLeft(lapsed(1), now, rules)).toBe(29);
    expect(graceDaysLeft(lapsed(29), now, rules)).toBe(1);
  });

  it("has nothing to remind about while it is still running", () => {
    expect(graceDaysLeft({ plan: "annual", startsAt: days(-30), endsAt: days(335) }, now, rules)).toBeNull();
    expect(needsReminder("active")).toBe(false);
  });

  it("follows the grace length it is given, not one written here", () => {
    expect(statusOf(lapsed(10), now, { renewalGraceDays: 7 })).toBe("expired");
    expect(statusOf(lapsed(10), now, { renewalGraceDays: 60 })).toBe("renewal_due");
  });
});

describe("a perpetual licence", () => {
  it("does not end", () => {
    expect(statusOf({ plan: "perpetual", startsAt: days(-900), endsAt: null }, now, rules)).toBe("active");
  });
});

describe("a suspended licence", () => {
  it("is suspended whatever its dates say", () => {
    expect(
      statusOf({ plan: "annual", startsAt: days(-30), endsAt: days(335), suspended: true }, now, rules)
    ).toBe("suspended");
    expect(canStillWork("suspended")).toBe(false);
  });
});

describe("days left", () => {
  it("counts whole days the way an owner would", () => {
    expect(daysLeft({ plan: "trial", startsAt: days(-5), endsAt: days(9) }, now)).toBe(9);
  });

  it("never goes negative", () => {
    expect(daysLeft({ plan: "trial", startsAt: days(-20), endsAt: days(-6) }, now)).toBe(0);
  });

  it("says nothing when there is no end", () => {
    expect(daysLeft({ plan: "perpetual", startsAt: days(-5), endsAt: null }, now)).toBeNull();
  });
});
