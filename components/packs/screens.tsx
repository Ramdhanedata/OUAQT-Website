"use client";

import dynamic from "next/dynamic";
import type { Pack } from "@/app-ui/packs";
import { getBuilderCopy } from "@/builder/copy";
import type { Locale } from "@/lib/i18n/config";

/*
 * The same preview the builder shows, on the trade's landing page.
 *
 * It carries the app screens, the receipt and the schema with it, which is a
 * lot for a page somebody reached from a search. It is fetched only once the
 * browser is idle, and the page reads perfectly without it.
 */
const Preview = dynamic(
  () => import("@/builder/ui/preview").then((m) => m.Preview),
  {
    ssr: false,
    loading: () => <div className="h-[520px] animate-pulse rounded-xl bg-muted/40" />,
  }
);

export function PackScreens({
  lang,
  pack,
  shopName,
}: {
  lang: Locale;
  pack: Pack;
  shopName: string;
}) {
  return (
    <div className="h-[520px] overflow-hidden rounded-xl border border-border">
      <Preview
        copy={getBuilderCopy(lang)}
        answers={{
          pack,
          builderLanguage: lang,
          appLanguage: lang,
          nameLatin: shopName,
        }}
        fallbackLanguage={lang}
      />
    </div>
  );
}
