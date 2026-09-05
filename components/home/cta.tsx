import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import type { Dictionary } from "@/lib/i18n";
import { localeHref, type Locale } from "@/lib/i18n/config";
import { ArrowRight } from "lucide-react";

export function CallToAction({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  return (
    <Section className="border-t border-border">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {dict.homeCta.heading}
          </h2>
          <p className="mt-6 text-balance leading-relaxed text-muted-foreground">
            {dict.homeCta.body}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button href={localeHref(lang, "/contact")} variant="accent">
              {dict.homeCta.primary}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button href={localeHref(lang, "/about")} variant="outline">
              {dict.homeCta.secondary}
            </Button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
