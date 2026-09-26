import { toMajor } from "@/app-ui/money";
import type { PublicSettings } from "@/builder/db/settings";
import type { LaunchOffer } from "@/builder/payment/launch";
import { perMonthOf, priceFor } from "@/builder/payment/pricing";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatPrice } from "@/lib/data/pricing";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { fill } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";

/*
 * The price, on the home page, now that it has left the top menu: the
 * annual licence and what comes with it, with the full table one click
 * away. Figures come from settings, like the pricing page's; a price nobody
 * has set yet says so instead of showing a zero.
 */
export function PricingTeaser({
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
  const home = dict.builderHome;
  const launch = offer.open !== false;
  const price = settings ? priceFor("annual", settings, launch) : null;
  const monthly = price?.amount ? perMonthOf("annual", price.amount) : null;
  const struck = price?.launch && price.standard !== null && price.standard !== price.amount ? price.standard : null;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const included = [
    settings?.trial_days ? fill(home.pricingTrial, { days: settings.trial_days }) : null,
    settings?.max_devices ? fill(home.pricingDevices, { devices: settings.max_devices }) : null,
    home.pricingUpdates,
    home.pricingPayment,
  ].filter((line): line is string => Boolean(line));

  return (
    <section id="tarifs" className="scroll-mt-20 border-t border-border py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <FadeIn>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{home.pricingEyebrow}</p>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {home.pricingHeading}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{home.pricingBody}</p>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-medium text-foreground">{home.pricingAnnual}</p>
              {price?.amount && price.launch && struck !== null ? (
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-app-gold-ink">{home.pricingLaunch}</span>
              ) : null}
            </div>

            {price?.amount ? (
              <>
                <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {struck !== null ? (
                    <s className="text-lg text-muted-foreground decoration-accent/80">
                      <bdi dir={dir}>{formatPrice(toMajor(struck), lang)}</bdi>
                    </s>
                  ) : null}
                  <span className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    <bdi dir={dir}>{formatPrice(toMajor(price.amount), lang)}</bdi>
                  </span>
                  <span className="text-base text-muted-foreground">{home.pricingPerYear}</span>
                </p>
                {monthly ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {fill(home.pricingMonthly, { amount: formatPrice(toMajor(monthly), lang) })}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{home.pricingSoon}</p>
            )}

            <ul className="mt-7 space-y-3 border-t border-border pt-7">
              {included.map((line) => (
                <li key={line} className="flex items-start gap-3 text-base text-foreground">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  {line}
                </li>
              ))}
            </ul>

            <Button href={localeHref(lang, "/pricing")} variant="outline" className="mt-8 min-h-[48px] w-full justify-center text-base">
              {home.pricingCta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
