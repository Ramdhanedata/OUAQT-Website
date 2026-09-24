import { packs, type Pack } from "@/app-ui/packs";
import { BuilderCta } from "@/components/home/builder-cta";
import { BuilderFaq } from "@/components/home/builder-faq";
import { BuilderHero } from "@/components/home/builder-hero";
import { BuilderImpact } from "@/components/home/builder-impact";
import { CustomPath } from "@/components/home/custom-path";
import { HowItWorks } from "@/components/home/how-it-works";
import { Problem } from "@/components/home/problem";
import { Proof } from "@/components/home/proof";
import { Trades } from "@/components/home/trades";
import { Worries } from "@/components/home/worries";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicSettings } from "@/builder/db/settings";
import { openPacks } from "@/builder/packs/opening";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref, packRouteId } from "@/lib/i18n/routes";
import { softwareApplicationData } from "@/lib/seo/software-application";

/*
 * The home page, in the order an owner asks his questions.
 *
 * What is my problem, what do you do about it, what will it cost me in time,
 * is it for my trade, what happens when the internet goes, has anyone else
 * done this, and only then: what if my business is unlike any other.
 *
 * Which trades are open and how long the trial runs are read from settings,
 * so this page follows the admin area rather than a deploy.
 */
export default async function Home({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  const settings = await getPublicSettings();

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
      <Problem dict={dict} />
      <HowItWorks dict={dict} />
      <Trades
        dict={dict}
        lang={params.lang}
        enabledPacks={enabled}
        packHrefs={packHrefs}
        packPages={packPages}
      />
      <Worries dict={dict} />
      <Proof dict={dict} lang={params.lang} />
      <CustomPath dict={dict} lang={params.lang} />
      <BuilderFaq dict={dict} />
      <BuilderCta dict={dict} lang={params.lang} />
    </>
  );
}
