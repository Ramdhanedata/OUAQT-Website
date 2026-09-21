import type { Pack } from "@/app-ui/packs";
import type { Locale } from "@/lib/i18n/config";
import { packPagesEn, type PackPageCopy, type PackPagesCopy } from "./en";
import { packPagesFr } from "./fr";
import { packPagesAr } from "./ar";

export type { PackPageCopy, PackPagesCopy, PackSection, PackWorry } from "./en";

const byLocale: Record<Locale, PackPagesCopy> = {
  fr: packPagesFr,
  ar: packPagesAr,
  en: packPagesEn,
};

/** Everything one trade's landing page says, in one language. */
export function getPackPage(
  lang: Locale,
  pack: Pack
): PackPageCopy & { common: PackPagesCopy["common"] } {
  const copy = byLocale[lang] ?? packPagesFr;
  return { ...copy[pack], common: copy.common };
}
