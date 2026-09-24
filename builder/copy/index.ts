import type { Locale } from "@/lib/i18n/config";
import { fr, type BuilderCopy } from "./fr";
import { en } from "./en";
import { ar } from "./ar";

const copy: Record<Locale, BuilderCopy> = { fr, en, ar };

export function getBuilderCopy(locale: Locale): BuilderCopy {
  return copy[locale] ?? fr;
}

export type { BuilderCopy };
