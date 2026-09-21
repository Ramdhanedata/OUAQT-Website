import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { organization } from "@/lib/data/contact";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localisedHref } from "@/lib/i18n/routes";
import { ArrowRight } from "lucide-react";

export function BuilderCta({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const home = dict.builderHome;

  return (
    <section className="border-t border-border py-20 sm:py-28">
      <Container className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {home.ctaHeading}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {home.ctaBody}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button href={localisedHref(lang, "builder")} variant="accent">
            {home.ctaButton}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
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
