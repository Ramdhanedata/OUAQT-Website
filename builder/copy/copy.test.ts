import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n/config";
import { getBuilderCopy } from ".";

/** Every leaf, as "shell.next" or "landing.steps.0". */
function keysOf(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => keysOf(item, `${prefix}.${index}`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      keysOf(child, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [prefix];
}

describe("builder copy", () => {
  const french = keysOf(getBuilderCopy("fr")).sort();

  it.each(locales)("%s has every key French has, and no extras", (locale) => {
    expect(keysOf(getBuilderCopy(locale)).sort()).toEqual(french);
  });

  it.each(locales)("%s has no empty string", (locale) => {
    const empty = keysOf(getBuilderCopy(locale)).filter((key) => {
      const value = key
        .split(".")
        .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], getBuilderCopy(locale));
      return typeof value !== "string" || value.trim() === "";
    });
    expect(empty).toEqual([]);
  });
});
