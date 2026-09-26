import { packs, type Pack } from "@/app-ui/packs";
import { BuilderCta } from "@/components/home/builder-cta";
import { BuilderFaq } from "@/components/home/builder-faq";
import { BuilderHero } from "@/components/home/builder-hero";
import { BuilderImpact } from "@/components/home/builder-impact";
import { BuilderProduct } from "@/components/home/builder-product";
import { CustomPath } from "@/components/home/custom-path";
import { Features } from "@/components/home/features";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { Trades } from "@/components/home/trades";
import { Why } from "@/components/home/why";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicSettings } from "@/builder/db/settings";
import { getLaunchOffer } from "@/builder/payment/launch";
import { openPacks } from "@/builder/packs/opening";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref, packRouteId } from "@/lib/i18n/routes";
import { softwareApplicationData } from "@/lib/seo/software-application";

/*
 * The home page of a company with one product and a second trade.
 *
 * The Builder first, because it is the product: what it is, the software
 * itself running, what it does, which trades it serves, why a small business
 * can trust it and what it costs. Then the custom work, set apart as the
 * second offer, and the questions people ask.
 *
 * Which trades are open and how long the trial runs are read from settings,
 * so this page follows the admin area rather than a deploy.
 */
export default async function Home({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  const settings = await getPublicSettings();
  const offer = await getLaunchOffer();

  /* Which trades are open: builder/packs/opening.ts. */
  const enabled = openPacks();

  /*
   * An open trade goes straight into the builder with the trade already
   * chosen: one tap from the home page to the first question. Its own page,
   * which is what a search finds, sits beside it as a second link for the
   * owner who wants to read before he starts.
   */
  const builder = localisedHref(params.lang, "builder");
  const packHrefs = Object.fromEntries(
    packs.map((pack) => [pack, `${builder}?pack=${pack}`])
  ) as Record<Pack, string>;
  const packPages = Object.fromEntries(
    packs.map((pack) => [pack, localisedHref(params.lang, packRouteId(pack))])
  ) as Record<Pack, string>;

  return (
    <>
      <JsonLd data={softwareApplicationData(params.lang, dict)} />
      <BuilderHero dict={dict} lang={params.lang} trialDays={settings?.trial_days ?? null} />
      <BuilderImpact dict={dict} />
      <BuilderProduct dict={dict} lang={params.lang} demoPacks={enabled.length > 0 ? enabled : [...packs]} />
      <Features dict={dict} />
      <Trades dict={{ builderHome: dict.builderHome, packLabels: dict.packLabels }} enabledPacks={enabled} packHrefs={packHrefs} packPages={packPages} />
      <Why dict={dict} />
      <PricingTeaser dict={dict} lang={params.lang} settings={settings} offer={offer} />
      <CustomPath dict={dict} lang={params.lang} />
      <BuilderFaq dict={dict} />
      <BuilderCta dict={dict} lang={params.lang} />
    </>
  );
}
