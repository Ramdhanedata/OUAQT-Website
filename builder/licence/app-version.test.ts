import { describe, expect, it } from "vitest";
import { cleanAppVersion, compareAppVersions, withAppVersion } from "./app-version";

describe("the version a device reports", () => {
  it("keeps a version number, without a leading v", () => {
    expect(cleanAppVersion("0.1.77")).toBe("0.1.77");
    expect(cleanAppVersion(" v0.1.77 ")).toBe("0.1.77");
    expect(cleanAppVersion("0.1.77-phone")).toBe("0.1.77-phone");
  });

  it("drops anything that is not a version number", () => {
    expect(cleanAppVersion(undefined)).toBeNull();
    expect(cleanAppVersion("")).toBeNull();
    expect(cleanAppVersion("phone")).toBeNull();
    expect(cleanAppVersion("0.1.77; drop table")).toBeNull();
    expect(cleanAppVersion("1 200 MRU")).toBeNull();
  });

  it("orders versions by their numbers", () => {
    expect(compareAppVersions("0.1.9", "0.1.10")).toBe(-1);
    expect(compareAppVersions("0.1.76", "v0.1.76")).toBe(0);
    expect(compareAppVersions("0.2", "0.1.99")).toBe(1);
    expect(compareAppVersions("0.1.77-phone", "0.1.77")).toBe(0);
  });

  it("writes the row again without the version when the column is not there yet", async () => {
    const seen: object[] = [];
    const result = await withAppVersion("0.1.77", async (extra) => {
      seen.push(extra);
      return { error: "app_version" in extra ? { message: "Could not find the 'app_version' column of 'devices'" } : null };
    });
    expect(result.error).toBeNull();
    expect(seen).toEqual([{ app_version: "0.1.77" }, {}]);
  });

  it("writes once, with the version, when the column is there, and once without when there is none", async () => {
    const seen: object[] = [];
    await withAppVersion("0.1.77", async (extra) => (seen.push(extra), { error: null }));
    await withAppVersion(null, async (extra) => (seen.push(extra), { error: null }));
    expect(seen).toEqual([{ app_version: "0.1.77" }, {}]);
  });

  it("does not hide another failure", async () => {
    let calls = 0;
    const result = await withAppVersion("0.1.77", async () => (calls++, { error: { message: "duplicate key" } }));
    expect(result.error?.message).toBe("duplicate key");
    expect(calls).toBe(1);
  });

  it("does not rank what it cannot read", () => {
    expect(compareAppVersions(null, "0.1.76")).toBeNull();
    expect(compareAppVersions("0.1.76", "latest")).toBeNull();
  });
});
