import { toMajor } from "@/app-ui/money";
import { monthlyEquivalent, priceFor, type Plan } from "@/builder/payment/pricing";
import type { LaunchOffer } from "@/builder/payment/launch";
import type { PublicSettings } from "@/builder/db/settings";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { formatPrice } from "@/lib/data/pricing";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { fill } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/*
 * The builder's prices, first on the page, because the software an owner can
 * have this afternoon is the main offer now.
 *
 * Every figure comes from the settings table, so a price changes in the admin
 * area and not in a deploy. A price that is not set yet says so instead of
 * showing a zero, which is the honest state of a number nobody has decided.
 *
 * Settings hold the smallest unit. This page prints whole ouguiyas, the way
 * prices are spoken, so each figure is converted once on its way to the page.
 */
export function BuilderPrices({
  dict,
  lang,
  settings,
  offer,
}: {
  dict: Dictionary;
  lang: Locale;
  settings: PublicSettings | null;
  offer: LaunchOffer;
}) {
  const p = dict.pricingPage;
  const b = p.builderTrack;

  /* Until we know the offer has closed, the launch price is the one shown. */
  const launchApplies = offer.open !== false;

  const rows: { plan: Plan; label: string; cadence: string; lead?: boolean }[] = [
    { plan: "annual", label: b.annual.label, cadence: b.annual.cadence, lead: true },
    { plan: "quarterly", label: b.quarterly.label, cadence: b.quarterly.cadence },
    { plan: "perpetual", label: b.perpetual.label, cadence: b.perpetual.cadence },
    { plan: "extra_device", label: b.extraDevice.label, cadence: b.extraDevice.cadence },
    { plan: "setup_visit", label: b.setupVisit.label, cadence: b.setupVisit.cadence },
  ];

  const note =
    offer.open === true && offer.limit && offer.freezeYears
      ? fill(b.launchNote, { clients: offer.limit, years: offer.freezeYears })
      : offer.open === null && offer.limit
        ? fill(b.launchCondition, { clients: offer.limit })
        : null;

  return (
    <Section className="pt-0 sm:pt-0">
      <Container>
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            {b.eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {b.heading}
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            {b.intro}
          </p>
        </FadeIn>

        <FadeIn>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
            {note ? (
              <div className="border-b border-border px-6 py-5 sm:px-8">
                <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
              </div>
            ) : null}

            <dl className="divide-y divide-border">
              {rows.map((row) => {
                const price = settings ? priceFor(row.plan, settings, launchApplies) : null;
                const monthly =
                  row.plan === "annual" && price?.amount
                    ? monthlyEquivalent(price.amount)
                    : null;

                return (
                  <div
                    key={row.plan}
                    className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-8"
                  >
                    <dt className="max-w-md">
                      <span className="block text-base font-medium tracking-tight text-foreground">
                        {row.label}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {row.cadence}
                      </span>
                      {monthly ? (
                        <span className="mt-2 block text-sm text-muted-foreground">
                          {fill(b.monthly, {
                            amount: formatPrice(toMajor(monthly), lang),
                          })}
                        </span>
                      ) : null}
                    </dt>
                    <dd className="shrink-0 sm:text-end">
                      <SettingsPrice
                        price={price}
                        lang={lang}
                        soon={b.soon}
                        labels={{ standard: p.standardLabel, launch: p.launchLabel }}
                        size={row.lead ? "lg" : "sm"}
                      />
                    </dd>
                  </div>
                );
              })}
            </dl>

            <div className="border-t border-border px-6 py-6 sm:px-8">
              {settings?.trial_days ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {fill(b.trial, { days: settings.trial_days })}
                </p>
              ) : null}
              {settings?.max_devices ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {fill(b.devices, { devices: settings.max_devices })}
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {b.payment}
              </p>

              <div className="mt-6">
                <Button
                  href={localisedHref(lang, "builder")}
                  variant="accent"
                  className="justify-center"
                >
                  {b.cta}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}

const sizes = {
  sm: { current: "text-lg sm:text-xl", previous: "text-sm" },
  lg: { current: "text-4xl sm:text-5xl", previous: "text-lg" },
};

/*
 * One price from settings. While the launch offer is open the standard figure
 * is struck beside it, with a hidden label on each so a screen reader says
 * which is which rather than reading two numbers in a row.
 */
function SettingsPrice({
  price,
  lang,
  soon,
  labels,
  size,
}: {
  price: { amount: number | null; standard: number | null; launch: boolean } | null;
  lang: Locale;
  soon: string;
  labels: { standard: string; launch: string };
  size: keyof typeof sizes;
}) {
  if (!price || price.amount === null) {
    return <span className="text-base text-muted-foreground">{soon}</span>;
  }

  const struck =
    price.launch && price.standard !== null && price.standard !== price.amount
      ? price.standard
      : null;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {struck !== null ? (
        <>
          <span className="sr-only">{labels.standard}</span>
          <s className={`text-muted-foreground decoration-accent/80 ${sizes[size].previous}`}>
            <bdi dir={dir}>{formatPrice(toMajor(struck), lang)}</bdi>
          </s>
          <span className="sr-only">{labels.launch}</span>
        </>
      ) : null}
      <span className={`font-semibold tracking-tight text-foreground ${sizes[size].current}`}>
        <bdi dir={dir}>{formatPrice(toMajor(price.amount), lang)}</bdi>
      </span>
    </span>
  );
}
