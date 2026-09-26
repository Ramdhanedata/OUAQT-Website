import type { Pack } from "@/app-ui/packs";
import { PackScreens } from "@/components/packs/screens";
import { Notify } from "@/components/packs/notify";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FadeIn } from "@/components/motion/fade-in";
import { getDictionary } from "@/lib/i18n";
import { localeHref, locales, type Locale } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/i18n/metadata";
import { getPackPage } from "@/lib/i18n/packs";
import { localisedHref, packRouteId } from "@/lib/i18n/routes";
import { fill } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/*
 * One trade's landing page.
 *
 * This is where a search drops an owner, so it has to answer the question he
 * typed in the first screen and then let him start. The four pages differ
 * only in their words: the layout, the preview and the structured data are
 * the same, which is why there is one component and four thin routes.
 *
 * A trade that is not open yet says so and takes a phone number. It never
 * promises a date, because there is not one.
 */
export function PackPage({
  lang,
  pack,
  open,
  trialDays,
}: {
  lang: Locale;
  pack: Pack;
  open: boolean;
  trialDays: number | null;
}) {
  const dict = getDictionary(lang);
  const copy = getPackPage(lang, pack);
  const base = siteUrl();
  const label = dict.packLabels[pack];
  const href = `${localisedHref(lang, "builder")}?pack=${pack}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": `${base}${localisedHref(lang, packRouteId(pack))}#software`,
          name: `${dict.common.brand} ${label}`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Windows",
          description: copy.description,
          url: `${base}${localisedHref(lang, packRouteId(pack))}`,
          inLanguage: [...locales],
          publisher: { "@id": `${base}/#business` },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: copy.worries.map((worry) => ({
            "@type": "Question",
            name: worry.question,
            acceptedAnswer: { "@type": "Answer", text: worry.answer },
          })),
        }}
      />

      <section className="py-20 sm:py-28">
        <Container className="max-w-3xl">
          <FadeIn>
            <p className="text-base text-muted-foreground">{label}</p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {copy.heading}
            </h1>
            <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
              {copy.intro}
            </p>

            {open ? (
              <>
                <div className="mt-10">
                  <Button
                    href={href}
                    variant="accent"
                    className="min-h-[48px] text-base"
                  >
                    {copy.cta}
                    <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                  </Button>
                </div>
                {trialDays ? (
                  <p className="mt-4 text-base text-muted-foreground">
                    {fill(copy.common.trial, { days: trialDays })}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="mt-10">
                <h2 className="text-xl font-medium text-foreground">
                  {copy.common.soonHeading}
                </h2>
                <Notify dict={{ builderHome: dict.builderHome }} businessType={label} intro={copy.common.soonBody} />
              </div>
            )}
          </FadeIn>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <Container>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {copy.common.doesHeading}
          </h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {copy.does.map((item) => (
              <li key={item.title}>
                <h3 className="text-xl font-medium text-foreground">{item.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <Container>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {copy.common.previewHeading}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {copy.common.previewBody}
          </p>
          <div className="mt-10">
            <PackScreens lang={lang} pack={pack} shopName={label} />
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <Container>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {copy.common.worriesHeading}
          </h2>
          <dl className="mt-12 max-w-3xl divide-y divide-border">
            {copy.worries.map((worry) => (
              <div key={worry.question} className="py-6">
                <dt className="text-xl font-medium text-foreground">
                  {worry.question}
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {worry.answer}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <Container className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {open ? copy.common.closingHeading : copy.common.soonHeading}
          </h2>
          {open ? (
            <>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {copy.common.closingBody}
              </p>
              <div className="mt-8">
                <Button href={href} variant="accent" className="min-h-[48px] text-base">
                  {copy.cta}
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                </Button>
              </div>
            </>
          ) : (
            <Notify dict={{ builderHome: dict.builderHome }} businessType={label} intro={copy.common.soonBody} />
          )}

          <div className="mt-10 flex flex-wrap gap-6">
            <a
              href={localeHref(lang, "/pricing")}
              className="inline-flex min-h-[48px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              {copy.common.pricing}
            </a>
            <a
              href={localeHref(lang, "/")}
              className="inline-flex min-h-[48px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              {copy.common.otherTrades}
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
