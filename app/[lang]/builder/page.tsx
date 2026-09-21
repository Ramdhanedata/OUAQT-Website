import { packs, type Pack } from "@/app-ui/packs";
import { Builder } from "@/builder/ui/builder";
import { getPublicSettings } from "@/builder/db/settings";
import { getBuilderCopy } from "@/builder/copy";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { locales } from "@/lib/i18n/config";
import type { Metadata } from "next";

type Props = {
  params: { lang: Locale };
  searchParams?: { pack?: string };
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  const copy = getBuilderCopy(params.lang);
  const dict = getDictionary(params.lang);
  return {
    title: `${copy.landing.title} | ${dict.common.brand}`,
    description: copy.landing.intro,
    alternates: {
      canonical: localisedHref(params.lang, "builder"),
      languages: Object.fromEntries(
        locales.map((locale) => [locale, localisedHref(locale, "builder")])
      ) as Record<Locale, string>,
    },
  };
}

/*
 * Which packs are open, and the number behind the help button, are read here
 * rather than in the browser: the answer is the same for everybody, so it is
 * fetched once and cached for the whole site instead of once per owner.
 *
 * When settings cannot be read, no pack is open. Every business type then
 * shows "coming soon" and takes a phone number, which is the honest state of
 * a builder that cannot save anything anyway.
 */
export default async function BuilderPage({ params, searchParams }: Props) {
  const settings = await getPublicSettings();
  const enabled = (settings?.enabled_packs ?? []).filter((name): name is Pack =>
    (packs as readonly string[]).includes(name)
  );

  /* ?pack=pharmacy, the way the four trade pages link here. */
  const asked = searchParams?.pack;
  const startPack = enabled.find((name) => name === asked) ?? null;

  return (
    <Builder
      copy={getBuilderCopy(params.lang)}
      locale={params.lang}
      enabledPacks={enabled}
      startPack={startPack}
      supportWhatsapp={settings?.support_whatsapp ?? null}
      maxDevices={settings?.max_devices ?? null}
      installers={{
        windows: process.env.INSTALLER_URL_WINDOWS || null,
        mac: process.env.INSTALLER_URL_MAC || null,
      }}
      tutorials={{
        windows: settings?.tutorial_video_windows_url || null,
        mac: settings?.tutorial_video_mac_url || null,
      }}
      termsHref={`/${params.lang}/terms`}
    />
  );
}
