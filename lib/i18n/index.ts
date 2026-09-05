import { en, type Dictionary } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { ar } from "./dictionaries/ar";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, fr, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export type { Dictionary };
export * from "./config";
