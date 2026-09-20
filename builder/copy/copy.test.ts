import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n/config";
import { getBuilderCopy } from ".";

/*
 * The plural forms are the one place languages are allowed to differ in
 * shape. French needs one and other; Arabic also has zero, two, few and many.
 * They are compared as a single key, and checked separately below.
 */
const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];

function isPluralForms(value: unknown): boolean {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length > 0 &&
    Object.keys(value as object).every((key) => PLURAL_CATEGORIES.includes(key))
  );
}

/** Every leaf, as "shell.next" or "landing.steps.0". */
function keysOf(value: unknown, prefix = ""): string[] {
  if (isPluralForms(value)) return [prefix];
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
      if (isPluralForms(value)) {
        return Object.values(value as Record<string, string>).some(
          (form) => form.trim() === ""
        );
      }
      return typeof value !== "string" || value.trim() === "";
    });
    expect(empty).toEqual([]);
  });

  /*
   * Whatever else a language has, it must have `other`: that is the form
   * every fallback lands on.
   */
  it.each(locales)("%s gives every counted sentence a general form", (locale) => {
    const copy = getBuilderCopy(locale) as unknown as Record<string, unknown>;
    for (const group of Object.values(copy)) {
      if (!group || typeof group !== "object") continue;
      for (const value of Object.values(group as Record<string, unknown>)) {
        if (isPluralForms(value)) {
          expect(Object.keys(value as object)).toContain("other");
        }
      }
    }
  });
});
