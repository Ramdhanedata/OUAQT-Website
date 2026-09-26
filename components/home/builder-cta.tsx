import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { organization } from "@/lib/data/contact";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { ArrowRight } from "lucide-react";

/* The last word: build the software now, or talk to us first. Plain, like the rest of the page. */
export function BuilderCta({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const home = dict.builderHome;

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container className="max-w-3xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{home.ctaHeading}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{home.ctaBody}</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Button href={localisedHref(lang, "builder")} variant="accent" className="min-h-[48px] justify-center text-base">
            {home.ctaButton}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <a
            href={localeHref(lang, "/contact")}
            className="inline-flex min-h-[48px] items-center text-base text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {home.ctaTalk}
          </a>
          <a
            href={organization.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center text-base text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            {home.ctaWhatsapp}
          </a>
        </div>
      </Container>
    </section>
  );
}
