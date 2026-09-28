import type { Metadata } from "next";
import { packs, type Pack } from "@/app-ui/packs";
import { getPublicSettings } from "@/builder/db/settings";
import { OPENING } from "@/builder/packs/opening";
import { PackPage } from "@/components/packs/pack-page";
import { locales, type Locale } from "@/lib/i18n/config";
import { getPackPage } from "@/lib/i18n/packs";
import { localisedHref, packRouteId } from "@/lib/i18n/routes";

/*
 * The four trade pages are the same page with different words, so the route
 * is built once and named four times. Each folder under app/[lang] is three
 * lines: which trade, and the two exports Next.js looks for.
 */
export function packRoute(pack: Pack) {
  type Props = { params: Promise<{ lang: Locale }> };

  async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const copy = getPackPage(params.lang, pack);
    const id = packRouteId(pack);
    return {
      title: copy.title,
      description: copy.description,
      alternates: {
        canonical: localisedHref(params.lang, id),
        languages: Object.fromEntries(
          locales.map((locale) => [locale, localisedHref(locale, id)])
        ) as Record<Locale, string>,
      },
    };
  }

  /* Whether the trade is open: builder/packs/opening.ts, like the home page and the builder. */
  async function Page(props: Props) {
    const params = await props.params;
    const settings = await getPublicSettings();
    const open = OPENING[pack] === "open";
    return (
      <PackPage
        lang={params.lang}
        pack={pack}
        open={open}
        trialDays={settings?.trial_days ?? null}
      />
    );
  }

  return { generateMetadata, Page };
}

export { packs };
