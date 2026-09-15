import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { Price } from "@/components/pricing/price";
import { organization } from "@/lib/data/contact";
import { pricing, pricingTerms, type PriceLine } from "@/lib/data/pricing";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

type Row = {
  label: string;
  cadence: string;
  note?: string;
  line: PriceLine;
};

/*
 * Installation and the annual licence together. The same prices apply to every
 * packaged product, so this block is rendered once and never per product.
 */
export function PriceBook({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const p = dict.pricingPage;
  const terms = pricingTerms(lang);
  const launch = pricing.launchOffer.active;
  const labels = { standard: p.standardLabel, launch: p.launchLabel };

  const rows: Row[] = [
    {
      label: p.installation.label,
      cadence: p.installation.cadence,
      line: pricing.installation,
    },
    {
      label: p.annual.label,
      cadence: p.annual.cadence,
      note: launch ? fill(p.annual.freeze, terms) : undefined,
      line: pricing.annualLicence,
    },
  ];

  return (
    <Section className="pt-0 sm:pt-0">
      <Container>
        <FadeIn>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-6 py-5 sm:px-8">
              <p className="text-sm font-medium text-foreground">{p.scope}</p>
              {launch ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {fill(p.launchScope, terms)}
                </p>
              ) : null}
            </div>

            <dl className="divide-y divide-border">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-8"
                >
                  <dt className="max-w-md">
                    <span className="block text-base font-medium tracking-tight text-foreground">
                      {row.label}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {row.cadence}
                    </span>
                    {row.note ? (
                      <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                        {row.note}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="shrink-0 sm:text-end">
                    <Price line={row.line} lang={lang} labels={labels} />
                  </dd>
                </div>
              ))}

              <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8">
                <dt className="text-sm text-muted-foreground">
                  {fill(p.extraDevice.label, terms)}
                  <span className="text-muted-foreground/70">
                    {" · "}
                    {p.extraDevice.cadence}
                  </span>
                </dt>
                <dd className="shrink-0 sm:text-end">
                  <Price
                    line={pricing.extraDevice}
                    lang={lang}
                    labels={labels}
                    size="sm"
                  />
                </dd>
              </div>
            </dl>

            <div className="border-t border-border px-6 py-6 sm:px-8">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {p.renewal}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {p.lateRenewal}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  href={localeHref(lang, "/contact")}
                  variant="accent"
                  className="justify-center"
                >
                  {p.contact}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <Button
                  href={organization.whatsappUrl}
                  variant="outline"
                  target="_blank"
                  rel="noreferrer"
                  className="justify-center"
                >
                  {p.whatsapp}
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <p className="mt-8 max-w-2xl leading-relaxed text-muted-foreground">
            <ProductsLine
              template={p.products}
              names={p.productNames}
              lang={lang}
            />
          </p>
        </FadeIn>
      </Container>
    </Section>
  );
}

/* Names only, never prices: the price above already covers every product. */
function ProductsLine({
  template,
  names,
  lang,
}: {
  template: string;
  names: Dictionary["pricingPage"]["productNames"];
  lang: Locale;
}) {
  return (
    <>
      {template.split(/(\{\w+\})/).map((part, index) => {
        const key = part.match(/^\{(\w+)\}$/)?.[1];
        const product = pricing.coveredProducts.find((item) => item.key === key);
        if (!product) return <Fragment key={index}>{part}</Fragment>;
        return (
          <Link
            key={index}
            href={localeHref(lang, `/projects/${product.slug}`)}
            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-accent"
          >
            {names[product.key]}
          </Link>
        );
      })}
    </>
  );
}
