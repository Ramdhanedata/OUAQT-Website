import { describe, expect, it } from "vitest";
import { canStillWork, daysLeft, statusOf, trialEnd } from "./status";

const now = new Date("2026-09-20T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe("a trial", () => {
  it("runs from the first activation, not from the account", () => {
    const started = new Date("2026-09-10T08:00:00Z");
    expect(trialEnd(started, 14).toISOString()).toBe("2026-09-24T08:00:00.000Z");
  });

  it("is a trial until its last day", () => {
    expect(statusOf({ plan: "trial", startsAt: days(-13), endsAt: days(1) }, now)).toBe("trial");
  });

  it("expires the moment it ends", () => {
    expect(statusOf({ plan: "trial", startsAt: days(-14), endsAt: days(-1) }, now)).toBe("expired_trial");
  });

  it("has not started until a device activates", () => {
    expect(statusOf({ plan: "trial", startsAt: null, endsAt: null }, now)).toBe("trial");
  });

  it("stops the software from being written to once it has expired", () => {
    expect(canStillWork("expired_trial")).toBe(false);
    expect(canStillWork("trial")).toBe(true);
  });
});

describe("an annual licence", () => {
  it("is active while it runs", () => {
    expect(statusOf({ plan: "annual", startsAt: days(-30), endsAt: days(335) }, now)).toBe("active");
  });

  /*
   * The shop keeps working on the day it lapses. That is deliberate: a till
   * that stops at midnight over an unpaid invoice loses the owner a morning
   * and us a client.
   */
  it("becomes due for renewal at the end, and the shop keeps working", () => {
    const lapsed = { plan: "annual" as const, startsAt: days(-400), endsAt: days(-1) };
    expect(statusOf(lapsed, now)).toBe("renewal_due");
    expect(canStillWork("renewal_due")).toBe(true);
  });
});

describe("a perpetual licence", () => {
  it("does not end", () => {
    expect(statusOf({ plan: "perpetual", startsAt: days(-900), endsAt: null }, now)).toBe("active");
  });
});

describe("a suspended licence", () => {
  it("is suspended whatever its dates say", () => {
    expect(
      statusOf({ plan: "annual", startsAt: days(-30), endsAt: days(335), suspended: true }, now)
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
