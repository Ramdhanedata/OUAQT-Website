import { describe, expect, it } from "vitest";
import { packs } from "@/app-ui/packs";
import { choosablePacks, OPENING, openPacks } from "./opening";

describe("which trades owners can choose", () => {
  it("names every trade there is, once", () => {
    expect(Object.keys(OPENING).sort()).toEqual([...packs].sort());
  });

  it("offers a test mode browser every trade, and everybody else only the open ones", () => {
    expect(choosablePacks(true)).toEqual([...packs]);
    expect(choosablePacks(false)).toEqual(openPacks());
  });
});
