import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Replaces {key} placeholders in a translated string. Unknown keys are left as written. */
export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

/*
 * A sentence that has to agree with a number.
 *
 * "1 lignes à corriger" is the kind of thing that makes an owner trust the
 * software a little less, and Arabic is stricter still: it has a form for
 * one, a form for two, and different forms again for three to ten and beyond.
 *
 * Intl.PluralRules knows all of that already, so there is no library here.
 * The copy supplies whichever forms its language uses, and `other` is the one
 * every language must have.
 */
export function plural(
  language: string,
  count: number,
  forms: Readonly<Record<string, string>>
): string {
  const category = new Intl.PluralRules(language).select(count);
  return fill(forms[category] ?? forms.other ?? "", { count });
}
