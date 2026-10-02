import { describe, expect, it } from "vitest";
import {
  ago,
  dailyCounts,
  dailyDistinct,
  endingWithin,
  groupOf,
  latestLicences,
  liveSessions,
  niceMax,
  presenceOf,
  shopStatus,
  SITE_LIVE_MINUTES,
  visitorsSince,
  type LicenceRow,
} from "./overview-math";

const now = new Date("2026-10-01T12:00:00Z");
const rules = { renewalGraceDays: 30 };
const days = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString();
const hours = (n: number) => new Date(now.getTime() + n * 3_600_000).toISOString();

const licence = (over: Partial<LicenceRow>): LicenceRow => ({
  business_id: "b1",
  plan: "annual",
  status: "active",
  starts_at: days(-100),
  ends_at: days(200),
  ...over,
});

describe("the newest licence of each shop", () => {
  it("keeps the first row per shop, which is the newest", () => {
    const newest = licence({ id: "new" });
    const older = licence({ id: "old" });
    const other = licence({ id: "other", business_id: "b2" });
    const map = latestLicences([newest, other, older]);
    expect(map.get("b1")?.id).toBe("new");
    expect(map.get("b2")?.id).toBe("other");
  });
});

describe("the group a shop is filtered under", () => {
  it("puts an ended trial with the lapsed licences", () => {
    const ended = licence({ plan: "trial", status: "trial", ends_at: days(-1) });
    expect(groupOf(shopStatus(ended, now, rules))).toBe("expired");
  });

  it("reads suspension from the column, whatever the dates say", () => {
    expect(groupOf(shopStatus(licence({ status: "suspended" }), now, rules))).toBe("suspended");
  });

  it("has no group without a licence", () => {
    expect(groupOf(shopStatus(undefined, now, rules))).toBeNull();
  });
});

describe("how recently a computer checked in", () => {
  it("counts the app's three-hour interval as open now", () => {
    expect(presenceOf(hours(-2.9), now)).toBe("now");
    expect(presenceOf(hours(-3.1), now)).toBe("today");
    expect(presenceOf(days(-3), now)).toBe("week");
    expect(presenceOf(days(-30), now)).toBe("older");
    expect(presenceOf(null, now)).toBe("never");
  });
});

describe("what ends this week", () => {
  it("gives the days left on a trial ending inside the window", () => {
    expect(endingWithin(licence({ plan: "trial", status: "trial", ends_at: days(3) }), now, 7, rules)).toBe(3);
  });

  it("leaves out what ends later, has no end, has stopped or is suspended", () => {
    expect(endingWithin(licence({ ends_at: days(20) }), now, 7, rules)).toBeNull();
    expect(endingWithin(licence({ plan: "perpetual", ends_at: null }), now, 7, rules)).toBeNull();
    expect(endingWithin(licence({ plan: "trial", status: "trial", ends_at: days(-2) }), now, 7, rules)).toBeNull();
    expect(endingWithin(licence({ status: "suspended", ends_at: days(2) }), now, 7, rules)).toBeNull();
  });
});

describe("relative times", () => {
  it("speaks each staff language, with Western digits in Arabic", () => {
    expect(ago(hours(-2), now, "en")).toBe("2 hours ago");
    expect(ago(hours(-2), now, "fr")).toBe("il y a 2 heures");
    expect(ago(hours(-5), now, "ar")).toMatch(/5/);
    expect(ago(now, now, "en")).toBe("now");
  });
});


describe("counting per day", () => {
  it("has every day, oldest first, today last", () => {
    const series = dailyCounts([days(0), days(0), days(-2), days(-40)], now, 3);
    expect(series.map((one) => one.count)).toEqual([1, 0, 2]);
    expect(series[2].day).toBe("2026-10-01");
  });

  it("counts a visitor once a day however many steps they took", () => {
    const rows = [
      { key: "a", at: hours(-1) },
      { key: "a", at: hours(-2) },
      { key: "b", at: hours(-3) },
      { key: "a", at: days(-1) },
    ];
    expect(dailyDistinct(rows, now, 2).map((one) => one.count)).toEqual([1, 2]);
  });
});

describe("people in the builder now", () => {
  it("counts recent sessions that have not left or finished", () => {
    const at = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
    const events = [
      { session_hash: "here", event: "reached", created_at: at(5) },
      { session_hash: "gone", event: "reached", created_at: at(10) },
      { session_hash: "gone", event: "left", created_at: at(4) },
      { session_hash: "done", event: "finished", created_at: at(2) },
      { session_hash: "old", event: "reached", created_at: at(90) },
    ];
    expect(liveSessions(events, now)).toBe(1);
  });
});

describe("visitors to the site", () => {
  const at = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  const visits = [
    { session_hash: "reader", created_at: at(2) },
    { session_hash: "reader", created_at: at(4) },
    { session_hash: "reader", created_at: at(6) },
    { session_hash: "earlier", created_at: at(SITE_LIVE_MINUTES + 5) },
    { session_hash: "yesterday", created_at: days(-1) },
  ];

  it("counts a tab once however many pages it opened", () => {
    expect(visitorsSince(visits, new Date(now.getTime() - SITE_LIVE_MINUTES * 60_000))).toBe(1);
  });

  it("counts everybody since a given moment", () => {
    expect(visitorsSince(visits, new Date(now.getTime() - 60 * 60_000))).toBe(2);
    expect(visitorsSince(visits, new Date(now.getTime() - 2 * 86_400_000))).toBe(3);
  });

  it("is nobody with no visits", () => {
    expect(visitorsSince([], now)).toBe(0);
  });
});

describe("a chart's scale", () => {
  it("rounds up to 1, 2 or 5 times a power of ten", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(3)).toBe(3);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(13)).toBe(20);
    expect(niceMax(420)).toBe(500);
  });
});
