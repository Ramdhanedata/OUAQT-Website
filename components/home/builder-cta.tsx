import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { organization } from "@/lib/data/contact";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { ArrowRight } from "lucide-react";

/* The last word: build the software now, or talk to us first. */
export function BuilderCta({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const home = dict.builderHome;

  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-accent/10 px-6 py-14 sm:px-12 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{home.ctaHeading}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{home.ctaBody}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button href={localisedHref(lang, "builder")} variant="primary" className="min-h-[48px] justify-center text-base">
                {home.ctaButton}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <Button href={localeHref(lang, "/contact")} variant="outline" className="min-h-[48px] justify-center border-foreground/20 bg-surface/60 text-base">
                {home.ctaTalk}
              </Button>
              <a
                href={organization.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center px-2 text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              >
                {home.ctaWhatsapp}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
