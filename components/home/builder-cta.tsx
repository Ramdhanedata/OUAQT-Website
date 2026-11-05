import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { organization } from "@/lib/data/contact";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { ArrowRight, MessageCircle } from "lucide-react";

/* The last word: build the software now, or talk to us first. One dark panel, the page's only one besides the tour's. */
export function BuilderCta({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const home = dict.builderHome;

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-foreground px-6 py-16 text-center text-background sm:px-12 sm:py-20">
          <div aria-hidden className="glow-gold absolute left-1/2 top-full -z-10 h-[34rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 opacity-70" />
          <h2 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{home.ctaHeading}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-background/70">{home.ctaBody}</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={localisedHref(lang, "builder")} variant="accent" className="min-h-[52px] px-7 text-base">
              {home.ctaButton}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <a
              href={organization.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/20 px-7 text-base font-medium text-background transition-colors hover:border-white/50"
            >
              <MessageCircle className="h-4 w-4" />
              {home.ctaWhatsapp}
            </a>
          </div>
          <a
            href={localeHref(lang, "/contact")}
            className="mt-4 inline-flex min-h-[44px] items-center text-sm text-background/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-background"
          >
            {home.ctaTalk}
          </a>
        </div>
      </Container>
    </section>
  );
}
